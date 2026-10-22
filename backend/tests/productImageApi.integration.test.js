import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import mongoose from 'mongoose';
import { configureDnsServers } from '../config/dns.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';

const enabled = process.env.RUN_PRODUCT_IMAGE_API_INTEGRATION === 'true' && Boolean(process.env.MONGO_URI);

test('product image API creates, preserves, updates, and migrates external images on an isolated database', { skip: !enabled, timeout: 120_000 }, async (t) => {
  const uri = new URL(process.env.MONGO_URI);
  const scratchDatabase = `tkart_image_test_${Date.now().toString(36)}`;
  uri.pathname = `/${scratchDatabase}`;
  process.env.MONGO_URI = uri.toString();
  process.env.PEXELS_API_KEY = '';
  process.env.NODE_ENV = 'test';
  configureDnsServers();

  let server;
  let baseUrl;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const [{ default: app }] = await Promise.all([import('../app.js')]);
    const admin = await User.create({ name: 'Image Test Admin', email: `image-test-${Date.now()}@example.test`, password: 'ImageTestPassword123!', role: 'admin' });
    const category = await Category.create({ name: 'Audio & Tech' });
    const token = generateToken(admin._id.toString(), 'admin');
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    baseUrl = `http://127.0.0.1:${server.address().port}/api`;

    const createProduct = async (body) => fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const autoResponse = await createProduct({
      name: 'Bluetooth Audio Receiver', description: 'Integration test product', sku: 'IMG-AUTO-001',
      price: 30, category: category._id, stock: 4,
    });
    assert.equal(autoResponse.status, 201, 'product creation should succeed if Pexels is not configured');
    const autoProduct = (await autoResponse.json()).data;
    assert.equal(autoProduct.imageSource, 'title-fallback');
    assert.match(autoProduct.image, /^https:\/\//);
    assert.deepEqual(autoProduct.images, [autoProduct.image]);

    const manualUrl = 'https://images.example.test/manual-product.jpg';
    const manualResponse = await createProduct({
      name: 'Manual Product Image', description: 'Manual image must be preserved', sku: 'IMG-MANUAL-001',
      price: 10, category: category._id, images: [manualUrl],
    });
    assert.equal(manualResponse.status, 201);
    const manualProduct = (await manualResponse.json()).data;
    assert.equal(manualProduct.image, manualUrl);
    assert.equal(manualProduct.imageSource, 'manual');
    const manualUpdateResponse = await fetch(`${baseUrl}/products/${manualProduct._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Manual Product Image Renamed' }),
    });
    assert.equal(manualUpdateResponse.status, 200);
    assert.equal((await manualUpdateResponse.json()).data.image, manualUrl, 'renaming must preserve a valid manual image');

    const invalidImageResponse = await createProduct({
      name: 'Invalid Image Product', description: 'Local paths are rejected', sku: 'IMG-INVALID-001',
      price: 10, category: category._id, images: ['/images/products/local.svg'],
    });
    assert.equal(invalidImageResponse.status, 400);
    const brokenImageResponse = await createProduct({
      name: 'Broken Image Product', description: 'Invalid URLs are rejected', sku: 'IMG-BROKEN-001',
      price: 10, category: category._id, image: 'http://images.example.test/insecure.jpg',
    });
    assert.equal(brokenImageResponse.status, 400);

    const missingTitleResponse = await createProduct({ description: 'No title', sku: 'IMG-NOTITLE-001', price: 10, category: category._id });
    assert.equal(missingTitleResponse.status, 400);
    const missingCategoryResponse = await createProduct({ name: 'Missing Category', description: 'No category', sku: 'IMG-NOCAT-001', price: 10 });
    assert.equal(missingCategoryResponse.status, 400);

    const updateResponse = await fetch(`${baseUrl}/products/${autoProduct._id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bluetooth Audio Receiver Updated' }),
    });
    assert.equal(updateResponse.status, 200);
    assert.equal((await updateResponse.json()).data.imageSource, 'title-fallback');

    const duplicateImage = 'https://images.pexels.com/photos/7654321/shared-fixture.jpeg';
    const duplicateOne = await Product.create({
      name: 'Woven Bucket Hat', description: 'Duplicate migration fixture', sku: 'IMG-DUP-001', price: 18,
      category: category._id, image: duplicateImage, images: [duplicateImage], imageSource: 'pexels', stock: 2,
    });
    const duplicateTwo = await Product.create({
      name: 'Minimal Barrette Set', description: 'Duplicate migration fixture', sku: 'IMG-DUP-002', price: 12,
      category: category._id, image: duplicateImage, images: [duplicateImage], imageSource: 'pexels', stock: 2,
    });
    const historicalOrder = await Order.create({
      orderNumber: `TK-IMAGE-${Date.now()}`,
      user: admin._id,
      orderItems: [{
        product: duplicateTwo._id, name: duplicateTwo.name, sku: duplicateTwo.sku,
        price: 12, discount: 0, finalPrice: 12, quantity: 1, image: duplicateImage,
        imageSource: 'pexels', categoryName: 'Audio & Tech',
      }],
      shippingAddress: {
        fullName: 'Test Customer', phone: '1234567890', address: '1 Test Street',
        city: 'Test City', state: 'Test State', postalCode: '00000',
      },
      itemsTotal: 12,
      totalAmount: 12,
    });

    const legacy = await Product.create({
      name: 'Legacy image product', description: 'Migration fixture', sku: 'IMG-LEGACY-001', price: 5,
      category: category._id, image: 'https://loremflickr.com/640/640/old?lock=1',
      images: ['https://loremflickr.com/640/640/old?lock=1'], imageSource: 'legacy', stock: 1,
    });
    await Product.collection.updateOne({ _id: legacy._id }, {
      $set: { image: '/images/products/legacy.svg', images: ['/images/products/legacy.svg'] },
      $unset: { imageSource: 1 },
    });

    const migration = spawn(process.execPath, ['--use-system-ca', 'scripts/migrateProductImages.js'], {
      cwd: new URL('..', import.meta.url),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let migrationOutput = '';
    migration.stdout.on('data', (chunk) => { migrationOutput += chunk; });
    migration.stderr.on('data', (chunk) => { migrationOutput += chunk; });
    const [exitCode] = await once(migration, 'close');
    assert.equal(exitCode, 0, migrationOutput);

    const migrated = await Product.findById(legacy._id).lean();
    assert.match(migrated.image, /^https:\/\//);
    assert.equal(migrated.imageSource, 'title-fallback');
    assert.deepEqual(migrated.images, [migrated.image]);
    const stillManual = await Product.findById(manualProduct._id).lean();
    assert.equal(stillManual.image, manualUrl, 'migration must preserve valid manual image URLs');
    assert.match(migrationOutput, /PRESERVED IMG-MANUAL-001/);
    assert.match(migrationOutput, /UPDATED IMG-LEGACY-001/);
    assert.match(migrationOutput, /UPDATED IMG-DUP-002/);
    const firstDuplicate = await Product.findById(duplicateOne._id).lean();
    const secondDuplicate = await Product.findById(duplicateTwo._id).lean();
    assert.equal(firstDuplicate.image, duplicateImage, 'keep the first valid automated image assignment');
    assert.notEqual(secondDuplicate.image, firstDuplicate.image, 'reassign duplicate automated images per product');
    const refreshedOrder = await Order.findById(historicalOrder._id).lean();
    assert.equal(refreshedOrder.orderItems[0].image, secondDuplicate.image, 'refresh historical order image snapshot');
    assert.equal(refreshedOrder.orderItems[0].finalPrice, 12, 'preserve the historical order price');

    await t.test('isolated REST calls pass using fallback image assignment', () => {
      assert.equal(autoProduct.name, 'Bluetooth Audio Receiver');
      assert.equal(autoProduct.category.name, 'Audio & Tech');
    });
  } finally {
    if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  }
});
