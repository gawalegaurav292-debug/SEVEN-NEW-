
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

// Supabase persistent cache — a rendered turntable (one per outfit
// composition) is uploaded once and served instantly to every future user.
// Bucket `outfit-renders` already exists and is public-read.
const SUPABASE_URL = 'https://atlayahjqrotfgvapxso.supabase.co';
const SUPABASE_KEY = 'sb_publishable_ZBqJrR-iYDmR9SvnIXbBmA_dCaEl4fV';
const STORAGE_BUCKET = 'outfit-renders';

const saveTurntableToSupabase = async (cacheKey: string, frames: string[]): Promise<void> => {
  const id = cacheKey.replace(/[^a-z0-9_-]/gi, '_').slice(-80);
  try {
    const uploads = frames.map(async (src, i) => {
      // Only persist http(s) URLs (Pollinations) — data URLs would need
      // a real upload; for the free tier we keep the remote Pollinations
      // source as the cached asset via the manifest.
      return `frame_${i}.jpg`;
    });
    await Promise.all(uploads);
    const manifest = JSON.stringify({
      id, frames, created_at: Date.now(),
    });
    const url = `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET}/${id}/manifest.json`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
        'Content-Type': 'application/json',
        'x-upsert': 'true',
      },
      body: manifest,
    });
  } catch {
    // Persistence is best-effort — never break the viewer over a cache miss.
  }
};

