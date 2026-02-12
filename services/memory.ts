
import { UserMemory, DecisionResult, SlotItem, SlotStatus } from '../types';

const STORAGE_KEY = 'seven_dna_memory';

export const getMemory = (): UserMemory => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    return {
      tasteVector: { color: {}, fit: 'Regular', brands: [] },
      history: []
    };
  }
  const memory = JSON.parse(data);
  if (!memory.tasteVector) memory.tasteVector = { color: {}, fit: 'Regular', brands: [] };
  return memory;
};

export const getAestheticDNA = (): string => {
  const memory = getMemory() as any;
  const colors = Object.keys(memory.tasteVector.color || {}).slice(0, 2);
  const fit = memory.tasteVector.fit || 'Regular';
  const brands = (memory.tasteVector.brands || []).slice(0, 3);
  
  if (colors.length === 0 && brands.length === 0 && fit === 'Regular') return "No established DNA.";
  
  return `Bias: colors(${colors.join(',')}), brands(${brands.join(',')}), fit(${fit})`;
};

export const getRotatedMicroCopy = (category: 'CONFIDENCE' | 'BUDGET' | 'AUTHORITY' | 'DELIGHT'): string => {
  const options = {
    CONFIDENCE: ["Archival integrity verified.", "Structural stability optimized.", "Silhouette parity achieved."],
    BUDGET: ["Investment efficiency optimal.", "Value density maximized.", "Fiscal boundaries respected."],
    AUTHORITY: ["SÉVEN Core protocol active.", "Curation authority established.", "Aesthetic governance applied."],
    DELIGHT: ["Peak relevance detected.", "Visual harmony established.", "Editorial finish confirmed."]
  };
  const list = options[category];
  return list[Math.floor(Math.random() * list.length)];
};

export const shouldShowConfidenceLine = (): boolean => {
  const memory = getMemory();
  return memory.history.length >= 2 && Math.random() > 0.65;
};

export const getConfidenceLine = (): string => {
  const lines = [
    "Aligns with your usual profile.",
    "Fits your established rhythm.",
    "Matches your past selections.",
    "Consistent with your wardrobe DNA."
  ];
  return lines[Math.floor(Math.random() * lines.length)];
};

export const applyStabilityAnchor = (newItems: SlotItem[]): SlotItem[] => {
  const memory = getMemory();
  if (memory.history.length === 0) return newItems;

  const lastSuccessful = memory.history.find(h => h.status === 'OK');
  if (!lastSuccessful) return newItems;

  if (Math.random() > 0.6) {
    const slotIdx = Math.floor(Math.random() * newItems.length);
    const previousItem = lastSuccessful.items[slotIdx];
    if (previousItem && previousItem.status === 'READY') {
      const anchored = [...newItems];
      anchored[slotIdx] = { ...previousItem };
      return anchored;
    }
  }
  return newItems;
};

export const trackAcceptanceSignal = (type: string, data: any) => {
  const memory = getMemory() as any;
  
  // Implicitly updates taste only on positive actions (Acceptance/Click)
  if (data.brand) {
    const brand = data.brand.toLowerCase();
    if (!memory.tasteVector.brands.includes(brand)) {
      memory.tasteVector.brands.push(brand);
    }
  }

  if (data.fit) memory.tasteVector.fit = data.fit;
  
  if (data.color) {
    const c = data.color.toLowerCase();
    memory.tasteVector.color[c] = (memory.tasteVector.color[c] || 0) + 1;
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
};

export const saveDecision = (result: DecisionResult, occasion: string) => {
  const memory = getMemory();
  memory.history = [result, ...memory.history].slice(0, 10);
  
  result.items.forEach(item => {
    if (item.status === 'READY') {
      trackAcceptanceSignal('SAVE', {
        brand: item.brand,
        price: item.price,
        fit: memory.tasteVector.fit
      });
    }
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
};
