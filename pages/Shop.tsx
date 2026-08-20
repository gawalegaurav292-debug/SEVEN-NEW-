
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, Heart, RefreshCw, ChevronDown } from 'lucide-react';
import { Product, CartItem } from '../types';
import { CURRENCY_RATES, BRAND_OPTIONS, INVENTORY } from '../constants';
import { applyDiversity } from '../utils/diversity';
import { ProductImage } from '../components/ProductImage';

interface ShopProps {
  currency: string;
  addToCart: (item: CartItem) => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
}

export const Shop: React.FC<ShopProps> = ({ currency, addToCart, wishlist, toggleWishlist }) => {
  const navigate = useNavigate();
  const rate = CURRENCY_RATES[currency] || 1;
  
  const [activeGender, setActiveGender] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeBrands, setActiveBrands] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const clearAllFilters = () => {
    setActiveGender('All');
    setActiveCategory('All');
    setActiveBrands([]);
  };

  const performFetch = () => {
    let results = [...INVENTORY];

    if (activeGender !== 'All') {
      results = results.filter(p => p.gender === activeGender.toLowerCase());
    }

    if (activeCategory !== 'All') {
      let cat = activeCategory.toUpperCase();
      if (activeCategory === 'Tops') cat = 'TOP';
      if (activeCategory === 'Bottoms') cat = 'BOTTOM';
      if (activeCategory === 'Shoes') cat = 'SHOES';
      if (activeCategory === 'Layers') cat = 'LAYER';
      
      results = results.filter(p => p.category === cat);
    }

    if (activeBrands.length > 0) {
      results = results.filter(p => activeBrands.includes(p.brand));
    }

    setProducts(applyDiversity(results));
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(performFetch, 300);
    return () => clearTimeout(timer);
  }, [activeGender, activeCategory, activeBrands]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLoading(true);
    setTimeout(() => {
      performFetch();
      setIsRefreshing(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full bg-white pt-12 pb-24">
      <header className="px-6 mb-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-5xl font-light tracking-tighter text-black uppercase">Collection.</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`p-4 rounded-full transition-all ${showFilters ? 'bg-black text-white' : 'bg-gray-50 text-gray-400'}`}
            >
              <SlidersHorizontal size={20} />
            </button>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`p-4 rounded-full transition-all bg-gray-50 text-black active:scale-90`}
            >
              <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-10 bg-gray-50 p-8 rounded-none border border-gray-100 animate-entrance">
             <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                   <h3 className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">Filter Selection</h3>
                   <button 
                     onClick={clearAllFilters}
                     className="text-[10px] font-medium uppercase tracking-[0.2em] text-black border-b border-black pb-0.5"
                   >
                     Reset
                   </button>
                </div>
                <button onClick={() => setShowFilters(false)} className="text-gray-400">
                  <ChevronDown size={20} />
                </button>
             </div>

             <div className="space-y-8">
                <section>
                  <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-gray-400 mb-4">Genders</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {['All', 'Men', 'Women'].map(g => (
                      <button 
                        key={g} 
                        onClick={() => setActiveGender(g)} 
                        className={`px-6 py-3 text-[10px] font-medium uppercase tracking-widest border transition-all ${activeGender === g ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-gray-400 mb-4">Brands</p>
                  <div className="flex flex-wrap gap-2">
                    {BRAND_OPTIONS.slice(0, 8).map(b => (
                      <button 
                        key={b} 
                        onClick={() => setActiveBrands(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])} 
                        className={`px-5 py-3 text-[10px] font-medium uppercase tracking-widest border transition-all ${activeBrands.includes(b) ? 'bg-black text-white border-black' : 'bg-white text-gray-400 border-gray-100'}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </section>
             </div>
          </div>
        )}

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {['All', 'Tops', 'Bottoms', 'Shoes', 'Layers'].map(c => (
               <button 
                 key={c}
                 onClick={() => setActiveCategory(c)} 
                 className={`px-8 py-4 rounded-full text-[10px] font-medium uppercase tracking-widest whitespace-nowrap transition-all ${activeCategory === c ? 'bg-black text-white shadow-xl' : 'bg-gray-50 text-gray-400'}`}
                >
                  {c}
               </button>
          ))}
        </div>
      </header>

      <div className="px-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="aspect-[3/4] bg-gray-50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-16">
            {products.length > 0 ? products.map((item) => (
              <div key={item.id} className="group cursor-pointer" onClick={() => navigate(`/product/${item.id}`)}>
                <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden mb-6 border border-gray-50">
                  <ProductImage 
                    src={item.image.primary} 
                    alt={item.name} 
                    className="w-full h-full transition-transform duration-[2s] group-hover:scale-105" 
                  />
                  <button className="absolute top-4 left-4 p-3 bg-white/80 rounded-full z-20" onClick={(e) => { e.stopPropagation(); toggleWishlist(item.id); }}>
                    <Heart size={16} className={wishlist.includes(item.id) ? "fill-black text-black" : "text-black"} />
                  </button>
                </div>
                <div>
                   <div className="flex items-center gap-2 mb-2">
                     <h3 className="text-[10px] font-medium text-black uppercase tracking-widest">{item.brand}</h3>
                   </div>
                   <p className="text-xs text-gray-400 leading-tight mb-3 line-clamp-1 font-light tracking-tight">{item.name}</p>
                   <p className="text-xl font-light tracking-tighter text-black">${(item.price * rate).toFixed(0)}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-2 text-center py-24 opacity-20">
                <p className="text-[10px] font-medium uppercase tracking-[0.5em] text-black">Empty Collection</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
