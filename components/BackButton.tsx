import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface Props {
  label?: string;
  className?: string;
  color?: string;
  size?: number;
}

export const BackButton: React.FC<Props> = ({ 
  label = "Back", 
  className = "", 
  color = "currentColor",
  size = 22 
}) => {
  const navigate = useNavigate();
  
  return (
    <button 
      onClick={() => navigate(-1)} 
      className={`flex items-center gap-1.5 py-2 pr-4 transition-opacity hover:opacity-70 active:scale-95 ${className}`}
      style={{ color }}
      aria-label="Go back"
    >
      <ChevronLeft size={size} strokeWidth={2.5} />
      {label && <span className="text-sm font-medium leading-none pb-0.5">{label}</span>}
    </button>
  );
};
