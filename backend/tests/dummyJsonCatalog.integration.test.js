import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

const enabled = process.env.RUN_DUMMYJSON_CATALOG_INTEGRATION === 'true' && Boolean(process.env.MONGO_URI);
const products = [
  {
    id: 1,
    title: 'Test Mascara',
    description: 'A sample beauty product for catalog integration checks.',
    category: 'beauty',
    price: 10,
    discountPercentage: 14,
    rating: 4.6,
    stock: 12,
    sku: 'SOURCE-1',
    thumbnail: 'https://cdn.dummyjson.com/product-images/1/thumbnail.jpg',
    images: ['https://cdn.dummyjson.com/product-images/1/1.jpg'],
    reviews: [{ rating: 5 }, { rating: 4 }],
  },
  {
    id: 2,
    title: 'Test Sofa',
    description: 'A sample furniture product for catalog integration checks.',
    category: 'furniture',
    price: 100,
    rating: 4.2,
    stock: 3,
    thumbnail: 'http://invalid.example.test/sofa.jpg',
    images: [],
    reviews: [],
  },
];

test('DummyJSON catalog maps all products and keeps cart and order product IDs usable', { skip: !enabled, timeout: 120_000 }, async () => {
  const uri = new URL(process.env.MONGO_URI);
  uri.pathname = `/tkart_dummyjson_test_${Date.now().toString(36)}`;
  process.env.MONGO_URI = uri.toString();
  process.env.NODE_ENV = 'test';

  let apiServer;
  let appServer;
  let databaseName;
  try {
    apiServer = http.createServer((req, res) => {
      const url = new URL(req.url || '/', 'http://localhost');
      res.setHeader('Content-Type', 'application/json');
      if (req.method !== 'GET') {
        res.writeHead(405).end('{}');
      } else if (url.pathname === '/products/category-list') {
        res.writeHead(200).end(JSON.stringify(['beauty', 'furniture']));
      } else if (url.pathname === '/products' && url.searchParams.get('limit') === '0') {
        // Deliberate duplicate verifies the catalog only writes unique product IDs.
        res.writeHead(200).end(JSON.stringify({ products: [...products, products[0]], total: 3, skip: 0, limit: 0 }));
      } else if (url.pathname === '/products/category/beauty') {
        res.writeHead(200).end(JSON.stringify({ products: [products[0]], total: 1, skip: 0, limit: 1 }));
      } else if (url.pathname === '/products/1') {
        res.writeHead(200).end(JSON.stringify(products[0]));
      } else {
        res.writeHead(404).end(JSON.stringify({ message: 'Not found' }));
      }
    });
    apiServer.listen(0, '127.0.0.1');
    await once(apiServer, 'listening');
    process.env.DUMMYJSON_API_BASE_URL = `http://127.0.0.1:${apiServer.address().port}`;

    await mongoose.connect(process.env.MONGO_URI, { autoIndex: true });
    databaseName = mongoose.connection.name;
    const [{ default: app }] = await Promise.all([import('../app.js')]);
    await mongoose.model('Product').init();
    const user = await User.create({
      name: 'DummyJSON Integration Customer',
      email: `dummyjson-${Date.now()}@example.test`,
      password: 'DummyJsonIntegrationPassword123!',
    });
    const token = generateToken(user._id.toString(), 'customer');
    appServer = app.listen(0, '127.0.0.1');
    await once(appServer, 'listening');
    const baseUrl = `http://127.0.0.1:${appServer.address().port}/api`;
    const request = (path, options = {}) => fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });

    const listResponse = await request('/products?limit=100&sortBy=price&sortOrder=asc');
    assert.equal(listResponse.status, 200);
    const list = (await listResponse.json()).data;
    assert.equal(list.length, 2);
    assert.deepEqual(list.map(({ externalId }) => externalId), [1, 2]);
    const mascara = list.find((product) => product.externalId === 1);
    const sofa = list.find((product) => product.externalId === 2);
    assert.ok(mascara?._id, 'products need local Mongo IDs for cart references');
    assert.equal(mascara.name, 'Test Mascara');
    assert.equal(mascara.price, 100, 'the source price of 10 is multiplied once when mapped');
    assert.equal(mascara.category.name, 'Beauty');
    assert.equal(mascara.ratingsAverage, 4.6);
    assert.equal(mascara.ratingsCount, 2);
    assert.equal(mascara.stock, 12);
    assert.equal(mascara.discount, 10);
    assert.equal(sofa.imageSource, 'dummyjson-fallback');
    assert.equal(sofa.price, 1000);

    const categoriesResponse = await request('/categories');
    assert.equal(categoriesResponse.status, 200);
    assert.deepEqual((await categoriesResponse.json()).data.map(({ slug }) => slug).sort(), ['beauty', 'furniture']);

    const filteredResponse = await request('/products?category=beauty');
    assert.equal(filteredResponse.status, 200);
    assert.deepEqual((await filteredResponse.json()).data.map(({ externalId }) => externalId), [1]);

    const searchedResponse = await request('/products?search=Mascara');
    assert.equal(searchedResponse.status, 200);
    assert.deepEqual((await searchedResponse.json()).data.map(({ externalId }) => externalId), [1]);

    const detailResponse = await request(`/products/${mascara._id}`);
    assert.equal(detailResponse.status, 200);
    const detail = (await detailResponse.json()).data;
    assert.equal(detail.externalId, 1);
    assert.equal(detail.price, 100, 'refreshing a product must map the original source price, not multiply stored price again');

    const authHeaders = { Authorization: `Bearer ${token}` };
    const addToCartResponse = await request('/cart/items', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ productId: mascara._id, quantity: 1 }),
    });
    assert.equal(addToCartResponse.status, 201);
    const cartResponse = await request('/cart', { headers: authHeaders });
    assert.equal(cartResponse.status, 200);
    const cart = (await cartResponse.json()).data;
    assert.equal(cart.items[0].product.name, 'Test Mascara');
    assert.equal(cart.subtotal, 100);

    const orderResponse = await request('/orders', {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ shippingAddress: {
        fullName: 'DummyJSON Integration Customer',
        phone: '1234567890',
        address: '1 Test Street',
        city: 'Test City',
        state: 'Test State',
        postalCode: '00000',
      } }),
    });
    assert.equal(orderResponse.status, 201);
    const order = (await orderResponse.json()).data;
    assert.equal(order.orderItems[0].name, 'Test Mascara');
    assert.equal(order.orderItems[0].finalPrice, 90);
    assert.equal(order.totalAmount, 90);
  } finally {
    if (appServer) await new Promise((resolve) => appServer.close(resolve));
    if (apiServer) await new Promise((resolve) => apiServer.close(resolve));
    if (databaseName && mongoose.connection.readyState === 1) await mongoose.connection.dropDatabase();
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  }
});
