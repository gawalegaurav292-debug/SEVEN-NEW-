import React, { useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';

interface ProductImageProps {
  src: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  aspectRatio?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  className = "",
  imageClassName = "",
  aspectRatio = "aspect-[3/4]"
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`${aspectRatio} w-full bg-gray-50 flex flex-col items-center justify-center text-gray-300 ${className}`}>
        <ImageOff size={24} strokeWidth={1} className="mb-2 opacity-50" />
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Unavailable</span>
      </div>
    );
  }

  return (
    <div className={`${aspectRatio} w-full bg-gray-50 relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10 bg-gray-100 animate-pulse flex items-center justify-center">
           <Loader2 className="w-5 h-5 text-gray-300 animate-spin opacity-40" />
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        className={`w-full h-full object-cover transition-all duration-700 ease-out ${
          isLoading ? 'opacity-0 scale-105 blur-md' : 'opacity-100 scale-100 blur-0'
        } ${imageClassName}`}
      />
    </div>
  );
};