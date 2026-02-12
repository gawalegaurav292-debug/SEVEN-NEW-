
import React from 'react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* Scan Line Indicator */}
      <div className="fixed top-0 left-0 right-0 h-[1px] bg-black/5 z-[1000]">
        <div className="h-full bg-black w-1/3 animate-[scan_3s_linear_infinite]" />
      </div>
      <style>{`
        @keyframes scan { 
          from { transform: translateX(-100%); } 
          to { transform: translateX(300%); } 
        }
      `}</style>

      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};
