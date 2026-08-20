import React from 'react';
import { INVENTORY, CURRENCY_RATES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { ProductImage } from '../components/ProductImage';

interface Props {
  wishlistIds: string[];
  currency: string;
}

export const Wishlist: React.FC<Props> = ({ wishlistIds, currency }) => {
  const navigate = useNavigate();
  const rate = CURRENCY_RATES[currency] || 1;
  const items = INVENTORY.filter(p => wishlistIds.includes(p.id));

  return (
    <div className="bg-gray-50 pb-24 pt-12 px-6 w-full">
      <div className="mb-6">
        <BackButton className="mb-4" />
        <h2 className="text-3xl font-light">Saved Looks</h2>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Heart size={48} strokeWidth={1} className="mb-4 opacity-50" />
          <p>Your wishlist is empty.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-black text-sm font-medium border-b border-black">Discover items</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pb-12">
          {items.map(item => (
            <div 
              key={item.id} 
              onClick={() => navigate(`/product/${item.id}`)}
              className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex gap-4 cursor-pointer active:scale-95 transition-transform"
            >
              <div className="w-24 h-32 shrink-0 rounded-xl overflow-hidden">
                <ProductImage src={item.image.primary} alt={item.name} className="w-full h-full" aspectRatio="aspect-[3/4]" />
              </div>
              <div className="flex-1 py-2 flex flex-col justify-between">
                <div>
                   <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{item.brand}</p>
                   <h3 className="font-medium leading-tight mb-1">{item.name}</h3>
                   <p className="font-bold">{currency} {(item.price * rate).toFixed(0)}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold mt-2">
                  View <ArrowRight size={12} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};