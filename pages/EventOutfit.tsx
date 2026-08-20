import React, { useState } from 'react';
import { Link2, Sparkles, ArrowRight, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { useNavigate } from 'react-router-dom';
import { applyDiversity } from '../utils/diversity';
import { ProductImage } from '../components/ProductImage';

export default function EventOutfit() {
  const [url, setUrl] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const navigate = useNavigate();

  const handleStyle = async () => {
    if (!url && !desc) return;
    setLoading(true);
    
    try {
      const res = await fetch('http://localhost:3001/api/event-stylist/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, description: desc, gender: 'men' }) 
      });
      const data = await res.json();
      if (data.success && data.products) {
        // Apply Diversity Engine to event items
        const diversified = applyDiversity(data.products);
        setResult({ ...data, products: diversified });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white pb-16 pt-16 px-8 w-full">
      <div className="mb-12 px-2">
        <h1 className="text-5xl font-light tracking-tighter leading-none mb-4">Event<br/>Stylist.</h1>
        <p className="text-gray-400 text-sm font-light leading-relaxed max-w-[280px]">Paste an invite URL or description for automated curation.</p>
      </div>

      {!result ? (
        <div className="space-y-8 animate-in fade-in duration-700 px-2">
          <div className="relative group">
            <Link2 className="absolute left-6 top-6 text-gray-300 group-focus-within:text-black transition-colors" size={20} />
            <input 
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://eventbrite.com/e/..." 
              className="w-full bg-gray-50 border border-transparent rounded-[2.5rem] p-8 pl-16 pr-8 text-sm focus:outline-none focus:bg-white focus:border-black transition-all shadow-inner"
            />
          </div>
          
          <div className="relative group">
             <textarea 
               value={desc}
               onChange={e => setDesc(e.target.value)}
               placeholder="Or describe the vibe: 'Outdoor wedding in Tuscany, 85 degrees...'"
               className="w-full bg-gray-50 border border-transparent rounded-[2.5rem] p-8 h-40 focus:outline-none focus:bg-white focus:border-black transition-all shadow-inner resize-none text-sm font-light"
             />
          </div>

          <button 
            onClick={handleStyle}
            disabled={loading}
            className="w-full py-6 bg-black text-white rounded-full text-[11px] font-bold uppercase tracking-[0.4em] shadow-2xl shadow-black/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Sparkles size={18} />}
            <span>Synthesize Look</span>
          </button>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-[1200ms] px-2">
           <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100 mb-12 shadow-inner">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-300 mb-4">Detected Logic</h3>
              <p className="text-2xl font-light text-black tracking-tight leading-tight">{result.context?.occasion} <span className="text-gray-200">/</span> {result.context?.style}</p>
           </div>
           
           <div className="grid grid-cols-2 gap-x-4 gap-y-10 mb-12">
             {result.products.map((p: any) => (
               <div key={p.id} onClick={() => navigate(`/product/${p.id}`)} className="group cursor-pointer">
                  <div className="aspect-[3/4] bg-gray-50 border border-gray-50 rounded-[2.5rem] overflow-hidden relative shadow-sm">
                    <ProductImage 
                      src={p.image_url} 
                      alt={p.title}
                      className="w-full h-full"
                      imageClassName="group-hover:scale-110 transition-transform duration-[1500ms] mix-blend-multiply"
                    />
                    <div className="absolute top-4 right-4 bg-white/80 p-1.5 rounded-full shadow-sm text-green-500 z-10">
                      <ShieldCheck size={14} />
                    </div>
                  </div>
                  <div className="px-1 mt-4">
                    <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mb-1">{p.brand}</p>
                    <h3 className="font-light text-sm truncate text-gray-800 mb-1">{p.title}</h3>
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm tracking-tight">${p.price}</p>
                      <ArrowUpRight size={14} className="text-gray-300 group-hover:text-black transition-colors" />
                    </div>
                  </div>
               </div>
             ))}
           </div>
           
           <button onClick={() => setResult(null)} className="w-full py-6 text-[10px] text-gray-300 font-bold uppercase tracking-[0.5em] hover:text-black transition-colors">Style Another Event</button>
        </div>
      )}
    </div>
  );
}