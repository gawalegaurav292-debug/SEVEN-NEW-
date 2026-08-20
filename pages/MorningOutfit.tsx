import React, { useState, useEffect } from 'react';
import { RefreshCw, ShieldCheck, Sparkles, Lock, Cloud, Zap, Image as ImageIcon } from 'lucide-react';
import { closeClothingDecision, generateDreamOutfit } from '../services/geminiService';
import { DecisionResult } from '../types';
import { ProductImage } from '../components/ProductImage';

export default function MorningOutfit() {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DecisionResult | null>(null);
  const [dreamImage, setDreamImage] = useState<string | null>(null);
  const [dreamLoading, setDreamLoading] = useState(false);

  useEffect(() => {
    sync();
  }, []);

  const sync = async () => {
    setLoading(true);
    try {
      const res = await closeClothingDecision({
        gender: 'Men',
        identity: 'Men',
        build: 'Regular',
        fit: 'Sharp Tailoring',
        age: '25-34',
        occasion: 'Executive Environment',
        colorDNA: 'Deep Navy / Charcoal',
        exclusions: 'Loud Branding',
        investment: 2000,
        inspiration: 'Architectural Minimalist',
        refinement: 'Loro Piana level quality',
        currency: 'USD'
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const visualizeDream = async () => {
    if (!result || dreamLoading) return;
    setDreamLoading(true);
    const prompt = result.items.map(i => `${i.brand} ${i.name}`).join(', ') + ' ' + result.reason;
    const img = await generateDreamOutfit(prompt);
    setDreamImage(img);
    setDreamLoading(false);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full p-12 text-center animate-premium-fade w-full">
      <div className="w-1.5 h-1.5 bg-black rounded-full animate-ping mb-8"></div>
      <p className="text-xs font-bold uppercase tracking-widest text-black">Syncing Daily Brief</p>
    </div>
  );

  return (
    <div className="flex flex-col p-8 pt-16 animate-in fade-in duration-1000 w-full max-w-lg mx-auto pb-32 overflow-y-auto scrollbar-hide">
      <div className="flex justify-between items-start mb-12">
        <div>
          <h1 className="text-5xl font-light mb-2 tracking-tighter leading-none">Daily Brief.</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">v3.0 Curation</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-300 mb-2">08:30 AM</p>
          <div className="flex items-center gap-2 text-green-600 justify-end">
             <ShieldCheck size={14} />
             <span className="text-[9px] font-bold uppercase tracking-widest">Verified</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-3 flex items-center gap-2"><Cloud size={10}/> Weather</p>
          <p className="text-xl font-light tracking-tight">64°F · Clear</p>
        </div>
        <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
          <p className="text-[9px] font-bold uppercase tracking-widest text-gray-300 mb-3 flex items-center gap-2"><Zap size={10}/> Focus</p>
          <p className="text-xl font-light tracking-tight">Executive</p>
        </div>
      </div>

      {result && (
        <div className="space-y-16">
          <section className="bg-black text-white p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
             <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-6 flex items-center gap-2">
                <Lock size={12} /> Directive
             </p>
             <h3 className="text-2xl font-light mb-4 tracking-tight leading-tight italic">"{result.reason}"</h3>
          </section>

          <div className="space-y-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-200">Selected Items</p>
            {result.items?.map((item, idx) => (
              <div key={idx} className="flex gap-6 items-center group">
                <div className="w-24 h-32 shrink-0 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                  <ProductImage 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full"
                    imageClassName="group-hover:scale-105 transition-transform duration-1000"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">{item.brand}</p>
                  <p className="text-xl font-light tracking-tight leading-tight mb-4">{item.name}</p>
                  <a href={item.affiliate_url} target="_blank" rel="noopener" className="text-xs font-bold uppercase tracking-widest border-b border-black pb-0.5 hover:text-gray-400 transition-colors">Shop</a>
                </div>
              </div>
            ))}
          </div>

          <section className="pt-8">
             <button 
               onClick={visualizeDream} 
               disabled={dreamLoading}
               className="w-full py-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-black hover:text-white group"
             >
                {dreamLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : <ImageIcon size={18} className="text-gray-300 group-hover:text-white transition-colors" />}
                Visualize Outcome
             </button>

             {dreamImage && (
               <div className="mt-8 animate-premium-fade">
                  <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 relative">
                     <img src={dreamImage} className="w-full h-full object-cover" alt="Dream Synthesis" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                     <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
                        <Sparkles size={12} className="text-indigo-500" />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-black">AI Synthesis</span>
                     </div>
                  </div>
               </div>
             )}
          </section>

          <button onClick={sync} className="w-full py-4 text-xs font-bold uppercase tracking-widest text-gray-200 hover:text-black transition-colors flex items-center justify-center gap-3">
             <RefreshCw size={14} /> Re-Sync Verdict
          </button>
        </div>
      )}
    </div>
  );
}