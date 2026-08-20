import React, { useState } from 'react';
import { BackButton } from '../components/BackButton';
import { Search, ShoppingBag, Heart, User, Share2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProductImage } from '../components/ProductImage';

const MOCK_CLOSETS = [
  { id: 'c1', user: 'Sophia L.', role: 'Fashion Editor', items: 142, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=80' },
  { id: 'c2', user: 'Marcus G.', role: 'Stylist', items: 89, image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=400&q=80' },
  { id: 'c3', user: 'Elena R.', role: 'Designer', items: 210, image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=400&q=80' },
];

const FEATURED_LOOKS = [
  { id: 'l1', title: 'Vintage Minimal', price: 285, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', owner: 'Sophia L.' },
  { id: 'l2', title: 'Urban Tech', price: 420, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80', owner: 'Marcus G.' },
];

export default function SocialCloset() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col bg-white pb-16 pt-16 px-8 w-full">
      <div className="flex justify-between items-start mb-12 px-2">
         <div>
           <h1 className="text-5xl font-light tracking-tighter leading-none mb-4">Social<br/>Closet.</h1>
           <p className="text-gray-400 text-sm font-light max-w-[200px]">Peer-verified wardrobes and community-curated items.</p>
         </div>
         <button className="p-4 bg-gray-50 rounded-full"><Share2 size={20} /></button>
      </div>

      <div className="relative mb-16 mx-2">
        <Search className="absolute left-6 top-5 text-gray-300" size={18} />
        <input 
          placeholder="Search creators or closets..." 
          className="w-full bg-gray-50 border border-transparent rounded-[2rem] p-5 pl-16 text-sm focus:outline-none focus:bg-white focus:border-black transition-all shadow-inner"
        />
      </div>

      <section className="mb-20 px-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-300 mb-8">Authority Node Creators</h3>
        <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide -mx-2 px-2">
          {MOCK_CLOSETS.map(c => (
            <div key={c.id} className="min-w-[120px] text-center flex flex-col items-center">
               <div className="w-24 h-24 rounded-full p-1 border border-gray-100 mb-4 overflow-hidden">
                 <img src={c.image} className="w-full h-full rounded-full object-cover shadow-xl" alt={c.user} />
               </div>
               <p className="font-medium text-sm text-black mb-1">{c.user}</p>
               <p className="text-[9px] text-gray-400 uppercase tracking-widest">{c.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-2">
        <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-300 mb-8">Trending Compositions</h3>
        <div className="space-y-12">
          {FEATURED_LOOKS.map(look => (
            <div key={look.id} className="group cursor-pointer">
               <div className="aspect-[3/4] bg-gray-50 rounded-[4rem] mb-6 overflow-hidden relative shadow-sm">
                 <ProductImage 
                   src={look.image} 
                   alt={look.title}
                   className="w-full h-full"
                   imageClassName="group-hover:scale-105 transition-transform duration-[2000ms]"
                 />
                 <div className="absolute top-8 left-8 flex items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg z-10">
                    <User size={12} className="text-gray-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-black">{look.owner}</span>
                 </div>
                 <button className="absolute bottom-8 right-8 p-5 bg-black text-white rounded-full shadow-2xl active:scale-90 transition-transform z-10">
                   <ShoppingBag size={20} />
                 </button>
               </div>
               <div className="px-6 flex justify-between items-end">
                  <div>
                    <h4 className="text-2xl font-light tracking-tight text-gray-800">{look.title}</h4>
                    <p className="text-gray-400 text-sm">Full outfit curation</p>
                  </div>
                  <p className="text-2xl font-bold tracking-tighter">${look.price}</p>
               </div>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-20 text-center pb-8 px-2">
         <button className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-200 hover:text-black transition-colors flex items-center gap-4 mx-auto">
            Load Global Feed <ArrowRight size={14} />
         </button>
      </div>
    </div>
  );
}