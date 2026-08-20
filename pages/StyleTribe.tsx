import React, { useState } from 'react';
import { Flame, Trash2, User, Share2 } from 'lucide-react';

const MOCK_TRIBE = [
  { id: '1', user: '@minimal_max', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80', vibe: 'Scandinavian Minimal' },
  { id: '2', user: '@urban_alex', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80', vibe: 'Modern Streetwear' },
  { id: '3', user: '@luxe_elena', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80', vibe: 'High-Fashion Utility' },
];

export default function StyleTribe() {
  const [index, setIndex] = useState(0);

  const next = () => setIndex((index + 1) % MOCK_TRIBE.length);

  const current = MOCK_TRIBE[index];

  return (
    <div className="flex flex-col bg-black text-white p-6 md:p-12 animate-in fade-in duration-1000 w-full relative py-12">
      <div className="flex justify-between items-center mb-10 pt-4 shrink-0 px-2">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Tribe.</h1>
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">Global Inspiration</p>
        </div>
        <button className="p-3 bg-white/10 rounded-full"><Share2 size={20} /></button>
      </div>

      <div className="flex-1 flex flex-col justify-center relative px-2 max-w-lg mx-auto w-full">
        <div className="aspect-[3/4] rounded-[2.5rem] overflow-hidden relative shadow-2xl shadow-white/5 border border-white/10 w-full mb-10">
          <img src={current.image} className="w-full h-full object-cover" />
          
          <div className="absolute top-6 left-6 flex items-center gap-2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <User size={12} />
            <span className="text-xs font-bold">{current.user}</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/40 to-transparent">
             <h3 className="text-2xl font-light mb-2">{current.vibe}</h3>
             <div className="h-0.5 w-12 bg-white/40 rounded-full"></div>
          </div>
        </div>

        <div className="flex justify-center gap-6 shrink-0 pb-10">
          <button onClick={next} className="w-16 h-16 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-gray-500 hover:bg-white/10 active:scale-95 transition-all">
            <Trash2 size={24} />
          </button>
          <button onClick={next} className="w-20 h-20 rounded-full bg-white text-black flex items-center justify-center shadow-2xl shadow-white/10 active:scale-95 transition-all">
            <Flame size={32} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}