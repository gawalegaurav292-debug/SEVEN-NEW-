import React from 'react';
import { UserPreferences, UserMemory } from '../types';
import { Trash2, Activity, Zap, History, Target, Server, MapPin, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC<{ prefs: UserPreferences }> = ({ prefs }) => {
  const navigate = useNavigate();
  const memoryRaw = localStorage.getItem('seven_dna_memory');
  const memory: UserMemory = memoryRaw ? JSON.parse(memoryRaw) : { history: [], tasteVector: { color: {}, fit: 'Analyzing', brands: [] } };
  
  const taste = memory.tasteVector;

  const getDominantColor = () => {
    const colors = Object.entries(taste.color || {}) as [string, number][];
    if (colors.length === 0) return 'Analyzing';
    return colors.sort((a, b) => b[1] - a[1])[0][0];
  };

  const clearMemory = () => {
    localStorage.removeItem('seven_dna_memory');
    window.location.reload();
  };

  return (
    <div className="flex flex-col w-full flex-1 bg-white overflow-hidden animate-premium">
      <header className="shrink-0 px-10 pt-16 pb-8 flex items-center justify-between border-b border-gray-100 z-10">
         <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 relative overflow-hidden">
              <User size={22} className="text-black" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-3xl font-medium tracking-tighter leading-none mb-2 text-black uppercase">Profile.</h2>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-black rounded-full"></div>
                <p className="text-[10px] text-black font-semibold uppercase tracking-[0.4em]">Verified</p>
              </div>
            </div>
         </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 scrollbar-hide pb-32">
        <section className="mb-16">
          <div className="flex items-center gap-3 mb-8">
            <Target size={18} className="text-black/30" strokeWidth={2} />
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.6em] text-black/30">Style Metrics</h3>
          </div>
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 relative overflow-hidden">
            <div className="grid grid-cols-2 gap-y-12 gap-x-10 relative z-10">
              <DnaStat label="Fit" value={taste.fit || 'Regular'} signal={taste.fit ? 88 : 0} />
              <DnaStat label="Palette" value={getDominantColor()} signal={Object.keys(taste.color || {}).length > 0 ? 92 : 0} />
              <DnaStat label="Brands" value={`${taste.brands.length} Selected`} signal={taste.brands.length > 0 ? 100 : 0} />
              <DnaStat label="History" value={`${memory.history?.length || 0} Saved`} signal={(memory.history?.length || 0) * 12} />
            </div>
            <div className="pt-10 mt-12 border-t border-gray-100 flex justify-between items-end">
               <div>
                  <p className="text-[11px] font-semibold text-black/20 uppercase tracking-[0.4em] mb-3">Investment</p>
                  <p className="font-medium text-3xl tracking-tighter text-black leading-none">${prefs.budget || 2000}</p>
               </div>
               <div className="text-right">
                  <p className="text-[11px] font-semibold text-black/20 uppercase tracking-[0.4em] mb-3">Tier</p>
                  <p className="font-medium text-xl tracking-tighter text-black leading-none uppercase">Privé</p>
               </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
           <h3 className="text-[11px] font-semibold uppercase tracking-[0.6em] text-black/30 mb-8">Options</h3>
           <MenuRow icon={Server} label="Retail Partners" onClick={() => navigate('/nodes')} />
           <MenuRow icon={History} label="Curation History" />
           <MenuRow icon={Activity} label="Sensitivity" />
           <MenuRow icon={MapPin} label="Region" />
           
           <div className="pt-12">
             <button onClick={clearMemory} className="w-full flex items-center justify-between p-8 border border-gray-100 hover:bg-red-50 hover:border-red-100 transition-all group rounded-[2rem]">
              <div className="flex items-center gap-6">
                <Trash2 size={18} className="text-red-500" strokeWidth={2} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-red-600">Reset Profile</span>
              </div>
            </button>
           </div>
        </section>
      </div>
    </div>
  );
};

const DnaStat = ({ label, value, signal }: { label: string, value: string, signal: number }) => (
  <div className="group">
    <p className="text-[10px] font-semibold text-black/20 uppercase tracking-[0.4em] mb-4">{label}</p>
    <p className="font-medium text-xl leading-none text-black mb-4 truncate tracking-tight uppercase">{value}</p>
    <div className="w-full h-[1.5px] bg-gray-50 relative">
      <div className="h-full bg-black transition-all duration-[2000ms] ease-out" style={{ width: `${Math.min(100, signal)}%` }}></div>
    </div>
  </div>
);

const MenuRow = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick?: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between p-8 border border-gray-100 hover:border-black transition-all active:scale-[0.99] group rounded-[2rem]">
    <div className="flex items-center gap-8">
      <Icon size={18} className="text-black/30 group-hover:text-black transition-colors" strokeWidth={2} />
      <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-black">{label}</span>
    </div>
    <div className="text-black/10 group-hover:text-black transition-all duration-300 transform group-hover:translate-x-1">
      <ChevronRight size={18} strokeWidth={2} />
    </div>
  </button>
);