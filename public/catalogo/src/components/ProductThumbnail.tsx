import React from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface ProductThumbnailProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md';
}

export function ProductThumbnail({ src, alt, size = 'md' }: ProductThumbnailProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-14 h-14'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-xl overflow-hidden bg-[var(--surface-100)] border border-[var(--surface-200)] flex-shrink-0`}>
      <ImageWithFallback
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        style={{ borderRadius: '12px' }}
      />
    </div>
  );
}