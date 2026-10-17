import test from 'node:test';
import assert from 'node:assert/strict';
import { createProductImageService, categoryFallbackImage } from '../services/productImageService.js';
import { isValidExternalImageUrl } from '../utils/imageUrl.js';

const photoUrl = 'https://images.pexels.com/photos/12345/sample.jpeg';
const pexelsResponse = (status = 200, payload = { photos: [{
  src: { large2x: photoUrl },
  photographer: 'Sample Photographer',
  photographer_url: 'https://www.pexels.com/@sample-photographer',
  url: 'https://www.pexels.com/photo/sample-photo-12345/',
}] }, headers = {}) => ({
  ok: status >= 200 && status < 300,
  status,
  headers: { get: (name) => headers[name.toLowerCase()] || null },
  json: async () => payload,
});

const quietLogger = { warn() {} };

test('searches by product title and category, returns a validated Pexels URL, and caches the result', async () => {
  let calls = 0;
  let requestedUrl;
  const service = createProductImageService({
    env: { PEXELS_API_KEY: 'test-key', PEXELS_IMAGE_CACHE_TTL_MS: '60000' },
    logger: quietLogger,
    fetchImpl: async (url, options) => {
      calls += 1;
      requestedUrl = new URL(url);
      assert.equal(options.headers.Authorization, 'test-key');
      return pexelsResponse();
    },
  });

  const first = await service.lookup('Bluetooth Audio Receiver', 'Audio & Tech');
  const second = await service.lookup('Bluetooth Audio Receiver', 'Audio & Tech');

  assert.match(requestedUrl.searchParams.get('query'), /Bluetooth Audio Receiver Audio & Tech product/);
  assert.equal(first.image, photoUrl);
  assert.deepEqual(first.images, [photoUrl]);
  assert.equal(first.imageSource, 'pexels');
  assert.equal(first.imageCredit, 'Sample Photographer');
  assert.equal(second.image, photoUrl);
  assert.equal(calls, 1);
});

test('coalesces concurrent requests for the same search query', async () => {
  let calls = 0;
  const service = createProductImageService({
    env: { PEXELS_API_KEY: 'test-key' },
    logger: quietLogger,
    fetchImpl: async () => { calls += 1; await new Promise((resolve) => setTimeout(resolve, 10)); return pexelsResponse(); },
  });
  const results = await Promise.all([
    service.lookup('Travel Mug', 'Kitchen'),
    service.lookup('Travel Mug', 'Kitchen'),
  ]);
  assert.equal(calls, 1);
  assert.equal(results[0].image, results[1].image);
});

test('ranks Pexels results by product title and skips images already assigned to another product', async () => {
  let calls = 0;
  const receiver = 'https://images.pexels.com/photos/12345/receiver.jpeg';
  const purse = 'https://images.pexels.com/photos/67890/purse.jpeg';
  const service = createProductImageService({
    env: { PEXELS_API_KEY: 'test-key' },
    logger: quietLogger,
    fetchImpl: async () => {
      calls += 1;
      return pexelsResponse(200, { photos: [
        { id: 12345, alt: 'Bluetooth audio receiver on desk', src: { large: receiver }, photographer: 'Audio Artist' },
        { id: 67890, alt: 'Soft leather coin purse on display', src: { large: purse }, photographer: 'Leather Artist' },
      ] });
    },
  });

  const first = await service.lookup('Bluetooth Audio Receiver', 'Audio & Tech', { cacheKeySuffix: 'SKU-1' });
  const second = await service.lookup('Soft Leather Coin Purse', 'Accessories', {
    cacheKeySuffix: 'SKU-2', excludeImageUrls: [first.image],
  });
  assert.equal(first.image, receiver);
  assert.equal(second.image, purse);
  assert.equal(calls, 2);
});

test('uses category fallbacks when credentials are missing and handles missing title/category', async () => {
  let calls = 0;
  const service = createProductImageService({
    env: {},
    logger: quietLogger,
    fetchImpl: async () => { calls += 1; return pexelsResponse(); },
  });
  const knownCategory = await service.lookup('Wireless Headphones', 'Audio & Tech');
  const missingCategory = await service.lookup('Uncategorized Thing', '');
  const missingTitle = await service.lookup('', 'Beauty');

  assert.equal(knownCategory.imageSource, 'title-fallback');
  assert.match(knownCategory.image, /loremflickr\.com.*lock=/);
  assert.match(missingCategory.image, /loremflickr\.com/);
  assert.equal(missingTitle.image, categoryFallbackImage('Beauty'));
  assert.equal(missingTitle.imageSource, 'category-fallback');
  assert.notEqual(knownCategory.image, missingCategory.image);
  assert.equal(calls, 0);
});

