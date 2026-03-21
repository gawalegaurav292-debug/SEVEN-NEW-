import React, { useState, useEffect, useRef } from 'react';
import {
  Fingerprint, ChevronLeft, Check, ShieldCheck,
  RefreshCcw, ExternalLink, Zap
} from 'lucide-react';

type Phase = 'SPLASH' | 'IDLE' | 'IDENTITY' | 'ALLOCATION' | 'REQUEST' | 'MATCHING' | 'VERDICT';

interface OutfitItem {
  category: 'TOP' | 'BOTTOM' | 'SHOES';
  brand: string;
  name: string;
  price: number;
  reason: string;
  image: string;
  url?: string;
}

interface ResultData {
  headline: string;
  total: number;
  occasion?: string;
  style?: string;
  outfit: OutfitItem[];
  // backward compat
  advice?: string;
  items?: { brand: string; name: string; price: number; image: string; url?: string }[];
}

const STYLE_ENDPOINT = 'https://atlayahjqrotfgvapxso.supabase.co/functions/v1/style';

const CATEGORY_LABEL: Record<string, string> = { TOP: 'Top', BOTTOM: 'Bottom', SHOES: 'Shoes' };

export default function App() {
  const [phase, setPhase] = useState<Phase>('SPLASH');
  const [identity, setIdentity] = useState<'Men' | 'Women'>('Men');
  const [budget, setBudget] = useState<number>(200);
  const [request, setRequest] = useState<string>('');
  const [result, setResult] = useState<ResultData | null>(null);
  const [loadingDot, setLoadingDot] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Splash timer
  useEffect(() => {
    if (phase === 'SPLASH') {
      const t = setTimeout(() => setPhase('IDLE'), 2600);
      return () => clearTimeout(t);
    }
  }, [phase]);

  // Loading dots animation
  useEffect(() => {
    if (phase !== 'MATCHING') return;
    const interval = setInterval(() => setLoadingDot(d => (d + 1) % 4), 420);
    return () => clearInterval(interval);
  }, [phase]);

  const handleSync = async () => {
    if (!request.trim()) return;
    setPhase('MATCHING');

    try {
      const res = await fetch(STYLE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request: request.trim(), identity, budget }),
      });
      const data: ResultData = await res.json();

      // Normalize: handle both new format (outfit[]) and old (items[])
      if (!data.outfit && data.items) {
        data.outfit = data.items.map((item, i) => ({
          category: (['TOP', 'BOTTOM', 'SHOES'] as const)[i] ?? 'TOP',
          brand: item.brand,
          name: item.name,
          price: item.price,
          reason: '',
          image: item.image,
          url: item.url,
        }));
        data.headline = data.advice ?? 'Your outfit, assembled with intent.';
      }

      setResult(data);
      // Tiny delay so MATCHING screen doesn't flash
      setTimeout(() => setPhase('VERDICT'), 600);
    } catch (e) {
      console.error('Style error:', e);
      setResult({
        headline: 'Clean lines. Confident presence. Always intentional.',
        total: 84.97,
        outfit: [
          { category: 'TOP',    brand: 'H&M',  name: 'White Cotton T-Shirt',  price: 9.99,  reason: 'The foundation of every clean outfit.',  image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80', url: 'https://www2.hm.com/en_us/productpage.0685816001.html' },
          { category: 'BOTTOM', brand: 'H&M',  name: 'Blue Denim Jeans',       price: 39.99, reason: 'Classic denim grounded in proportion.',   image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=500&q=80', url: 'https://www2.hm.com/en_us/productpage.0999373001.html' },
          { category: 'SHOES',  brand: 'H&M',  name: 'White Canvas Sneakers',  price: 34.99, reason: 'White soles keep the palette tight.',     image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',  url: 'https://www2.hm.com/en_us/productpage.0999380001.html' },
        ],
      });
      setTimeout(() => setPhase('VERDICT'), 600);
    }
  };

  const reset = () => {
    setPhase('IDLE');
    setRequest('');
    setResult(null);
  };

  // ── SPLASH ──────────────────────────────────────────────────────────────
  if (phase === 'SPLASH') return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}
      className="fixed inset-0 bg-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center"
          style={{ animation: 'scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
          <Fingerprint size={26} color="white" strokeWidth={1.5} />
        </div>
        <h1 className="text-black text-5xl font-light tracking-[0.3em]">SÉVEN</h1>
        <p className="text-gray-300 text-[9px] tracking-[0.6em] uppercase font-semibold">Authority First</p>
      </div>
      <div className="absolute bottom-10 w-40 h-[1px] bg-gray-100 overflow-hidden">
        <div className="h-full bg-black" style={{ animation: 'progressBar 2.4s linear forwards' }} />
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { transform: scale(0.5); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes progressBar { from { width: 0 } to { width: 100% } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.3 } }
        .fade-up { animation: fadeUp 0.45s ease forwards }
        .fade-in { animation: fadeIn 0.45s ease forwards }
      `}</style>
    </div>
  );

  // ── IDLE ────────────────────────────────────────────────────────────────
  if (phase === 'IDLE') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 fade-in">
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes scaleIn{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}} @keyframes progressBar{from{width:0}to{width:100%}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}} .fade-up{animation:fadeUp 0.45s ease forwards} .fade-in{animation:fadeIn 0.45s ease forwards}`}</style>
      <div className="mb-20 flex flex-col items-center gap-5">
        <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center">
          <Fingerprint size={26} color="white" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h1 className="text-black text-6xl font-light tracking-[0.2em] mb-2">SÉVEN</h1>
          <p className="text-gray-300 text-[9px] tracking-[0.6em] uppercase font-semibold">Authority First</p>
        </div>
        <p className="text-gray-400 text-sm text-center mt-2 max-w-[260px] leading-relaxed font-light">
          Describe what you want to wear.<br />Get a complete outfit decision.
        </p>
      </div>
      <button onClick={() => setPhase('IDENTITY')}
        className="fixed bottom-10 w-[calc(100%-48px)] max-w-sm bg-black text-white py-4 rounded-2xl font-semibold text-xs tracking-[0.3em] uppercase transition-all active:scale-[0.97]">
        Start
      </button>
    </div>
  );

  // ── IDENTITY ────────────────────────────────────────────────────────────
  if (phase === 'IDENTITY') return (
    <div className="min-h-screen bg-white p-6 pt-16 fade-up">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} .fade-up{animation:fadeUp 0.45s ease forwards}`}</style>
      <button onClick={() => setPhase('IDLE')} className="mb-10 text-gray-300 hover:text-black transition-colors">
        <ChevronLeft size={26} strokeWidth={1.5} />
      </button>
      <h2 className="text-black text-4xl font-light tracking-tight mb-2">Identity.</h2>
      <p className="text-gray-400 text-sm mb-10 font-light">Who are we dressing today?</p>
      <div className="space-y-3 max-w-sm">
        {(['Men', 'Women'] as const).map(type => (
          <div key={type} onClick={() => { setIdentity(type); setPhase('ALLOCATION'); }}
            className={`w-full p-6 border-2 ${identity === type ? 'border-black bg-black' : 'border-gray-100 bg-white'} rounded-2xl flex justify-between items-center cursor-pointer transition-all duration-200 active:scale-[0.98]`}>
            <span className={`text-xl font-light ${identity === type ? 'text-white' : 'text-black'}`}>{type}</span>
            {identity === type && <Check size={20} color="white" strokeWidth={2.5} />}
          </div>
        ))}
      </div>
    </div>
  );

  // ── ALLOCATION ──────────────────────────────────────────────────────────
  if (phase === 'ALLOCATION') return (
    <div className="min-h-screen bg-white p-6 pt-16 fade-up">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} .fade-up{animation:fadeUp 0.45s ease forwards}`}</style>
      <button onClick={() => setPhase('IDENTITY')} className="mb-10 text-gray-300 hover:text-black transition-colors">
        <ChevronLeft size={26} strokeWidth={1.5} />
      </button>
      <h2 className="text-black text-4xl font-light tracking-tight mb-2">Budget.</h2>
      <p className="text-gray-400 text-sm mb-10 font-light">We'll build the full outfit within this.</p>
      <div className="max-w-sm">
        <div className="bg-[#F8F8F8] rounded-3xl p-8 mb-8 text-center">
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.3em] mb-4">Total Budget</p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-light text-gray-200">$</span>
            <span className="text-7xl font-extralight text-black tracking-tight">{budget}</span>
          </div>
          <p className="text-[10px] text-gray-300 mt-3 font-light">Covers top · bottom · shoes</p>
        </div>
        <input type="range" min="80" max="500" step="10" value={budget}
          onChange={e => setBudget(Number(e.target.value))}
          className="w-full mb-10 accent-black" />
        <button onClick={() => setPhase('REQUEST')}
          className="w-full bg-black text-white py-4 rounded-2xl font-semibold text-xs tracking-[0.3em] uppercase transition-all active:scale-[0.97]">
          Continue
        </button>
      </div>
    </div>
  );

  // ── REQUEST ─────────────────────────────────────────────────────────────
  if (phase === 'REQUEST') return (
    <div className="min-h-screen bg-white p-6 pt-16 fade-up">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}} .fade-up{animation:fadeUp 0.45s ease forwards}`}</style>
      <button onClick={() => setPhase('ALLOCATION')} className="mb-10 text-gray-300 hover:text-black transition-colors">
        <ChevronLeft size={26} strokeWidth={1.5} />
      </button>
      <h2 className="text-black text-4xl font-light tracking-tight mb-2">What do you want?</h2>
      <p className="text-gray-400 text-sm mb-8 font-light">Describe it in your own words.</p>

      {/* Example chips */}
      <div className="flex flex-wrap gap-2 mb-8">
        {['White tee, dark jeans', 'Smart office look', 'Date night outfit', 'All black everything'].map(ex => (
          <button key={ex} onClick={() => setRequest(ex)}
            className="text-[11px] text-gray-400 border border-gray-150 rounded-full px-3 py-1.5 hover:border-gray-400 hover:text-black transition-all font-light">
            {ex}
          </button>
        ))}
      </div>

      <div className="max-w-sm">
        <div className="bg-[#F8F8F8] rounded-2xl p-5 mb-6 focus-within:ring-2 focus-within:ring-black/10 transition-all">
          <textarea ref={textareaRef} autoFocus value={request}
            onChange={e => setRequest(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && request.trim()) { e.preventDefault(); handleSync(); } }}
            placeholder="e.g. Grey hoodie and black cargo pants, streetwear vibe"
            className="w-full h-32 bg-transparent text-base font-light placeholder:text-gray-200 resize-none outline-none leading-relaxed" />
        </div>
        <button onClick={handleSync} disabled={!request.trim()}
          className={`w-full py-4 rounded-2xl font-semibold text-xs tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-2
            ${request.trim() ? 'bg-black text-white active:scale-[0.97]' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
          <Zap size={14} strokeWidth={2} />
          Decide My Outfit
        </button>
      </div>
    </div>
  );

  // ── MATCHING ────────────────────────────────────────────────────────────
  if (phase === 'MATCHING') return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-8">
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      {/* Elegant spinner */}
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border border-gray-100 rounded-full" />
        <div className="absolute inset-0 border-t border-black rounded-full"
          style={{ animation: 'spin 0.9s linear infinite' }} />
      </div>
      <div className="text-center">
        <p className="text-black text-[10px] font-bold uppercase tracking-[0.5em] mb-2">
          Building outfit{'.'.repeat(loadingDot + 1)}
        </p>
        <p className="text-gray-300 text-[11px] font-light">Analyzing intent · Matching products · Checking harmony</p>
      </div>
    </div>
  );

  // ── VERDICT ─────────────────────────────────────────────────────────────
  if (phase === 'VERDICT' && result) {
    const items = result.outfit ?? [];
    const totalCalc = result.total ?? items.reduce((s, i) => s + i.price, 0);

    return (
      <div className="min-h-screen bg-white fade-in">
        <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}} .fade-in{animation:fadeIn 0.5s ease forwards} .stagger-1{animation:fadeUp 0.5s 0.1s ease both} .stagger-2{animation:fadeUp 0.5s 0.2s ease both} .stagger-3{animation:fadeUp 0.5s 0.3s ease both} .stagger-4{animation:fadeUp 0.5s 0.4s ease both}`}</style>

        {/* Header bar */}
        <div className="px-6 pt-14 pb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-full">
              <ShieldCheck size={12} strokeWidth={2.5} />
              <span className="text-[9px] font-bold uppercase tracking-[0.3em]">Outfit Decided</span>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-gray-300 uppercase tracking-widest font-semibold">{result.occasion ?? 'Outfit'}</p>
              <p className="text-black text-2xl font-light tracking-tight">${totalCalc.toFixed(2)}</p>
            </div>
          </div>

          {/* Headline */}
          <div className="stagger-1 bg-[#F8F8F8] rounded-2xl p-5 mb-6">
            <p className="text-[9px] text-gray-300 uppercase tracking-widest font-semibold mb-2">Stylist Note</p>
            <p className="text-black text-base font-light leading-snug italic">"{result.headline}"</p>
          </div>

          {/* Style tag */}
          {result.style && (
            <div className="flex gap-2 mb-6 stagger-2">
              <span className="text-[10px] text-gray-400 border border-gray-150 rounded-full px-3 py-1 font-light capitalize">{result.style}</span>
              {result.occasion && <span className="text-[10px] text-gray-400 border border-gray-150 rounded-full px-3 py-1 font-light capitalize">{result.occasion}</span>}
            </div>
          )}
        </div>

        {/* Outfit items */}
        <div className="px-6 space-y-4 pb-28">
          {items.map((item, idx) => (
            <div key={idx} className={`stagger-${idx + 2} bg-white border border-gray-100 rounded-2xl overflow-hidden flex gap-0`}
              style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.04)' }}>
              {/* Image */}
              <div className="w-28 flex-shrink-0 bg-gray-50 relative">
                <img src={item.image} alt={item.name}
                  className="w-full h-full object-cover"
                  style={{ minHeight: '120px', maxHeight: '140px' }}
                  onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&q=80'; }} />
                {/* Category badge */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded">
                  {CATEGORY_LABEL[item.category] ?? item.category}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[9px] text-gray-300 uppercase tracking-widest font-bold mb-1">{item.brand}</p>
                  <h4 className="text-black text-sm font-medium leading-tight mb-2">{item.name}</h4>
                  {item.reason && (
                    <p className="text-gray-400 text-[11px] font-light leading-snug italic">"{item.reason}"</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-black font-semibold text-sm">${item.price.toFixed(2)}</span>
                  {item.url && (
                    <button onClick={() => window.open(item.url, '_blank')}
                      className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-black transition-colors font-medium">
                      Shop <ExternalLink size={11} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            <div>
              <p className="text-[9px] text-gray-300 uppercase tracking-widest">Total</p>
              <p className="text-black text-xl font-light">${totalCalc.toFixed(2)}</p>
            </div>
            <button onClick={reset}
              className="flex items-center gap-2 text-[11px] text-gray-400 hover:text-black transition-colors font-medium uppercase tracking-widest">
              <RefreshCcw size={13} strokeWidth={2} />
              New Outfit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
