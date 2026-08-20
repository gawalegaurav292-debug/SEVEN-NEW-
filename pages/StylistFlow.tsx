
import React, { useState, useRef } from 'react';
import { Camera, PhoneCall, ArrowRight, X, Cpu, Fingerprint, Shield, Sparkles, Palette, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Outfit } from '../types';
import { analyzeStyleImage } from '../services/geminiService';

interface StylistFlowProps {
  setOutfit: (outfit: Outfit | null) => void;
}

interface ServiceCardProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onClick: () => void;
  highlight?: boolean;
}

export const StylistFlow: React.FC<StylistFlowProps> = ({ setOutfit }) => {
  const [view, setView] = useState<'upload' | 'analyzing' | 'report' | 'result'>('upload');
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setImage(reader.result as string);
        setView('analyzing');
        
        try {
          const result = await analyzeStyleImage(base64);
          setAnalysis(result);
          setView('report');
        } catch (err) {
          console.error("Analysis Failed:", err);
          setView('upload');
          alert("Unable to analyze image at this time.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (view === 'upload') {
    return (
      <div className="flex flex-col p-8 pt-12 animate-premium w-full max-w-lg mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center shadow-lg">
              <Cpu size={16} className="text-white" />
            </div>
            <p className="text-[11px] tracking-[0.4em] uppercase font-bold text-black/70">Stylist Hub</p>
          </div>
          <h1 className="text-6xl font-light tracking-tighter mb-4 leading-none text-black">STYLING.</h1>
          <p className="text-gray-600 text-lg font-light leading-relaxed">
            Concierge services for real-time curation and event styling.
          </p>
        </div>

        <div className="space-y-4">
          <ServiceCard icon={PhoneCall} title="Live Chat" subtitle="Personal Stylist" onClick={() => navigate('/live')} highlight />
          <ServiceCard icon={Calendar} title="Events" subtitle="Occasion Selection" onClick={() => navigate('/event')} />
          <ServiceCard icon={Camera} title="Scan Look" subtitle="Image Analysis" onClick={() => fileInputRef.current?.click()} />
        </div>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
      </div>
    );
  }

  if (view === 'analyzing') {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 p-12 text-center w-full flex-1">
        <div className="relative mb-8">
          <div className="w-20 h-20 border-4 border-t-black border-gray-100 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Fingerprint size={24} className="text-black/20" />
          </div>
        </div>
        <p className="text-[12px] font-bold uppercase tracking-[0.6em] text-black/60 animate-pulse">Analyzing Pattern DNA</p>
      </div>
    );
  }

  if (view === 'report') {
    return (
      <div className="flex flex-col p-8 pt-12 animate-premium w-full max-w-lg mx-auto pb-32">
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-4xl font-light tracking-tight leading-none uppercase">DNA<br/>Profile.</h2>
          <button onClick={() => setView('upload')} className="p-3 bg-gray-50 rounded-full active:scale-90 transition-transform"><X size={20} /></button>
        </div>

        <div className="space-y-6">
          <div className="aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl relative border border-gray-100">
            <img src={image!} className="w-full h-full object-cover grayscale transition-all duration-1000" alt="Source" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={12} className="text-white opacity-90" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-white opacity-80">Synthesis Results</p>
              </div>
              <h3 className="text-2xl font-light text-white tracking-tight uppercase">{analysis?.aesthetic || 'Visual Profile Detected'}</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100">
               <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Palette size={10} /> Palette
               </p>
               <div className="flex flex-wrap gap-1.5">
                 {analysis?.palette?.map((c: string) => (
                   <span key={c} className="text-[10px] font-bold text-black/80 px-2.5 py-1.5 bg-white rounded-lg shadow-sm uppercase">{c}</span>
                 ))}
               </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-[1.5rem] border border-gray-100">
               <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                 <Shield size={10} /> Verified
               </p>
               <div className="space-y-1.5">
                 {analysis?.keyItems?.slice(0, 3).map((it: string) => (
                   <p key={it} className="text-[11px] font-bold text-black/70 truncate uppercase tracking-wider">{it}</p>
                 ))}
               </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/')}
            className="w-full py-6 bg-black text-white text-[11px] font-bold uppercase tracking-[0.4em] shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-transform"
          >
            Enter Selection <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return null;
};

const ServiceCard: React.FC<ServiceCardProps> = ({ icon: Icon, title, subtitle, onClick, highlight }) => (
  <button 
    onClick={onClick}
    className={`w-full p-6 rounded-[1.5rem] flex items-center justify-between transition-all active:scale-[0.98] border ${
      highlight ? 'bg-black text-white border-black shadow-xl' : 'bg-white text-black border-gray-50 shadow-sm'
    }`}
  >
    <div className="flex items-center gap-5">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${highlight ? 'bg-white/10' : 'bg-gray-50'}`}>
        <Icon size={20} strokeWidth={highlight ? 2.5 : 2} />
      </div>
      <div className="text-left">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <p className={`text-[10px] uppercase tracking-[0.2em] font-bold ${highlight ? 'text-white/70' : 'text-gray-500'}`}>
          {subtitle}
        </p>
      </div>
    </div>
    {highlight ? (
      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,1)]"></div>
    ) : (
      <ArrowRight size={16} className="text-gray-300" />
    )}
  </button>
);
