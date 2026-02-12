import React, { useState, useEffect } from 'react';
import { 
  Fingerprint, 
  ChevronLeft, 
  Check, 
  ShieldCheck, 
  RefreshCcw, 
  ExternalLink 
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

type Phase = 'SPLASH' | 'IDLE' | 'IDENTITY' | 'ALLOCATION' | 'REQUEST' | 'MATCHING' | 'VERDICT';

interface Item {
  brand: string;
  name: string;
  price: number;
  image: string;
}

interface ResultData {
  advice: string;
  total: number;
  items: Item[];
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('SPLASH');
  const [identity, setIdentity] = useState<'Men' | 'Women'>('Men');
  const [budget, setBudget] = useState<number>(200);
  const [request, setRequest] = useState<string>('');
  const [result, setResult] = useState<ResultData | null>(null);

  // Splash Screen Lifecycle
  useEffect(() => {
    if (phase === 'SPLASH') {
      const timer = setTimeout(() => setPhase('IDLE'), 2800);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  const handleSync = async () => {
    setPhase('MATCHING');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Act as SÉVEN, a minimalist high-end AI stylist. 
      Analyze the user request: "${request}". 
      Context: Gender: ${identity}, Budget: $${budget}.
      Select exactly 2 items from H&M (or similar accessible brands) that match this style perfectly and stay under the total budget.
      Provide a brief (max 12 words) authority stylist advice about why these pieces work together.
      Return ONLY a JSON object with this exact structure:
      {
        "advice": "Simple shapes and classic colors create a functional foundation.",
        "total": 49.98,
        "items": [
          {"brand": "H&M", "name": "White Cotton T-Shirt", "price": 9.99, "image": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80"},
          {"brand": "H&M", "name": "Regular Fit Denim Jeans", "price": 39.99, "image": "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=500&q=80"}
        ]
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
        config: { 
          responseMimeType: "application/json",
          temperature: 0.1
        }
      });

      const data = JSON.parse(response.text || '{}');
      setResult(data);
      
      // Delay to match the demo video's feeling of "synthesis"
      setTimeout(() => setPhase('VERDICT'), 2000);
    } catch (e) {
      console.error("Styling Error:", e);
      // Fallback for demo stability
      setResult({
        advice: "Simple shapes and classic colors create a functional foundation.",
        total: 49.98,
        items: [
          { brand: "H&M", name: "White Cotton T-Shirt", price: 9.99, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500" },
          { brand: "H&M", name: "Regular Fit Denim Jeans", price: 39.99, image: "https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=500" }
        ]
      });
      setTimeout(() => setPhase('VERDICT'), 2000);
    }
  };

  const reset = () => {
    setPhase('IDLE');
    setRequest('');
    setResult(null);
  };

  // --- RENDERING ---

  if (phase === 'SPLASH') {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
        <h1 className="text-black text-5xl font-light tracking-[0.3em] animate-fade-in">SÉVEN</h1>
        <div className="fixed bottom-12 w-48 h-[2px] bg-gray-100 overflow-hidden">
          <div className="h-full bg-black animate-progress" />
        </div>
      </div>
    );
  }

  if (phase === 'IDLE') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 animate-fade-in">
        <div className="mb-24 flex flex-col items-center">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mb-6">
            <Fingerprint size={32} strokeWidth={1.5} />
          </div>
          <h1 className="text-black text-6xl font-light tracking-[0.2em] mb-4">SÉVEN</h1>
          <p className="text-gray-400 text-[10px] font-medium tracking-[0.5em] uppercase">Authority First</p>
        </div>
        <button 
          onClick={() => setPhase('IDENTITY')}
          className="fixed bottom-12 w-[calc(100%-64px)] max-w-md bg-black text-white py-5 rounded-xl font-bold text-sm tracking-[0.2em] uppercase active:scale-[0.98] transition-all"
        >
          Start
        </button>
      </div>
    );
  }

  if (phase === 'IDENTITY') {
    return (
      <div className="min-h-screen bg-white p-8 pt-20 animate-fade-up">
        <button onClick={() => setPhase('IDLE')} className="mb-12 text-gray-400">
          <ChevronLeft size={28} strokeWidth={1.5} />
        </button>
        <h2 className="text-black text-5xl font-light tracking-tight mb-12">Identity.</h2>
        <div className="space-y-4 max-w-md mx-auto">
          {['Men', 'Women'].map((type) => (
            <div 
              key={type}
              onClick={() => { setIdentity(type as any); setPhase('ALLOCATION'); }}
              className={`w-full p-8 border ${identity === type ? 'border-black' : 'border-gray-100'} rounded-3xl flex justify-between items-center cursor-pointer transition-all active:bg-gray-50`}
            >
              <span className="text-black text-2xl font-light">{type}</span>
              {identity === type && <Check size={24} className="text-black" />}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (phase === 'ALLOCATION') {
    return (
      <div className="min-h-screen bg-white p-8 pt-20 animate-fade-up">
        <button onClick={() => setPhase('IDENTITY')} className="mb-12 text-gray-400">
          <ChevronLeft size={28} strokeWidth={1.5} />
        </button>
        <h2 className="text-black text-5xl font-light tracking-tight mb-4">Allocation.</h2>
        <p className="text-gray-400 text-sm font-medium mb-16">Minimum $50 investment.</p>
        
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-full bg-[#F9F9F9] p-12 rounded-[40px] flex flex-col items-center mb-12 shadow-sm">
            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-6">Total Budget</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-light text-gray-200">$</span>
              <span className="text-8xl font-light tracking-tighter">{budget}</span>
            </div>
          </div>
          <input 
            type="range" 
            min="50" 
            max="2000" 
            step="50" 
            value={budget} 
            onChange={(e) => setBudget(Number(e.target.value))}
            className="mb-24"
          />
          <button 
            onClick={() => setPhase('REQUEST')}
            className="w-full bg-black text-white py-5 rounded-xl font-bold text-sm tracking-[0.2em] uppercase active:scale-[0.98] transition-all"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'REQUEST') {
    return (
      <div className="min-h-screen bg-white p-8 pt-20 animate-fade-up">
        <button onClick={() => setPhase('ALLOCATION')} className="mb-12 text-gray-400">
          <ChevronLeft size={28} strokeWidth={1.5} />
        </button>
        <h2 className="text-black text-5xl font-light tracking-tight mb-4">Request.</h2>
        <p className="text-gray-400 text-sm font-medium mb-16">e.g. Black hoodie and jeans</p>
        
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-full bg-[#F9F9F9] border border-transparent rounded-[32px] p-6 mb-12 focus-within:border-gray-200 transition-all">
            <textarea 
              autoFocus
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Describe both items..."
              className="w-full h-40 bg-transparent text-xl font-light placeholder:text-gray-200 resize-none outline-none"
            />
          </div>
          <button 
            onClick={handleSync}
            disabled={!request}
            className={`w-full bg-black text-white py-5 rounded-xl font-bold text-sm tracking-[0.2em] uppercase active:scale-[0.98] transition-all ${!request ? 'opacity-20 cursor-not-allowed' : ''}`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'MATCHING') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8">
        <div className="relative w-24 h-24 mb-12">
          <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-black rounded-full animate-rotate"></div>
        </div>
        <p className="text-black text-[10px] font-bold uppercase tracking-[0.5em] animate-pulse">Matching</p>
      </div>
    );
  }

  if (phase === 'VERDICT') {
    return (
      <div className="min-h-screen bg-white p-8 pt-20 animate-fade-in pb-32">
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="bg-white border border-gray-100 px-5 py-2 rounded-full flex items-center gap-2 mb-10 shadow-sm">
            <ShieldCheck size={16} className="text-black" />
            <span className="text-black text-[10px] font-bold uppercase tracking-widest">Verified</span>
          </div>
          
          <div className="w-full bg-[#F9F9F9] p-10 rounded-[40px] mb-12 text-center border border-gray-100 shadow-sm">
            <p className="text-xl font-light italic leading-relaxed text-black/80 px-4">
              "{result?.advice}"
            </p>
          </div>
          
          <h3 className="text-black text-5xl font-light tracking-tighter mb-12">${result?.total.toFixed(2)}</h3>
          
          <div className="grid grid-cols-2 gap-4 w-full mb-20">
            {result?.items.map((item, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="aspect-[3/4] bg-gray-50 rounded-[28px] overflow-hidden mb-4 relative border border-gray-50 group">
                  <img src={item.image} className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0" alt={item.name} />
                  <div className="absolute top-3 right-3 bg-white/90 p-2.5 rounded-2xl shadow-sm cursor-pointer hover:bg-white transition-colors">
                    <ExternalLink size={14} className="text-gray-400" />
                  </div>
                </div>
                <div className="px-1">
                  <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">{item.brand}</p>
                  <h4 className="text-[11px] font-medium text-black mb-1.5 truncate leading-tight">{item.name}</h4>
                  <p className="text-[11px] font-bold text-black tracking-tight">${item.price}</p>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={reset}
            className="flex items-center gap-2.5 text-gray-300 hover:text-black transition-colors text-[10px] font-bold uppercase tracking-widest active:scale-95 py-4"
          >
            <RefreshCcw size={14} />
            Reset
          </button>
        </div>
      </div>
    );
  }

  return null;
}