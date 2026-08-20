import React, { useState, useRef } from 'react';
import { Camera, Plus, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { ProductImage } from '../components/ProductImage';

export default function Wardrobe() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      
      try {
        const res = await fetch('http://localhost:3001/api/wardrobe/digitize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        });
        const data = await res.json();
        if (data.success) {
          setItems([...items, ...data.items]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col bg-white pb-16 pt-8 px-8 w-full">
      <div className="px-2">
        <BackButton className="mb-4" />
        <div className="flex justify-between items-end mb-6">
          <div>
             <h1 className="text-3xl font-light mb-1">Wardrobe.</h1>
             <p className="text-gray-400 text-sm">Digital Twin & Shop Similar</p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-black text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
          >
            <Plus size={24} />
          </button>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleUpload} />

        {loading && (
          <div className="p-8 text-center bg-gray-50 rounded-3xl mb-6 animate-pulse">
             <Camera className="mx-auto mb-2 opacity-50" />
             <p className="text-sm text-gray-500">Scanning fabric & cut...</p>
          </div>
        )}

        {items.length === 0 && !loading ? (
          <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
            <p className="text-gray-300 mb-2">Your closet is empty.</p>
            <button onClick={() => fileInputRef.current?.click()} className="text-black font-medium underline">Upload a photo</button>
          </div>
        ) : (
          <div className="space-y-8">
             {items.map((item, idx) => (
               <div key={idx} className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-bold bg-white px-2 py-1 rounded text-gray-500 uppercase">{item.category}</span>
                      <h3 className="font-medium text-lg mt-2">{item.title}</h3>
                      <p className="text-sm text-gray-400">{item.material} · {item.color}</p>
                    </div>
                  </div>

                  {/* Upsell / Similar Items */}
                  {item.similar && item.similar.length > 0 && (
                    <div className="bg-white p-3 rounded-2xl">
                      <p className="text-xs font-bold text-gray-300 uppercase tracking-widest mb-3 flex items-center gap-1">
                        <ShoppingBag size={12} /> Shop Compatible
                      </p>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {item.similar.map((sim: any, sIdx: number) => (
                          <a 
                            key={sIdx} 
                            href={sim.affiliate_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="min-w-[100px] group"
                          >
                            <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden mb-2 relative">
                               <ProductImage src={sim.images?.[0] || sim.image} alt={sim.title} className="w-full h-full" aspectRatio="aspect-square" />
                               <div className="absolute top-1 right-1 bg-white/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                 <ArrowUpRight size={10} />
                               </div>
                            </div>
                            <p className="text-[10px] font-medium truncate">{sim.title}</p>
                            <p className="text-[10px] font-bold">${sim.price}</p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
}