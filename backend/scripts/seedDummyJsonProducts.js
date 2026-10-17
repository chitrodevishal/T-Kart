import 'dotenv/config';
import mongoose from 'mongoose';
import { configureDnsServers } from '../config/dns.js';
import {
  fetchDummyJsonProducts,
  importDummyJsonProducts,
  mapDummyJsonCategory,
  normalizeDummyJsonImageKey,
} from '../services/dummyJsonImporter.js';
import { isValidExternalImageUrl } from '../utils/imageUrl.js';

const dryRun = process.argv.includes('--dry-run');

async function seedDummyJsonProducts() {
  configureDnsServers();
  const products = await fetchDummyJsonProducts();

  if (dryRun) {
    const categories = new Set(products.map((product) => mapDummyJsonCategory(product.category)));
    const sourceImageOwners = new Map();
    for (const product of products) {
      const image = [...(product.images || []), product.thumbnail]
        .find((url) => isValidExternalImageUrl(url));
      if (image) sourceImageOwners.set(normalizeDummyJsonImageKey(image), (sourceImageOwners.get(normalizeDummyJsonImageKey(image)) || 0) + 1);
    }
    const reusedSourceImages = [...sourceImageOwners.values()].filter((count) => count > 1).length;
    console.log(`DummyJSON dry run: ${products.length} products, ${categories.size} mapped categories, ${reusedSourceImages} repeated primary image URLs.`);
    console.log('No MongoDB records were changed. Rerun without --dry-run to import.');
    return;
  }

  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await importDummyJsonProducts(products);
  console.log(
    `DummyJSON import complete: ${result.imported} imported, ${result.skipped} already present, ` +
    `${result.failed} failed, ${result.categoriesCreated} categories created, ` +
    `${result.pricesConverted} existing prices converted (${result.received} received).`
  );
  if (result.failed) process.exitCode = 1;
}

seedDummyJsonProducts()
  .catch((error) => {
    console.error(`DummyJSON import failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
