
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
