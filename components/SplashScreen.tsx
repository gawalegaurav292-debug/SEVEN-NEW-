
import React, { useEffect, useState } from 'react';

export const SplashScreen: React.FC = () => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800);
    return () => clearTimeout(t1);
  }, []);

  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-[9999]">
      <div className={`transition-all duration-1000 ease-out flex flex-col items-center ${phase >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <h1 className="text-black text-5xl font-light tracking-[0.2em] mb-4 transition-all duration-1000" 
            style={{ color: phase === 1 ? '#000' : '#8e8e8e' }}>SÉVEN</h1>
      </div>
      <div className="fixed bottom-12 w-full flex justify-center">
        <div className="h-[2px] bg-black transition-all duration-[2000ms] ease-in-out w-0 animate-[progress_2.5s_forwards]" />
      </div>
      <style>{`
        @keyframes progress { from { width: 0; } to { width: 240px; } }
      `}</style>
    </div>
  );
};
