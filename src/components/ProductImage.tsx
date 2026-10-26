import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { getCategoryFallbackImage, sanitizeImageUrl } from '../utils/imageFallback';

interface ProductImageProps {
  src?: string;
  alt: string;
  category?: Category | string;
  name?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  category = 'Spirits',
  name,
  className = '',
  width = 300,
  height = 300,
  priority = false,
}) => {
  const initialResolved = sanitizeImageUrl(src, category, name);
  const [currentSrc, setCurrentSrc] = useState<string>(initialResolved);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const resolved = sanitizeImageUrl(src, category, name);
    setCurrentSrc(resolved);
    setHasError(false);
    setIsLoaded(false);
  }, [src, category, name]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentSrc(getCategoryFallbackImage(category, name || alt));
    }
  };

  return (
    <div className={`relative overflow-hidden flex items-center justify-center bg-[#0c0d12] ${className}`}>
      <img
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={handleError}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-80'
        }`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
};
