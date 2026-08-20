import React, { useEffect, useState } from 'react';
import { TrendingUp, ArrowUpRight, Activity } from 'lucide-react';
import { BackButton } from '../components/BackButton';

const MOCK_TRENDS = {
  demand: [
    { label: 'Oversized Silhouette', trend: '+18%', count: 420 },
    { label: 'Technical Shells', trend: '+12%', count: 310 },
    { label: 'Monochrome Knits', trend: '+8%', count: 250 }
  ],
  brands: [
    { brand: 'Uniqlo', count: 120 },
    { brand: 'Nike', count: 98 },
    { brand: 'COS', count: 85 },
    { brand: 'Zara', count: 72 },
    { brand: 'Levi\'s', count: 64 }
  ],
  categories: [
    { category: 'Outerwear', count: 142 },
    { category: 'Bottoms', count: 128 },
    { category: 'Shoes', count: 95 }
  ]
};

export default function Trends() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Attempt fetch, fallback to mock
    fetch('http://localhost:3001/api/trends')
      .then(r => r.json())
      .then(d => setData(d.trends || MOCK_TRENDS))
      .catch(() => setData(MOCK_TRENDS));
  }, []);

  if (!data) return (
    <div className="py-40 flex flex-col items-center justify-center bg-black w-full min-h-full">
      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="text-[10px] font-black text-white/20 uppercase tracking-[1em]">Establishing Link</p>
    </div>
  );

  return (
    <div className="flex flex-col bg-black text-white pb-16 pt-8 px-8 w-full min-h-full relative overflow-y-auto">
      <div className="px-2">
        <BackButton className="mb-4 text-gray-500" />
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-light tracking-tighter mb-2">Trends.</h1>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">Node Intelligence</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> Live
          </div>
        </div>

        {/* Hero Stat */}
        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 p-10 rounded-[3rem] mb-12 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
          <p className="text-gray-500 text-[9px] font-black uppercase tracking-[0.6em] mb-4">Top Mover</p>
          <h2 className="text-4xl font-light tracking-tight mb-4">{data.demand?.[0]?.label || 'Loading...'}</h2>
          <div className="flex items-center gap-3 text-green-400">
             <TrendingUp size={20} />
             <span className="font-black text-2xl tracking-tighter">{data.demand?.[0]?.trend}</span>
             <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest ml-2">Vs Last Cycle</span>
          </div>
        </div>

        {/* Brand Leaderboard */}
        <section className="mb-12">
          <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.8em] mb-8">Node Popularity</h3>
          <div className="space-y-3">
            {data.brands.map((b: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-white/[0.03] p-6 rounded-[2rem] border border-white/[0.05] hover:bg-white/[0.05] transition-colors">
                 <div className="flex items-center gap-6">
                   <span className="text-white/20 font-black text-xs">0{i+1}</span>
                   <span className="font-light text-lg tracking-tight">{b.brand}</span>
                 </div>
                 <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{b.count} Items</span>
              </div>
            ))}
          </div>
        </section>

        {/* Emerging Categories */}
        <section className="pb-12">
          <h3 className="text-[9px] font-black text-gray-500 uppercase tracking-[0.8em] mb-8">Structural Shifts</h3>
          <div className="flex flex-wrap gap-3">
             {data.categories.map((c: any, i: number) => (
               <div key={i} className="bg-white/[0.03] px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/[0.05] text-white/60">
                  {c.category} <span className="text-white/20 ml-2">({c.count})</span>
               </div>
             ))}
          </div>
        </section>
      </div>
    </div>
  );
}
