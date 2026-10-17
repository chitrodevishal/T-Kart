import { isValidExternalImageUrl } from '../utils/imageUrl.js';
import { createHash } from 'node:crypto';

const FALLBACK_IMAGES = [
  { match: /audio|headphone|speaker/i, url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=85' },
  { match: /tech|electronic|computer|phone/i, url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=900&q=85' },
  { match: /fashion|clothing|apparel/i, url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=85' },
  { match: /home|living|furniture|decor/i, url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85' },
  { match: /kitchen|dining|cook/i, url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=900&q=85' },
  { match: /beauty|cosmetic|skin|makeup/i, url: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=900&q=85' },
  { match: /sport|fitness|outdoor/i, url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=900&q=85' },
  { match: /accessor|bag|jewel|watch/i, url: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=85' },
];

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=900&q=85';
const PEXELS_API = 'https://api.pexels.com/v1/search';
const PEXELS_HOME = 'https://www.pexels.com';
const positiveInteger = (value, fallback) => Number.isInteger(Number(value)) && Number(value) > 0 ? Number(value) : fallback;
const STOP_WORDS = new Set(['and', 'with', 'for', 'the', 'a', 'an', 'of', 'to', 'by', 'product', 'set']);

function imageIdentity(value) {
  if (/^pexels:\d+$/i.test(String(value || ''))) return String(value).toLowerCase();
  if (/^[a-z0-9.-]+\//i.test(String(value || ''))) value = `https://${value}`;
  try {
    const url = new URL(value);
    const pexelsPhotoId = url.pathname.match(/\/photos\/(\d+)/)?.[1];
    return pexelsPhotoId ? `pexels:${pexelsPhotoId}` : `${url.hostname}${url.pathname}`.toLowerCase();
  } catch {
    return String(value || '').toLowerCase();
  }
}

function terms(value) {
  return String(value || '').toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 2 && !STOP_WORDS.has(word)) || [];
}

function relevanceScore(photo, title, category) {
  const alt = String(photo?.alt || '').toLowerCase();
  const titleTerms = [...new Set(terms(title))];
  const categoryTerms = [...new Set(terms(category))];
  return titleTerms.reduce((score, word) => score + (alt.includes(word) ? 8 : 0), 0) +
    categoryTerms.reduce((score, word) => score + (alt.includes(word) ? 2 : 0), 0);
}

function titleFallbackImage(title, category, productKey = '') {
  const identity = `${String(title).trim().toLowerCase()}|${String(category).trim().toLowerCase()}|${String(productKey).trim().toLowerCase()}`;
  const lock = Number.parseInt(createHash('sha256').update(identity).digest('hex').slice(0, 8), 16);
  const query = [...new Set([...terms(title), ...terms(category)])].slice(0, 8).join(',') || 'product';
  return `https://loremflickr.com/900/900/${encodeURIComponent(query)}?lock=${lock}`;
}

export function categoryFallbackImage(categoryName = '') {
  const category = String(categoryName || '');
  return FALLBACK_IMAGES.find(({ match }) => match.test(category))?.url || DEFAULT_FALLBACK;
}

export function createProductImageService({
  env = process.env,
  fetchImpl = globalThis.fetch,
  now = Date.now,
  logger = console,
} = {}) {
  const cache = new Map();
  const inFlight = new Map();
  const cacheTtlMs = positiveInteger(env.PEXELS_IMAGE_CACHE_TTL_MS, 86_400_000);
  const failureCacheTtlMs = positiveInteger(env.PEXELS_IMAGE_FAILURE_CACHE_TTL_MS, 60_000);
  const timeoutMs = positiveInteger(env.PEXELS_IMAGE_TIMEOUT_MS, 4_000);
  const maxCacheEntries = positiveInteger(env.PEXELS_IMAGE_CACHE_MAX_ENTRIES, 1_000);
  let providerBackoffUntil = 0;

  const cacheResult = (key, value, expiresAt) => {
    if (!cache.has(key) && cache.size >= maxCacheEntries) cache.delete(cache.keys().next().value);
    cache.set(key, { value, expiresAt });
  };

  const fallbackResult = (title, categoryName, productKey) => {
    const image = String(title || '').trim()
      ? titleFallbackImage(title, categoryName, productKey)
      : categoryFallbackImage(categoryName);
    return {
    image,
    images: [image],
    imageSource: String(title || '').trim() ? 'title-fallback' : 'category-fallback',
    imageCredit: '',
    imageCreditUrl: '',
    imageSourceUrl: '',
  };
  };

  const lookup = async (name, categoryName, { excludeImageUrls = [], cacheKeySuffix = '' } = {}) => {
    const fallback = fallbackResult(name, categoryName, cacheKeySuffix);
    const title = String(name || '').trim();
    if (!title) return fallback;

    const category = String(categoryName || '').trim();
    const query = [title, category, 'product'].filter(Boolean).join(' ');
    const cacheKey = `${query.toLowerCase()}|${cacheKeySuffix}`;
    const excluded = new Set(excludeImageUrls.map(imageIdentity));
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > now()) {
      const alternatives = cached.value.candidates || [cached.value.result].filter(Boolean);
      const cachedChoice = alternatives.find((item) => !excluded.has(imageIdentity(item.image)));
      if (cachedChoice) return cachedChoice;
      if (!cached.value.candidates) cache.delete(cacheKey);
    }
    if (inFlight.has(cacheKey)) return inFlight.get(cacheKey);

    const request = (async () => {
      const apiKey = String(env.PEXELS_API_KEY || '').trim();
      if (!apiKey || providerBackoffUntil > now()) {
        cacheResult(cacheKey, { result: fallback }, now() + failureCacheTtlMs);
        return fallback;
      }

      let timeout;
      const controller = new AbortController();
      try {
        const url = new URL(PEXELS_API);
        url.searchParams.set('query', query);
        url.searchParams.set('per_page', '10');
        url.searchParams.set('orientation', 'square');

        const timeoutPromise = new Promise((_, reject) => {
          timeout = setTimeout(() => {
            controller.abort();
            const error = new Error('Pexels request timed out');
            error.code = 'ETIMEDOUT';
            reject(error);
          }, timeoutMs);
        });
        const response = await Promise.race([
          fetchImpl(url, { headers: { Authorization: apiKey }, signal: controller.signal }),
          timeoutPromise,
        ]);

        if (response.status === 429) {
          const retryAfter = response.headers?.get?.('retry-after');
          const retryAfterMs = Number(retryAfter) > 0
            ? Number(retryAfter) * 1_000
            : Math.max(0, Date.parse(retryAfter) - now()) || failureCacheTtlMs;
          providerBackoffUntil = Math.max(providerBackoffUntil, now() + retryAfterMs);
          logger.warn?.('[product-image] Pexels rate limit reached; product-specific fallback used.');
          cacheResult(cacheKey, { result: fallback }, Math.max(now() + failureCacheTtlMs, providerBackoffUntil));
          return fallback;
        }
        if (!response.ok) throw new Error(`Pexels returned HTTP ${response.status}`);

        const payload = await Promise.race([response.json(), timeoutPromise]);
        const photos = Array.isArray(payload?.photos) ? payload.photos : [];
        const rankedPhotos = photos.map((photo) => ({ photo, score: relevanceScore(photo, title, category) }))
          .filter(({ photo }) => {
            const candidate = photo?.src?.large || photo?.src?.medium || photo?.src?.large2x;
            if (!isValidExternalImageUrl(candidate)) return false;
            const hostname = new URL(candidate).hostname.toLowerCase();
            return (hostname === 'images.pexels.com' || hostname.endsWith('.pexels.com')) && !excluded.has(imageIdentity(candidate));
          })
          .sort((left, right) => right.score - left.score || Number(left.photo.id || 0) - Number(right.photo.id || 0));

        if (!rankedPhotos.length) {
          cacheResult(cacheKey, { result: fallback }, now() + failureCacheTtlMs);
          return fallback;
        }

        const candidates = rankedPhotos.map(({ photo }) => {
          const image = photo.src.large || photo.src.medium || photo.src.large2x;
          return {
            image,
            images: [image],
            imageSource: 'pexels',
            imageCredit: String(photo.photographer || ''),
            imageCreditUrl: isValidExternalImageUrl(photo.photographer_url) ? photo.photographer_url : PEXELS_HOME,
            imageSourceUrl: isValidExternalImageUrl(photo.url) ? photo.url : PEXELS_HOME,
          };
        });
        const result = candidates[0];
        cacheResult(cacheKey, { candidates }, now() + cacheTtlMs);
        return result;
      } catch (error) {
        logger.warn?.(`[product-image] ${error.code === 'ETIMEDOUT' ? 'Pexels request timed out' : error.message}; product-specific fallback used.`);
        cacheResult(cacheKey, { result: fallback }, now() + failureCacheTtlMs);
        return fallback;
      } finally {
        clearTimeout(timeout);
      }
    })();

    inFlight.set(cacheKey, request);
    try {
      return await request;
    } finally {
      inFlight.delete(cacheKey);
    }
  };

  return { lookup, clearCache: () => cache.clear() };
}

const productImageService = createProductImageService();

export default productImageService;
