import React, { useState } from 'react';
import { ArrowUpRight, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { applyDiversity } from '../utils/diversity';
import { ProductImage } from '../components/ProductImage';

export default function UnlimitedShop() {
  const [filters, setFilters] = useState({ 
    gender: 'men', 
    product_type: 'hoodie', 
    size: 'M', 
    occasion: 'casual', 
    brand: 'nike', 
    max_price: 200 
  });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOutfits = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/unlimited-rag/unlimited-outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      });
      const data = await res.json();
      // Apply Diversity Engine
      setProducts(applyDiversity(data.products || []));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-white pb-16 pt-16 px-8 w-full">
      <div className="mb-12 px-2">
        <h1 className="text-5xl font-light tracking-tighter leading-none mb-4">Unlimited<br/>Archive.</h1>
        <p className="text-gray-400 text-sm font-light leading-relaxed max-w-[280px]">Hard-gated, verified items only. Diversity strictly enforced.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-12 bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100 shadow-inner mx-2">
        <div className="w-full flex gap-3 mb-3">
          <select 
            className="flex-1 bg-white px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest border border-gray-200 outline-none focus:border-black transition-colors"
            value={filters.product_type}
            onChange={e => setFilters({...filters, product_type: e.target.value})}
          >
            <option value="shirt">Shirt</option>
            <option value="hoodie">Hoodie</option>
            <option value="shoes">Shoes</option>
            <option value="pants">Pants</option>
            <option value="jacket">Jacket</option>
          </select>

          <select 
            className="flex-1 bg-white px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest border border-gray-200 outline-none focus:border-black transition-colors"
            value={filters.gender}
            onChange={e => setFilters({...filters, gender: e.target.value})}
          >
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>

        <div className="w-full flex gap-3">
          <select 
            className="flex-1 bg-white px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest border border-gray-200 outline-none focus:border-black transition-colors"
            value={filters.brand}
            onChange={e => setFilters({...filters, brand: e.target.value})}
          >
            <option value="nike">Nike</option>
            <option value="adidas">Adidas</option>
            <option value="zara">Zara</option>
            <option value="asos">ASOS</option>
            <option value="uniqlo">Uniqlo</option>
          </select>

          <input 
            type="number" 
            placeholder="Max Price" 
            value={filters.max_price} 
            onChange={e => setFilters({...filters, max_price: Number(e.target.value)})} 
            className="w-28 bg-white px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest border border-gray-200 outline-none focus:border-black transition-colors" 
          />
        </div>
        
        <button 
          onClick={fetchOutfits} 
          className="w-full mt-2 bg-black text-white py-5 rounded-[2rem] text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3 active:scale-[0.98] transition-all shadow-xl shadow-black/10"
          disabled={loading}
        >
          {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <Sparkles size={16} />} 
          <span>Scan Archive</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-10 animate-in fade-in duration-[1200ms] px-2">
        {products.map(p => (
          <div key={p.id} className="group cursor-pointer">
            <div className="aspect-[3/4] bg-gray-50 rounded-[2.5rem] mb-4 overflow-hidden relative shadow-sm border border-gray-50">
               <ProductImage 
                 src={p.image_url} 
                 alt={p.title} 
                 className="w-full h-full"
                 imageClassName="group-hover:scale-110 transition-transform duration-[1500ms] mix-blend-multiply" 
               />
               <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md p-1.5 rounded-full text-green-600 shadow-sm border border-white/20 z-10">
                 <ShieldCheck size={14} />
               </div>
            </div>
            <div className="px-1">
              <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em] mb-1">{p.brand}</p>
              <h3 className="font-light text-sm truncate text-gray-800 mb-1">{p.title}</h3>
              <div className="flex justify-between items-center">
                 <p className="font-medium text-sm tracking-tight">${p.price}</p>
                 <a 
                   href={p.affiliate_url} 
                   target="_blank" 
                   rel="noopener noreferrer" 
                   className="p-2 bg-black text-white rounded-full active:scale-90 transition-transform shadow-lg shadow-black/10"
                 >
                   <ArrowUpRight size={12} />
                 </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && products.length === 0 && (
        <div className="text-center py-24 opacity-20 px-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.6em]">Awaiting Instruction</p>
        </div>
      )}
    </div>
  );
}