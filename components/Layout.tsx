
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Shirt, Globe } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  cartCount: number;
}

const GlobalScan = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 1));
    }, 180);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2px] bg-gray-50 overflow-hidden pointer-events-none">
      <div 
        className="h-full bg-black transition-all duration-300 ease-linear" 
        style={{ width: `${progress}%` }} 
      />
    </div>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: Home, path: '/', label: 'PROTOCOL' },
    { icon: Shirt, path: '/wardrobe', label: 'WARDROBE' },
    { icon: Globe, path: '/trends', label: 'NODES' },
  ];

  const hideNav = location.pathname.startsWith('/product/') || location.pathname === '/';

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      <GlobalScan />
      
      <main className="flex-1 relative w-full overflow-hidden" style={{ paddingTop: 'var(--safe-top)' }}>
        {children}
      </main>

      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 glass border-t border-black/[0.03] flex items-center justify-between px-10 z-[9998]" style={{ paddingBottom: 'calc(var(--safe-bottom) + 1.25rem)', paddingTop: '1rem' }}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 transition-all duration-300 outline-none ${
                  isActive ? 'text-black' : 'text-black/40'
                }`}
              >
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[9px] font-bold tracking-[0.2em] uppercase transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
};
