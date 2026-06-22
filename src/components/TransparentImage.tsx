import React, { useState, useEffect } from 'react';
import { getLocalFallbackUrl } from '../utils/AssetManager';

const transparentImageCache: Record<string, string> = {};

export const getTransparentImage = (src: string, callback: (url: string) => void) => {
  if (!src) return;
  if (src.startsWith('data:')) {
    callback(src);
    return;
  }
  if (transparentImageCache[src]) {
    callback(transparentImageCache[src]);
    return;
  }

  let currentSrc = src;
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    if (currentSrc.includes('.svg')) {
      transparentImageCache[src] = currentSrc;
      callback(currentSrc);
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      callback(currentSrc);
      return;
    }
    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    // Iterate over pixels to remove white background
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 240 && g > 240 && b > 240) {
        data[i + 3] = 0; // set alpha to 0
      }
    }
    ctx.putImageData(imgData, 0, 0);
    try {
      const dataUrl = canvas.toDataURL();
      transparentImageCache[src] = dataUrl;
      callback(dataUrl);
    } catch (e) {
      callback(currentSrc);
    }
  };
  img.onerror = () => {
    const fallback = getLocalFallbackUrl(currentSrc);
    if (fallback !== currentSrc) {
      console.warn(`CDN asset load failed, falling back to local: ${fallback}`);
      currentSrc = fallback;
      img.src = fallback;
    } else {
      callback(src);
    }
  };
  img.src = src;
};

interface TransparentImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
}

export const TransparentImage: React.FC<TransparentImageProps> = ({ src, alt, style, className }) => {
  const [displaySrc, setDisplaySrc] = useState(src);

  useEffect(() => {
    let active = true;
    getTransparentImage(src, (url) => {
      if (active) {
        setDisplaySrc(url);
      }
    });
    return () => {
      active = false;
    };
  }, [src]);

  return <img src={displaySrc} alt={alt} style={style} className={className} />;
};
