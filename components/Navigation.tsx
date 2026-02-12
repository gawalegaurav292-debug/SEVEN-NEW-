
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Home, 
  Archive, 
  Sparkles, 
  Users, 
  User, 
  ShoppingBag 
} from 'lucide-react';

interface NavigationProps {
  cartCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({ cartCount }) => {
  const location = useLocation();
  const isDarkPage = location.pathname === '/live' || location.pathname === '/trends';

  if (isDarkPage) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 px-6 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)] z-[100] flex justify-between items-center max-w-2xl mx-auto">
      <NavItem to="/" icon={Home} label="Home" />
      <NavItem to="/archive" icon={Archive} label="Archive" />
      <div className="relative -top-6">
        <NavLink 
          to="/studio" 
          className={({ isActive }) => `
            w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300
            ${isActive ? 'bg-black text-white scale-110' : 'bg-white text-black border border-gray-100'}
          `}
        >
          <Sparkles size={24} />
        </NavLink>
      </div>
      <NavItem to="/community" icon={Users} label="Tribe" />
      <NavItem to="/profile" icon={User} label="Profile" />
      
      {cartCount > 0 && (
        <NavLink 
          to="/checkout" 
          className="absolute -top-16 right-6 bg-black text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-xl animate-bounce"
        >
          <ShoppingBag size={12} />
          {cartCount} Items
        </NavLink>
      )}
    </nav>
  );
};

const NavItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => `
      flex flex-col items-center gap-1.5 transition-all duration-300
      ${isActive ? 'text-black opacity-100' : 'text-gray-300 opacity-60'}
    `}
  >
    {/* Use children function to access isActive state for nested elements */}
    {({ isActive }) => (
      <>
        <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
        <span className="text-[8px] font-bold uppercase tracking-widest">{label}</span>
      </>
    )}
  </NavLink>
);
