
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CURRENCY_RATES, INVENTORY } from '../constants';
import { Product, CartItem } from '../types';
import { Heart, ShieldCheck, ArrowRight } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { trackAcceptanceSignal } from '../services/memory';
import { ProductImage } from '../components/ProductImage';

interface Props {
  addToCart: (item: CartItem) => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  currency: string;
}

export const ProductDetail: React.FC<Props> = ({ addToCart, wishlist, toggleWishlist, currency }) => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | undefined>();
  const [loading, setLoading] = useState(true);
  const [size, setSize] = useState<string>('');
  const [isAdded, setIsAdded] = useState(false);

  const rate = CURRENCY_RATES[currency] || 1;

  useEffect(() => {
    const found = INVENTORY.find(p => p.id === id);
    setProduct(found);
    setLoading(false);
    
    // Step 3: Passive Learning Signal (Product View)
    if (found) {
      trackAcceptanceSignal('CLICK', {
        brand: found.brand,
        price: found.price,
        category: found.category
      });
    }
  }, [id]);

  const handleAddToBag = () => {
    if (!product) return;
    
    // Signal: Acquisition Intent (Step 3)
    trackAcceptanceSignal('SAVE', {
      brand: product.brand,
      price: product.price
    });

    if (product.affiliate_url) {
      window.open(product.affiliate_url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (!size && product.sizes?.length) {
      alert("Select size.");
      return;
    }
    addToCart({ ...product, selectedSize: size || 'One Size' });
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  if (loading) return <div className="py-40 flex items-center justify-center p-10"><div className="w-6 h-6 border-2 border-t-black rounded-full animate-spin"></div></div>;
  if (!product) return <div className="py-40 flex items-center justify-center p-10">Product not found.</div>;

  const isWishlisted = wishlist.includes(product.id);

  return (
    <div className="flex flex-col bg-white pb-40 w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center p-6 shrink-0">
        <BackButton label="" />
        <button onClick={() => toggleWishlist(product.id)}>
          <Heart size={24} className={isWishlisted ? "fill-black text-black" : "text-black"} />
        </button>
      </div>

      <div className="aspect-[4/5] w-full bg-gray-50 relative shrink-0">
        <ProductImage 
          src={product.image.primary} 
          alt={product.name} 
          className="w-full h-full" 
          aspectRatio="aspect-[4/5]"
        />
        <div className="absolute bottom-6 left-6 z-20">
           <span className="bg-black text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest flex items-center gap-2">
             <ShieldCheck size={12} className="text-green-400" /> Verified
           </span>
        </div>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-start mb-10">
           <div className="max-w-[70%]">
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">{product.brand}</p>
             <h1 className="text-3xl font-light mb-1 leading-tight tracking-tight">{product.name}</h1>
           </div>
           <p className="text-3xl font-medium tracking-tighter">{currency} {(product.price * rate).toFixed(0)}</p>
        </div>

        {product.sizes?.length && (
          <div className="mb-12">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-4">Select Size</h3>
             <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
               {product.sizes.map(s => (
                 <button 
                   key={s} 
                   onClick={() => setSize(s)}
                   className={`w-12 h-12 shrink-0 rounded-full border flex items-center justify-center text-sm font-black transition-all ${
                     size === s ? 'bg-black text-white border-black shadow-xl' : 'border-gray-100 text-gray-400'
                   }`}
                 >
                   {s}
                 </button>
               ))}
             </div>
          </div>
        )}

        <div className="mb-10">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-300 mb-4">Design Notes</h3>
          <p className="text-base text-gray-500 font-light leading-relaxed">{product.description || "Verified sustainable cotton construction. Ideal for minimalist capsule wardrobes."}</p>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 bg-white/95 border-t border-gray-50 z-30 pt-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
        <button 
          onClick={handleAddToBag}
          className={`w-full py-6 rounded-full text-xs font-black uppercase tracking-[0.5em] flex items-center justify-center gap-4 shadow-2xl transition-all active:scale-95 ${
            isAdded ? 'bg-green-600 text-white' : 'bg-black text-white'
          }`}
        >
          {isAdded ? "Synchronized" : product.affiliate_url ? "Acquire Origin" : "Add to Bag"}
          {!isAdded && <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
};
