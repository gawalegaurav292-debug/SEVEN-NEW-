
import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowUpRight, Globe, Link as LinkIcon, ShieldCheck, Terminal, Search } from 'lucide-react';
import { groundedShopSearch } from '../services/geminiService';

export default function RAGShop() {
  const [query, setQuery] = useState('');
  const [analysis, setAnalysis] = useState<string>('');
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setAnalysis('');
    setSources([]);

    try {
      const res = await groundedShopSearch(query);
      setAnalysis(res.text);
      setSources(res.sources);
    } catch (e) {
      console.error(e);
      setAnalysis("Product unavailable within verified official brand nodes.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-32 pt-28 px-10 overflow-y-auto scrollbar-hide">
      <div className="mb-12">
        <div className="flex justify-between items-center mb-8">
           <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
             <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-300">Global Finder Node</p>
           </div>
           <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center shadow-2xl">
             <Search size={22} strokeWidth={1.5} />
           </div>
        </div>
        <h1 className="text-5xl font-light tracking-tighter leading-none mb-4">Product<br/>Retrieval.</h1>
        <p className="text-gray-400 text-sm font-light leading-relaxed max-w-[280px]">
          Direct verification against official brand nodes. No AI-generated proxies allowed.
        </p>
      </div>

      <form onSubmit={handleSearch} className="relative mb-12 group">
        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-black transition-colors">
          <Terminal size={20} />
        </div>
        <input 
          value={query} 
          onChange={e => setQuery(e.target.value)} 
          placeholder="e.g. Ralph Lauren navy blue linen shirt" 
          className="w-full p-8 pl-16 pr-16 bg-gray-50 border border-transparent rounded-[2.5rem] text-lg focus:outline-none focus:bg-white focus:border-black transition-all shadow-inner" 
        />
        <button 
          type="submit" 
          disabled={loading || !query.trim()}
          className="absolute right-4 top-4 p-4 bg-black text-white rounded-[1.8rem] transition-all hover:scale-105 active:scale-95"
        >
          {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <ArrowRight size={24} />}
        </button>
      </form>

      {analysis && (
        <div className="mb-12 p-10 bg-gray-50 rounded-[3rem] border border-gray-100 animate-in fade-in duration-1000">
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck size={18} className="text-green-500" />
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-300">Verified Output</p>
          </div>
          <div className="prose prose-sm prose-gray max-w-none">
             <p className="text-xl font-light leading-relaxed text-gray-800 whitespace-pre-wrap">{analysis}</p>
          </div>
        </div>
      )}

      {sources.length > 0 && (
        <div className="animate-in fade-in duration-1000">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-300 mb-8">Source Verification Logs</p>
          <div className="space-y-3">
            {sources.map((s, i) => (
              <a key={i} href={s.web?.uri} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] group hover:bg-black transition-colors border border-transparent hover:border-black">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:text-black shadow-sm transition-colors">
                    <Globe size={16} />
                  </div>
                  <div className="text-left">
                    <span className="block text-[9px] font-bold uppercase tracking-widest text-gray-400 group-hover:text-white/40 mb-1">
                      {new URL(s.web?.uri).hostname}
                    </span>
                    <span className="text-sm font-light text-gray-800 group-hover:text-white truncate block max-w-[200px]">
                      {s.web?.title || 'Verified Product Node'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></div>
                   <ArrowUpRight size={16} className="text-gray-300 group-hover:text-white" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {!loading && !analysis && (
        <div className="text-center py-24 opacity-5">
          <p className="text-[10px] font-bold uppercase tracking-[1em] text-black">Awaiting Retrieval Request</p>
        </div>
      )}
    </div>
  );
}
