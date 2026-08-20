import React from 'react';
import { ShieldCheck, Wifi, Globe, Lock, ArrowUpRight, Activity } from 'lucide-react';
import { BackButton } from '../components/BackButton';

const BRANDS = [
  { name: 'Ralph Lauren', domain: 'ralphlauren.com', latency: '42ms', status: 'Secure', uptime: '99.9%' },
  { name: 'Dior', domain: 'dior.com', latency: '65ms', status: 'Secure', uptime: '99.8%' },
  { name: 'Zara', domain: 'zara.com', latency: '38ms', status: 'Secure', uptime: '99.9%' },
  { name: 'Uniqlo', domain: 'uniqlo.com', latency: '52ms', status: 'Secure', uptime: '99.9%' },
  { name: 'Nike', domain: 'nike.com', latency: '45ms', status: 'Secure', uptime: '99.7%' },
];

export const PartnerBrands: React.FC = () => {
  return (
    <div className="flex flex-col bg-white pb-16 pt-16 px-8 w-full">
      <div className="px-2">
        <BackButton className="mb-10" />
        <div className="mb-16">
          <div className="flex items-center gap-3 mb-6">
             <ShieldCheck size={18} className="text-black" />
             <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-300">Authorized Nodes</p>
          </div>
          <h1 className="text-5xl font-light tracking-tighter leading-none mb-4">Official<br/>Gateways.</h1>
          <p className="text-gray-400 text-sm font-light leading-relaxed max-w-[280px]">
            Direct SSL-handshake connections with global brand origins. Zero third-party indexing.
          </p>
        </div>

        <div className="space-y-4">
          {BRANDS.map((b) => (
            <div key={b.name} className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100 group hover:border-black transition-colors">
              <div className="flex justify-between items-start mb-10">
                <div>
                   <h2 className="text-2xl font-light tracking-tight mb-1">{b.name}</h2>
                   <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{b.domain}</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full">
                  <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] font-bold text-green-700 uppercase tracking-widest">{b.status}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                 <div>
                   <p className="text-[8px] font-bold uppercase tracking-widest text-gray-300 mb-2">Latency</p>
                   <p className="text-sm font-medium">{b.latency}</p>
                 </div>
                 <div>
                   <p className="text-[8px] font-bold uppercase tracking-widest text-gray-300 mb-2">Uptime</p>
                   <p className="text-sm font-medium">{b.uptime}</p>
                 </div>
                 <div className="text-right flex items-end justify-end">
                   <button className="p-2 bg-white rounded-full shadow-sm group-hover:bg-black group-hover:text-white transition-all">
                      <ArrowUpRight size={14} />
                   </button>
                 </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-20 p-10 bg-black text-white rounded-[3.5rem] relative overflow-hidden mb-12">
          <Activity className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10" />
          <h3 className="text-xl font-light mb-4 tracking-tight">Node Integrity.</h3>
          <p className="text-[10px] text-white/40 leading-relaxed font-light uppercase tracking-widest mb-10">
            Global verification cluster active across 12 regions. Real-time parity enforcement enabled.
          </p>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-[9px] font-bold uppercase tracking-widest">SÉVEN Network Optimal</span>
          </div>
        </div>
      </div>
    </div>
  );
};