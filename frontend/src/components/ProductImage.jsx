import { useState } from 'react';
import { ImageOff, LoaderCircle } from 'lucide-react';

const isExternalHttpsUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.includes('.') && !url.username && !url.password;
  } catch {
    return false;
  }
};

function getCategoryFallbackImage(category = '', title = '', sku = '') {
  const identity = `${String(title).trim().toLowerCase()}|${String(category).trim().toLowerCase()}|${String(sku).trim().toLowerCase()}`;
  let lock = 2166136261;
  for (const char of identity) lock = Math.imul(lock ^ char.charCodeAt(0), 16777619) >>> 0;
  const tags = [...new Set(`${title} ${category}`.toLowerCase().match(/[a-z0-9]+/g) || [])].filter((tag) => tag.length > 2).slice(0, 8);
  if (!tags.length) return 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=900&q=85';
  return `https://loremflickr.com/900/900/${encodeURIComponent(tags.join(','))}?lock=${lock}`;
}

export function ProductImage({ product, className = '', loading = 'lazy' }) {
  const primary = product?.image || product?.images?.[0] || '';
  const category = typeof product?.category === 'string' ? product.category : product?.category?.name || '';
  const fallback = getCategoryFallbackImage(category, product?.name, product?.sku);
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
    <div className={`relative grid h-full w-full place-items-center overflow-hidden bg-[#f0efe9] ${className}`}>
      {status !== 'broken' ? <img
        key={src}
        src={src}
        alt={product?.name || 'Product image'}
        loading={loading}
        onLoad={() => updateImageState({ status: 'loaded' })}
        onError={onError}
        className={`w-full h-full object-contain object-center p-2 transition-opacity duration-200 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
      /> : <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#f0efe9] p-3 text-center text-slate-400">
        <ImageOff size={22} aria-hidden="true" />
        <span className="line-clamp-2 text-[10px] font-medium">{product?.name || 'Product image'}</span>
      </div>}
      {status === 'loading' && <div role="status" aria-label="Loading product image" className="absolute inset-0 grid place-items-center bg-[#f0efe9]">
        <LoaderCircle size={20} className="animate-spin text-slate-400" />
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
