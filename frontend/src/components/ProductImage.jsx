import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';

const FALLBACK_IMAGE = '/images/product-fallback.svg';

const isExternalHttpsUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.includes('.') && !url.username && !url.password;
  } catch {
    return false;
  }
};

export function ProductImage({ product, className = '', loading = 'lazy', naturalHeight = false, priority = false }) {
  const primary = product?.imageSource?.endsWith('-fallback') ? '' : product?.image || product?.images?.[0] || '';
  const fallback = FALLBACK_IMAGE;
  const canLoadPrimary = isExternalHttpsUrl(primary);
  const imageKey = `${primary}\u0000${fallback}`;
  const [imageState, setImageState] = useState(null);
  const currentState = imageState?.imageKey === imageKey
    ? imageState
    : { imageKey, usingFallback: !canLoadPrimary || primary === fallback, status: 'loading' };
  const updateImageState = (updates) => setImageState((previous) => {
    const current = previous?.imageKey === imageKey ? previous : currentState;
    return { ...current, ...updates };
  });
  const { usingFallback, status } = currentState;
  const src = usingFallback ? fallback : primary;
  const onError = () => {
    if (!usingFallback && src !== fallback) {
      updateImageState({ usingFallback: true, status: 'loading' });
    } else {
      updateImageState({ status: 'broken' });
    }
  };

  return (
    <div className={`relative ${naturalHeight ? 'w-full' : 'grid h-full w-full place-items-center'} overflow-hidden bg-[#f0efe9] ${naturalHeight && status === 'broken' ? 'min-h-32' : ''} ${className}`}>
      {status !== 'broken' ? <img
        key={src}
        src={src}
        alt={product?.name || 'Product image'}
        width={600}
        height={600}
        loading={priority ? 'eager' : loading}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => updateImageState({ status: 'loaded' })}
        onError={onError}
        className={`block w-full ${naturalHeight ? 'h-auto' : 'h-full'} object-contain object-center p-1 transition-opacity duration-200 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
      /> : <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#f0efe9] p-3 text-center text-slate-400">
        <ImageOff size={22} aria-hidden="true" />
        <span className="line-clamp-2 text-[10px] font-medium">{product?.name || 'Product image'}</span>
      </div>}
      {status === 'loading' && <div className="absolute inset-0 grid place-items-center bg-[#f0efe9]">
        <LoadingSpinner label="Loading product image" size="h-6 w-6" />
      </div>}
    </div>
  );
}

export function ProductImageCredit({ product, className = '' }) {
  if (product?.imageSource !== 'pexels') return null;
  const photographer = product.imageCredit || 'Pexels photographer';
  const photographerUrl = isExternalHttpsUrl(product.imageCreditUrl) ? product.imageCreditUrl : 'https://www.pexels.com';
  const photoUrl = isExternalHttpsUrl(product.imageSourceUrl) ? product.imageSourceUrl : 'https://www.pexels.com';
  return <p className={`text-[10px] leading-4 text-slate-400 ${className}`}>
    Photo by <a href={photographerUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-emerald-800">{photographer}</a> on <a href={photoUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-emerald-800">Pexels</a>
  </p>;
}
