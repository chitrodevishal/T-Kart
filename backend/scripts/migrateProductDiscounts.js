import 'dotenv/config';
import { configureDnsServers } from '../config/dns.js';
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const normalizeDiscount = (value) => {
  const discount = Number(value);
  if (!Number.isFinite(discount)) return 0;
  return Math.max(0, Math.min(90, Math.round(discount / 10) * 10));
};

async function migrateProductDiscounts() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');
  configureDnsServers();
  await mongoose.connect(process.env.MONGODB_URI);

  let updated = 0;
  let unchanged = 0;
  try {
    const cursor = Product.find().select('_id sku discount').cursor();
    for await (const product of cursor) {
      const normalized = normalizeDiscount(product.discount);
      if (product.discount === normalized) {
        unchanged += 1;
        continue;
      }
      product.discount = normalized;
      await product.save();
      console.log(`UPDATED ${product.sku}: ${normalized}%`);
      updated += 1;
    }
    console.log(`Discount migration complete. Updated ${updated}; unchanged ${unchanged}.`);
  } finally {
    await mongoose.disconnect();
  }
}

migrateProductDiscounts().catch((error) => {
  console.error('Discount migration failed:', error.message);
  process.exitCode = 1;
});