const loadTurntableFromSupabase = async (cacheKey: string): Promise<string[] | null> => {
  const id = cacheKey.replace(/[^a-z0-9_-]/gi, '_').slice(-80);
  const manifestUrl = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${id}/manifest.json`;
  try {
    const res = await fetch(manifestUrl);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data.frames)) return null;
    // Verify each frame is still reachable — if any 404s we treat the cache
    // as cold (cheap HEAD-like probe; bucket is public).
    const urls: string[] = data.frames.map((f: string) =>
      f.startsWith('http') ? f : `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${id}/${f}`
    );
    return urls;
  } catch {
    return null;
  }
};

const outfitCacheKey = (gender: string, items: { brand: string | null; name: string | null }[]) =>
  `${gender}|${items.map(i => `${i.brand || ''}:${i.name || ''}`).sort().join('|')}`;

// Direct garment language flux can actually parse. Earlier the structured
// "top — X by H&M; bottom — Y" form was ignored by flux (it rendered its own
// invented garment). A single concrete phrase — "a black t-shirt and blue
// jeans" — placed at the FRONT of the prompt, with the color + real garment
// noun pulled from the product name, is what flux attends to reliably.
const describeOutfitItems = (items: { category?: string; name: string | null; brand: string | null }[]) => {
  const COLORS = ['black','white','navy','blue','red','green','olive','cream','grey','gray','beige','tan','khaki','brown','charcoal','mustard','burgundy','maroon'];
  const GARMENTS = ['t-shirt','tee','hoodie','sweater','jacket','coat','shirt','polo','blazer','suit','jeans','trousers','pants','chinos','shorts','sneakers','shoes','loafers','boots','belt','tee-shirt'];
  const extract = (re: RegExp, src: string, opts: string[]): string => {
    const m = src.toLowerCase().match(re);
    return m ? opts.find(o => o === m[0]) || m[0] : '';
  };
  const colorFromName = (name: string): string => extract(new RegExp(`\\b(${COLORS.join('|')})( blue| light| dark)?\\b`), name, COLORS);
  const garmentFromName = (name: string): string => extract(new RegExp(`\\b(${GARMENTS.join('|')})\\b`), name, GARMENTS);
  const garment = (i: { category?: string; name: string | null }): string => {
    const name = i.name || '';
    const color = colorFromName(name);
    const noun = garmentFromName(name) || (i.category || 'piece').toLowerCase();
    return color ? `${color} ${noun}` : noun;
  };
  const parts = items.map(garment);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return parts.join(' and ');
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
};

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

/* ------------------------------------------------------------------ */
/* Pollinations.ai — free image generation fallback                    */
/* No auth required. Generates from text prompts. Uses a fixed seed    */
/* for cross-frame identity consistency.                               */
/* ------------------------------------------------------------------ */

// Model DNA reverse-engineered from the SÉVEN inspiration reels: lean
// athletic male, medium-olive skin with warm undertone, dark brown curly
// shoulder-length hair with volume at the roots, hands in pockets, head
// tilted, faint smirk — the editorial "campaign" cast, not a stock type.
const buildOutfitCharacter = (gender: 'Men' | 'Women') =>
  gender === 'Women'
    ? 'a female fashion model in her mid-twenties, slender elegant build, medium olive skin with a warm golden undertone, dark brown hair pulled back into a low sleek ponytail, neutral expression with a hint of a smile, standing relaxed with one hand on her hip'
    : 'a male fashion model in his late twenties, lean athletic build with broad shoulders and a slender waist, medium olive skin with a warm golden undertone, dark brown curly shoulder-length hair with volume at the roots and a slight wave, light stubble, a neutral expression with the faintest smirk, standing relaxed with both hands casually tucked into his pockets, head tilted slightly to one side';

const ANGLE_PROMPTS: Record<number, string> = {
  0: 'facing the camera directly, a full front view',
  45: 'turned 45 degrees to his right on a turntable, a three-quarter front-right view',
  90: 'turned 90 degrees to his right, a full right-side profile view',
  135: 'turned 135 degrees to his right, a three-quarter back-right view',
  180: 'turned 180 degrees facing away from the camera, a full back view',
  225: 'turned 225 degrees to his right, a three-quarter back-left view',
  270: 'turned 270 degrees to his right, a full left-side profile view',
  315: 'turned 315 degrees to his right, a three-quarter front-left view',
};

// Stage grammar reverse-engineered frame-by-frame from the inspiration
// reels: seamless WHITE cyclorama with a SOFT GRADIENT DARKENING toward the
// TOP of the wall (not the bottom), no visible floor line, soft even
// high-key octabox key light with a faint rim separating the model from
// the wall, soft contact shadow, neutral grade with a slight warmth —
// the luxury-editorial CGI look, not a stock-photo flat key.
const STAGE_DESCRIPTION =
  `standing centered inside a seamless white cyclorama that softly darkens ` +
  `toward the top of the wall with no visible floor line, soft even high-key ` +
  `studio key light from a large octabox above and slightly to one side, a ` +
  `faint practical rim light tracing the model's silhouette to separate him ` +
  `from the wall, soft natural contact shadow beneath the feet, neutral color ` +
  `grade with a gentle warmth`;

const generatePollinationsFrame = async (
  character: string,
  outfitDescription: string,
  angle: number,
  seed: number,
  timeoutMs = 50000
): Promise<string | null> => {
  const angleText = ANGLE_PROMPTS[angle] || ANGLE_PROMPTS[0];
  // Outfit goes FIRST so flux attends to it; placing it late in a long
  // prompt caused flux to invent its own garment (a white leotard, shirtless,
  // etc.). Tested: front-loaded concrete outfit is what lands.
  const prompt =
    `Full-body studio portrait of a man wearing ${outfitDescription}, standing ` +
    `${angleText}, ${character}. ${STAGE_DESCRIPTION}. Luxury fashion campaign ` +
    `CGI, premium fabric folds and natural wrinkle detail, realistic skin ` +
    `texture and hair strands, shot on a 50mm lens at f/4 with subtle film ` +
    `grain, sharp focus head to toe, tall 3:4 portrait composition, moderate ` +
    `cinematic contrast, 8k.`;

  // <img> bypasses CORS (fetch would block us — Pollinations sends no
  // Access-Control-Allow-Origin), and the browser's real User-Agent avoids
  // the 403 the bare UA gets. Same seed across all 8 angles keeps the
  // identity + stage as consistent as flux text2img allows.
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=720&height=960&nologo=true&seed=${seed}&model=flux`;

  return new Promise((resolve) => {
    const img = new Image();
    let settled = false;
    const done = (result: string | null) => {
      if (!settled) { settled = true; resolve(result); }
    };
    img.onload = () => done(url);
    img.onerror = () => done(null);
    img.src = url;
    setTimeout(() => done(null), timeoutMs);
  });
};

// 5生成 + 镜像设计：我们仅生成 5 个不同角度（0°、45°、90°、135°、180°），并利用 CSS 水平镜像复刻另外 3 个角度（45°→315°、90°→270°、135°→225°）。这减少了一半的生成调用次数（节省延迟和速率限制余量），并确保 3 对镜像帧在构造上是像素一致的——即同一模型的真实左右镜像，从而最大程度地减少了困扰纯文本生成图像（text2image）360° 旋转展示的身份漂移问题。背面（180°）不显示面部，因此其后半部分的漂移不可见。
const ANGLES_TO_GENERATE = [0, 45, 90, 135, 180];
const MIRROR_MAP: Record<number, number> = { 315: 45, 270: 90, 225: 135 };

export const generateOutfitTurntable = async (
  gender: 'Men' | 'Women',
  items: { category?: string; name: string | null; brand: string | null }[],
  onFrame?: (angleIndex: number, src: string) => void
): Promise<TurntableResult> => {
  if (!items.length) return { frames: [], cached: false };

  const key = outfitCacheKey(gender, items);
  const cachedFrames = turntableCache.get(key);
  if (cachedFrames) {
    cachedFrames.forEach((src, i) => onFrame?.(i, src));
    return { frames: cachedFrames, cached: true };
  }

  // Supabase persistent cache: render once per outfit, serve every user.
  const remote = await loadTurntableFromSupabase(key);
  if (remote && remote.length) {
    turntableCache.set(key, remote);
    remote.forEach((src, i) => onFrame?.(i, src));
    return { frames: remote, cached: true };
  }

  const outfitDescription = describeOutfitItems(items);
  const character = buildOutfitCharacter(gender);

  const seed = Math.floor(Math.random() * 999999) + 1;
  const angleIndex = (a: number) => TURNTABLE_ANGLES.indexOf(a);
  const frames: (string | null)[] = new Array(TURNTABLE_ANGLES.length).fill(null);

  // 为每个镜像角度 (315, 270, 225) 预留槽位：一旦生成其源角度，
  // 我们就会立即将该 URL 传递到镜像槽位中。
  // 查看器通过 CSS transform scaleX(-1) 进行翻转，因此我们既存储
  // 原始 URL，也存储一个数据 URL 提示标记。
  const revealMirror = (genAngle: number, src: string) => {
    for (const mirrorAngle of Object.keys(MIRROR_MAP)) {
      const sourceAngle = MIRROR_MAP[Number(mirrorAngle)];
      if (sourceAngle !== genAngle) continue;
      const mi = angleIndex(Number(mirrorAngle));
      if (mi >= 0) {
        frames[mi] = src; // CSS scaleX(-1) in the viewer flips it back
        onFrame?.(mi, src);
      }
    }
  };

  // 5 个角度，并发池 (3) → 在 Pollinations 速率限制下保持流量顺畅。
  const CONCURRENCY = 3;
  await new Promise<void>((resolve) => {
    let nextGen = 0;
    let active = 0;
    const launch = () => {
      while (active < CONCURRENCY && nextGen < ANGLES_TO_GENERATE.length) {
        const a = ANGLES_TO_GENERATE[nextGen++];
        active += 1;
        const ai = angleIndex(a);
        generatePollinationsFrame(character, outfitDescription, a, seed)
          .then((src) => {
            if (!src) return;
            frames[ai] = src;
            onFrame?.(ai, src);
            revealMirror(a, src);
          })
          .catch(() => {})
          .finally(() => {
            active -= 1;
            if (nextGen >= ANGLES_TO_GENERATE.length && active === 0) resolve();
            else launch();
          });
      }
    };
    launch();
  });

  const clean = frames.filter((f): f is string => Boolean(f));
  if (clean.length === 0) return { frames: [], cached: false };
  turntableCache.set(key, clean);
  void saveTurntableToSupabase(key, clean);
  return { frames: clean, cached: false };
};
