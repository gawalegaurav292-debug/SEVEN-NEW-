import React, { useState } from 'react';
import { Outfit, Order, CartItem } from '../types';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShieldCheck, Truck, ShoppingBag } from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { ProductImage } from '../components/ProductImage';

interface Props {
  outfit: Outfit | null;
  cart: CartItem[];
  addOrder: (o: Order) => void;
  clearCart: () => void;
  currency: string;
}

export const Checkout: React.FC<Props> = ({ outfit, cart, addOrder, clearCart, currency }) => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'review' | 'payment' | 'success'>('review');

  const hasCartItems = cart.length > 0;
  const displayItems = hasCartItems ? cart : (outfit?.items || []);
  const total = displayItems.reduce((sum, item) => sum + item.price, 0);

  if (displayItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 px-8 text-center bg-gray-50">
        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-6 text-gray-400">
           <ShoppingBag size={32} />
        </div>
        <h2 className="text-xl font-medium mb-2">Your Bag is Empty</h2>
        <button onClick={() => navigate('/')} className="bg-black text-white px-8 py-3 rounded-full font-medium">Start Styling</button>
      </div>
    );
  }

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => {
      addOrder({
        id: `ORD-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        items: displayItems,
        total: total,
        status: 'processing',
        date: new Date().toLocaleDateString(),
        currency: currency
      });
      if (hasCartItems) clearCart();
      setProcessing(false);
      setStep('success');
    }, 2000);
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-white px-8 text-center">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-3xl font-light mb-2">Order Confirmed</h2>
        <p className="text-gray-500 mb-8">SÉVEN has placed orders with the brands.</p>
        <button onClick={() => navigate('/orders')} className="w-full bg-black text-white py-4 rounded-full font-medium shadow-lg">Track Orders</button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 pb-24 pt-8 w-full">
      <div className="px-6 mb-6">
        <BackButton className="mb-4 text-gray-500" />
        <h2 className="text-2xl font-light">Checkout</h2>
      </div>

      <div className="bg-white px-6 py-8 rounded-t-3xl shadow-sm">
        <div className="mb-8">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">Order Summary</h3>
          <div className="space-y-4">
            {displayItems.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between items-center border-b border-gray-50 pb-4 last:border-0">
                <div className="flex gap-4">
                  <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden">
                    <ProductImage src={item.image} alt={item.name} className="w-full h-full" aspectRatio="aspect-square" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.brand}</p>
                    {'selectedSize' in item && <p className="text-xs text-gray-500 mt-1">Size: {(item as CartItem).selectedSize}</p>}
                  </div>
                </div>
                <p className="font-medium text-sm">${item.price}</p>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-4 mt-4 flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold">${total}</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handlePay}
          disabled={processing}
          className="w-full bg-black text-white py-4 rounded-full font-medium text-lg shadow-xl shadow-black/20 active:scale-95 transition-all flex items-center justify-center"
        >
          {processing ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : `Pay $${total}`}
        </button>
      </div>
    </div>
  );
};