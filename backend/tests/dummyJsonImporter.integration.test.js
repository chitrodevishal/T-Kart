import 'dotenv/config';
import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { configureDnsServers } from '../config/dns.js';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { importDummyJsonProducts } from '../services/dummyJsonImporter.js';

const enabled = process.env.RUN_DUMMYJSON_IMPORT_INTEGRATION === 'true' && Boolean(process.env.MONGODB_URI);

test('imports DummyJSON products into MongoDB with unique images and no duplicates on rerun', {
  skip: !enabled,
  timeout: 120_000,
}, async () => {
  const uri = new URL(process.env.MONGODB_URI);
  uri.pathname = `/tkart_dummyjson_test_${Date.now().toString(36)}`;
  process.env.MONGODB_URI = uri.toString();
  configureDnsServers();
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const sharedImage = 'https://cdn.dummyjson.com/integration/shared.webp';
    const alternateImage = 'https://cdn.dummyjson.com/integration/hat.webp';
    const category = await Category.create({ name: 'Accessories' });
    await Product.create({
      name: 'Leather Travel Bag', description: 'A test bag.', sku: 'DJ-901001', price: 22.5,
      category: category._id, stock: 9, image: sharedImage, images: [sharedImage], imageSource: 'dummyjson',
      ratingsAverage: 4.4,
    });
    const fixture = [
      {
        id: 901001, title: 'Leather Travel Bag', description: 'A test bag.', price: 22.5,
        rating: 4.4, stock: 9, discountPercentage: 5, category: 'womens-bags',
        images: [sharedImage], thumbnail: sharedImage,
      },
      {
        id: 901002, title: 'Woven Bucket Hat', description: 'A test hat.', price: 15,
        rating: 4.1, stock: 4, discountPercentage: 0, category: 'womens-bags',
        images: [sharedImage, alternateImage], thumbnail: sharedImage,
      },
    ];

    const firstRun = await importDummyJsonProducts(fixture);
    assert.deepEqual(firstRun, { received: 2, imported: 1, skipped: 1, failed: 0, categoriesCreated: 0, pricesConverted: 1 });
    const imported = await Product.find({ sku: /^DJ-90100/ }).populate('category', 'name').sort({ sku: 1 }).lean();
    assert.equal(imported.length, 2);
    assert.equal(imported[0].category.name, 'Accessories');
    assert.equal(imported[0].price, 2250, 'convert an existing source price only once');
    assert.equal(imported[1].image, alternateImage, 'choose the product-specific image when the first is already assigned');
    assert.equal(imported[1].price, 1500, 'convert newly imported source prices to the storefront unit');
    assert.equal(imported[1].ratingsAverage, 4.1);
    assert.notEqual(imported[0].image, imported[1].image);

    const secondRun = await importDummyJsonProducts(fixture);
    assert.deepEqual(secondRun, { received: 2, imported: 0, skipped: 2, failed: 0, categoriesCreated: 0, pricesConverted: 0 });
    assert.equal(await Product.countDocuments({ sku: /^DJ-90100/ }), 2);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
      await mongoose.disconnect();
    }
  }
});
