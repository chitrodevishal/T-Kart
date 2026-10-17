import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DUMMYJSON_PRODUCTS_URL,
  fetchDummyJsonProducts,
  mapDummyJsonCategory,
  mapDummyJsonProduct,
  normalizeDummyJsonImageKey,
} from '../services/dummyJsonImporter.js';

test('fetches one complete DummyJSON product catalogue response', async () => {
  let requestedUrl;
  const products = [{ id: 1, title: 'Test Product' }];
  const result = await fetchDummyJsonProducts({
    fetchImpl: async (url, options) => {
      requestedUrl = new URL(url);
      assert.equal(options.headers.Accept, 'application/json');
      return { ok: true, status: 200, json: async () => ({ products }) };
    },
  });

  assert.equal(requestedUrl.origin + requestedUrl.pathname, DUMMYJSON_PRODUCTS_URL);
  assert.equal(requestedUrl.searchParams.get('limit'), '0');
  assert.match(requestedUrl.searchParams.get('select'), /images/);
  assert.deepEqual(result, products);
});

test('rejects provider errors and malformed product payloads', async (t) => {
  await t.test('HTTP failure', async () => {
    await assert.rejects(fetchDummyJsonProducts({ fetchImpl: async () => ({ ok: false, status: 503 }) }), /HTTP 503/);
  });
  await t.test('missing products array', async () => {
    await assert.rejects(fetchDummyJsonProducts({ fetchImpl: async () => ({ ok: true, json: async () => ({}) }) }), /products array/);
  });
});

test('maps DummyJSON categories into the existing T-Kart category taxonomy', () => {
  assert.equal(mapDummyJsonCategory('womens-bags'), 'Accessories');
  assert.equal(mapDummyJsonCategory('skin-care'), 'Beauty');
  assert.equal(mapDummyJsonCategory('kitchen-accessories'), 'Kitchen & Dining');
  assert.equal(mapDummyJsonCategory('unknown-category'), 'Unknown Category');
});

test('maps DummyJSON fields to the existing Mongoose product fields', () => {
  const mapped = mapDummyJsonProduct({
    id: 42,
    title: 'Canvas Travel Bag',
    description: 'A useful travel bag.',
    price: 5.01,
    discountPercentage: 12.5,
    rating: 4.6,
    stock: 17,
    category: 'womens-bags',
  }, 'category-object-id', {
    image: 'https://cdn.dummyjson.com/products/bag.webp',
    images: ['https://cdn.dummyjson.com/products/bag.webp'],
    imageSource: 'dummyjson',
  });

  assert.equal(mapped.name, 'Canvas Travel Bag');
  assert.equal(mapped.sku, 'DJ-42');
  assert.equal(mapped.category, 'category-object-id');
  assert.equal(mapped.price, 501);
  assert.equal(mapped.discount, 10);
  assert.equal(mapped.ratingsAverage, 4.6);
  assert.equal(mapped.stock, 17);
  assert.equal(mapped.image, 'https://cdn.dummyjson.com/products/bag.webp');
  assert.equal(mapped.imageSource, 'dummyjson');
});

test('compares image URLs without treating query-string variants as separate photos', () => {
  assert.equal(
    normalizeDummyJsonImageKey('https://cdn.dummyjson.com/product.webp?width=640'),
    normalizeDummyJsonImageKey('https://cdn.dummyjson.com/product.webp?width=1200')
  );
});