test('creates distinct title-and-category-tagged fallbacks for unrelated fashion products', async () => {
  const service = createProductImageService({ env: {}, logger: quietLogger });
  const products = [
    ['Soft Leather Coin Purse', 'Accessories', 'SKU-PURSE'],
    ['Woven Bucket Hat', 'Fashion', 'SKU-HAT'],
    ['Lightweight Weekend Bag', 'Accessories', 'SKU-BAG'],
    ['Minimal Barrette Set', 'Accessories', 'SKU-BARRETTE'],
  ];
  const results = await Promise.all(products.map(([title, category, sku]) => service.lookup(title, category, { cacheKeySuffix: sku })));
  assert.equal(new Set(results.map(({ image }) => image)).size, products.length);
  for (const result of results) assert.equal(result.imageSource, 'title-fallback');
});

test('provides category-specific external fallbacks for the requested catalogue groups', () => {
  const categories = ['Audio & Tech', 'Electronics', 'Fashion', 'Home & Living', 'Kitchen', 'Beauty', 'Sports', 'Accessories'];
  const urls = categories.map((category) => categoryFallbackImage(category));
  assert.equal(urls.every(isValidExternalImageUrl), true);
  assert.equal(new Set(urls).size, categories.length);
});

test('falls back for provider errors, empty results, and invalid image URLs', async (t) => {
  await t.test('HTTP 500', async () => {
    const service = createProductImageService({ env: { PEXELS_API_KEY: 'test-key' }, logger: quietLogger, fetchImpl: async () => pexelsResponse(500) });
    assert.equal((await service.lookup('Desk Lamp', 'Home & Living')).imageSource, 'title-fallback');
  });
  await t.test('network error', async () => {
    const service = createProductImageService({ env: { PEXELS_API_KEY: 'test-key' }, logger: quietLogger, fetchImpl: async () => { throw new Error('offline'); } });
    assert.equal((await service.lookup('Desk Lamp', 'Home & Living')).imageSource, 'title-fallback');
  });
  await t.test('empty results', async () => {
    const service = createProductImageService({ env: { PEXELS_API_KEY: 'test-key' }, logger: quietLogger, fetchImpl: async () => pexelsResponse(200, { photos: [] }) });
    assert.equal((await service.lookup('Desk Lamp', 'Home & Living')).imageSource, 'title-fallback');
  });
  await t.test('invalid provider image URL', async () => {
    const service = createProductImageService({ env: { PEXELS_API_KEY: 'test-key' }, logger: quietLogger, fetchImpl: async () => pexelsResponse(200, { photos: [{ src: { large: 'http://images.pexels.com/photo.jpg' } }] }) });
    assert.equal((await service.lookup('Desk Lamp', 'Home & Living')).imageSource, 'title-fallback');
  });
});

test('times out provider requests and avoids repeating searches while rate limited', async (t) => {
  await t.test('timeout', async () => {
    const service = createProductImageService({
      env: { PEXELS_API_KEY: 'test-key', PEXELS_IMAGE_TIMEOUT_MS: '15' },
      logger: quietLogger,
      fetchImpl: (_url, { signal }) => new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true })),
    });
    assert.equal((await service.lookup('Slow Lamp', 'Home & Living')).imageSource, 'title-fallback');
  });

  await t.test('429 cooldown', async () => {
    let calls = 0;
    let now = 1_000;
    const service = createProductImageService({
      env: { PEXELS_API_KEY: 'test-key', PEXELS_IMAGE_FAILURE_CACHE_TTL_MS: '1000' },
      now: () => now,
      logger: quietLogger,
      fetchImpl: async () => { calls += 1; return pexelsResponse(429, {}, { 'retry-after': '30' }); },
    });
    const first = await service.lookup('Receiver One', 'Audio & Tech');
    const second = await service.lookup('Receiver Two', 'Audio & Tech');
    assert.equal(first.imageSource, 'title-fallback');
    assert.equal(second.imageSource, 'title-fallback');
    assert.equal(calls, 1);
    now += 31_000;
  });
});

test('accepts external HTTPS image URLs only', () => {
  assert.equal(isValidExternalImageUrl(photoUrl), true);
  assert.equal(isValidExternalImageUrl('http://images.example.com/photo.jpg'), false);
  assert.equal(isValidExternalImageUrl('/images/products/item.svg'), false);
  assert.equal(isValidExternalImageUrl('data:image/png;base64,abc'), false);
  assert.equal(isValidExternalImageUrl('https://user:pass@images.example.com/photo.jpg'), false);
});
