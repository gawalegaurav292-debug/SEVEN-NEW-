
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { buildOutfit } from "../advancedMatcher";
import { DecisionContext, DecisionResult } from "../types";

const createAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getDecision = async (ctx: DecisionContext): Promise<DecisionResult> => {
  const result = buildOutfit(ctx.refinement, ctx.gender, ctx.investment);
  if (result.status === 'UNAVAILABLE') return result;

  try {
    const ai = createAI();
    const prompt = `Stylist Commentary: You are SÉVEN, a minimalist fashion authority. Explain why this outfit (${result.items.map(i => i.name).join(' + ')}) is superior for a ${ctx.gender} profile. Mention silhouette or quality. Max 12 words.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [{ text: prompt }] },
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return { ...result, reason: response.text?.trim() || result.reason };
  } catch (e) {
    return result;
  }
};

// Canonical entry point used by the Decision Engine flow (pages/DecisionEngine).
export const closeClothingDecision = getDecision;

export const groundedShopSearch = async (query: string) => {
  const ai = createAI();
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: { parts: [{ text: `Act as a luxury personal shopper. Retrieve the official retail nodes and current season availability for: ${query}. Return a definitive verdict.` }] },
    config: { tools: [{ googleSearch: {} }] },
  });
  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const analyzeStyleImage = async (base64: string) => {
  const ai = createAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64 } },
        { text: "Extract aesthetic DNA from this look. Output JSON: { aesthetic: string, palette: string[], keyItems: string[], context: string }." }
      ]
    },
    config: { 
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          aesthetic: { type: Type.STRING },
          palette: { type: Type.ARRAY, items: { type: Type.STRING } },
          keyItems: { type: Type.ARRAY, items: { type: Type.STRING } },
          context: { type: Type.STRING }
        },
        required: ['aesthetic', 'palette', 'keyItems']
      }
    }
  });
  return JSON.parse(response.text || '{}');
};

export const generateDreamOutfit = async (prompt: string): Promise<string | null> => {
  const ai = createAI();
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { text: `High-end minimalist fashion campaign photo of: ${prompt}. Editorial style, soft architectural lighting, premium texture detail, 8k.` }
      ]
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4"
      }
    }
  });

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
  }
  return null;
};

export const connectLiveStylist = async (callbacks: any) => {
  const ai = createAI();
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: 'You are SÉVEN, a world-class AI fashion stylist. You speak with extreme authority, brevity, and luxury. Your role is to guide the user toward a minimalist, high-quality wardrobe. You focus on silhouette, materials, and archival quality over trends.',
    },
  });
};

/* ------------------------------------------------------------------ */
/* 3D Photoreal Outfit Turntable                                       */
/* Generates a 360° spin of a studio model wearing the exact result    */
/* outfit. Frame 0 is the master shot; frames 1..7 are consistency     */
/* edits referencing frame 0, so identity/outfit stay locked.          */
/* ------------------------------------------------------------------ */

export interface TurntableResult {
  frames: string[];
  cached: boolean;
}

const TURNTABLE_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const turntableCache = new Map<string, string[]>();

const outfitCacheKey = (gender: string, items: { brand: string | null; name: string | null }[]) =>
  `${gender}|${items.map(i => `${i.brand || ''}:${i.name || ''}`).sort().join('|')}`;

const describeOutfitItems = (items: { category?: string; name: string | null; brand: string | null }[]) =>
  items
    .map(i => `${(i.category || 'item').toLowerCase()} — ${i.name || 'piece'}${i.brand ? ` by ${i.brand}` : ''}`)
    .join('; ');

const extractImagePart = (response: any): string | null => {
  const parts = response?.candidates?.[0]?.content?.parts;
  if (!parts) return null;
  for (const part of parts) {
    if (part.inlineData?.data) {
      return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
    }
  }
  return null;
};

const ANGLE_DESCRIPTIONS: Record<number, string> = {
  45: 'rotated 45 degrees clockwise, a three-quarter front view',
  90: 'rotated 90 degrees clockwise, a full right-side profile view',
  135: 'rotated 135 degrees clockwise, a three-quarter back-right view',
  180: 'rotated 180 degrees, a full back view',
  225: 'rotated 225 degrees clockwise, a three-quarter back-left view',
  270: 'rotated 270 degrees clockwise, a full left-side profile view',
  315: 'rotated 315 degrees clockwise, a three-quarter front-left view',
};

const generateTurntableFrame = async (
  ai: GoogleGenAI,
  prompt: string,
  referenceImage?: string | null
): Promise<string | null> => {
  const parts: Array<Record<string, unknown>> = [];
  if (referenceImage) {
    parts.push({
      inlineData: { mimeType: 'image/png', data: referenceImage.split(',')[1] },
    });
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: {
      imageConfig: { aspectRatio: '3:4' },
    },
  });
  return extractImagePart(response);
};

export const generateOutfitTurntable = async (
  gender: 'Men' | 'Women',
  items: { category?: string; name: string | null; brand: string | null }[]
): Promise<TurntableResult> => {
  if (!items.length) return { frames: [], cached: false };

  const key = outfitCacheKey(gender, items);
  const cachedFrames = turntableCache.get(key);
  if (cachedFrames) return { frames: cachedFrames, cached: true };

  if (!process.env.API_KEY) return { frames: [], cached: false };

  const ai = createAI();
  const outfitDescription = describeOutfitItems(items);

  try {
    const masterPrompt =
      `Photorealistic full-body editorial fashion photograph of a ${gender.toLowerCase()} model, ` +
      `standing relaxed with hands in pockets, centered, facing the camera, wearing exactly: ${outfitDescription}. ` +
      `Bright seamless white studio background, high-key soft directional lighting, subtle realistic contact shadow ` +
      `beneath the feet on the floor, luxury e-commerce campaign look, premium fabric texture detail, sharp focus, 8k. ` +
      `The model fills the full 3:4 frame head-to-toe.`;

    const frame0 = await generateTurntableFrame(ai, masterPrompt);
    if (!frame0) throw new Error('master frame generation failed');

    const rotationFrames = await Promise.all(
      TURNTABLE_ANGLES.slice(1).map(async (angle) => {
        const prompt =
          `Using the reference image: the exact same model, identical outfit, identical light studio background, ` +
          `identical camera distance and framing — but the model is ${ANGLE_DESCRIPTIONS[angle]}. ` +
          `Keep identity, garment details, colors, lighting and background perfectly consistent.`;
        try {
          return await generateTurntableFrame(ai, prompt, frame0);
        } catch {
          return null;
        }
      })
    );

    const frames = [frame0, ...rotationFrames].filter((f): f is string => Boolean(f));

    if (frames.length < 2) {
      // Not enough angles for a spin — degrade to a single hero image if possible.
      if (frames.length === 1) {
        turntableCache.set(key, frames);
        return { frames, cached: false };
      }
      throw new Error('insufficient frames');
    }

    turntableCache.set(key, frames);
    return { frames, cached: false };
  } catch {
    // Total failure — try a single dream-outfit hero as the graceful fallback.
    try {
      const hero = await generateDreamOutfit(outfitDescription);
      if (hero) return { frames: [hero], cached: false };
    } catch {
      // fall through
    }
    return { frames: [], cached: false };
  }
};
