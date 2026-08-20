import React from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { INVENTORY } from '../constants';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

const data = [
  { name: 'Mon', clicks: 400 },
  { name: 'Tue', clicks: 300 },
  { name: 'Wed', clicks: 550 },
  { name: 'Thu', clicks: 450 },
  { name: 'Fri', clicks: 700 },
  { name: 'Sat', clicks: 800 },
  { name: 'Sun', clicks: 600 },
];

export const BrandBoost: React.FC = () => {
  return (
    <div className="w-full bg-black text-white pb-24 pt-12 px-6 relative">
      <div className="flex justify-between items-center mb-8 px-2">
        <h2 className="text-2xl font-bold tracking-tight">Brand Boost <span className="text-yellow-500">.</span></h2>
        <span className="text-xs font-medium border border-white/20 px-3 py-1 rounded-full">Beta</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 px-2">
        <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 text-gray-400">
            <Users size={16} />
            <span className="text-xs uppercase tracking-wider">Impressions</span>
          </div>
          <p className="text-2xl font-bold">12.5K</p>
        </div>
        <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 text-gray-400">
             <DollarSign size={16} />
             <span className="text-xs uppercase tracking-wider">Spend</span>
          </div>
          <p className="text-2xl font-bold">$450</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white/5 p-6 rounded-3xl mb-8 border border-white/10 mx-2">
        <h3 className="text-sm font-medium mb-6 flex items-center gap-2">
          <TrendingUp size={16} className="text-green-400" /> 
          Weekly Engagement
        </h3>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: 'rgba(255,255,255,0.1)'}} 
                contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#333', color: '#fff' }}
              />
              <Bar dataKey="clicks" fill="#fff" radius={[4, 4, 4, 4]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Active Promotions */}
      <div className="px-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Active Promotions</h3>
        <div className="space-y-4">
          {INVENTORY.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <img src={item.image} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                 <p className="font-medium text-sm text-white">{item.name}</p>
                 <p className="text-xs text-gray-500">Daily Budget: $50</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            </div>
          ))}
        </div>
        
        <button className="w-full mt-12 bg-white text-black py-4 rounded-full font-bold text-sm tracking-wide shadow-xl active:scale-95 transition-all mb-10">
          + Boost New Product
        </button>
      </div>
    </div>
  );
};