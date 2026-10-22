import 'dotenv/config';
import { configureDnsServers } from '../config/dns.js';
import mongoose from 'mongoose';
import '../models/Category.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import productImageService from '../services/productImageService.js';
import { isValidExternalImageUrl } from '../utils/imageUrl.js';

const isLegacyAutoImage = (url, imageSource = '') => {
  if (imageSource === 'title-fallback') return false;
  try { return new URL(url).hostname.toLowerCase() === 'loremflickr.com'; }
  catch { return false; }
};

const imageIdentity = (value) => {
  try {
    const url = new URL(value);
    const photoId = url.pathname.match(/\/photos\/(\d+)/)?.[1];
    return photoId ? `pexels:${photoId}` : `${url.hostname}${url.pathname}`.toLowerCase();
  } catch { return String(value || '').toLowerCase(); }
};

async function migrateProductImages() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is required');
  configureDnsServers();
  await mongoose.connect(process.env.MONGO_URI);

  let updated = 0;
  let preserved = 0;
  let failed = 0;
  let ordersUpdated = 0;
  const usedImageIdentities = new Set();
  const cursor = Product.find().sort({ sku: 1 }).populate('category', 'name').cursor();

  for await (const product of cursor) {
    const existingUrls = [...new Set([product.image, ...(product.images || [])].filter(isValidExternalImageUrl))];
    const currentImage = isValidExternalImageUrl(product.image) ? product.image : existingUrls[0];
    const autoAssigned = ['pexels', 'category-fallback', 'title-fallback', 'legacy'].includes(product.imageSource) ||
      isLegacyAutoImage(currentImage, product.imageSource);
    const duplicateAutoImage = autoAssigned && currentImage && usedImageIdentities.has(imageIdentity(currentImage));
    const shouldSearch = !currentImage || isLegacyAutoImage(currentImage, product.imageSource) ||
      duplicateAutoImage || ['category-fallback', 'legacy'].includes(product.imageSource);

    try {
      if (shouldSearch) {
        const imageData = await productImageService.lookup(product.name, product.category?.name || '', {
          excludeImageUrls: [...usedImageIdentities],
          cacheKeySuffix: product.sku,
        });
        product.image = imageData.image;
        product.images = imageData.images;
        product.imageSource = imageData.imageSource;
        product.imageCredit = imageData.imageCredit || '';
        product.imageCreditUrl = imageData.imageCreditUrl || '';
        product.imageSourceUrl = imageData.imageSourceUrl || '';
        await product.save();
        usedImageIdentities.add(imageIdentity(imageData.image));
        updated += 1;
        console.log(`UPDATED ${product.sku}: ${imageData.imageSource}`);
      } else {
        // Preserve valid manually assigned URLs and remove invalid legacy local/binary paths.
        product.image = currentImage;
        product.images = existingUrls;
        if (!product.imageSource || product.$isDefault('imageSource')) product.imageSource = 'manual';
        await product.save();
        if (currentImage) usedImageIdentities.add(imageIdentity(currentImage));
        preserved += 1;
        console.log(`PRESERVED ${product.sku}: valid external image`);
      }
    } catch (error) {
      failed += 1;
      console.error(`FAILED ${product.sku}: ${error.message}`);
    }
  }

  const currentProducts = await Product.find().populate('category', 'name').select(
    'name sku image images imageSource imageCredit imageCreditUrl imageSourceUrl category'
  ).lean();
  const productsById = new Map(currentProducts.map((product) => [String(product._id), product]));
  const ordersCursor = Order.find().cursor();
  for await (const order of ordersCursor) {
    let changed = false;
    for (const item of order.orderItems) {
      const product = productsById.get(String(item.product));
      if (!product) continue;
      const nextImage = product.image || product.images?.[0] || '';
      const nextFields = {
        image: nextImage,
        imageSource: product.imageSource || '',
        imageCredit: product.imageCredit || '',
        imageCreditUrl: product.imageCreditUrl || '',
        imageSourceUrl: product.imageSourceUrl || '',
        categoryName: product.category?.name || '',
      };
      for (const [field, value] of Object.entries(nextFields)) {
        if (item[field] !== value) {
          item[field] = value;
          changed = true;
        }
      }
    }
    if (changed) {
      await order.save();
      ordersUpdated += 1;
      console.log(`UPDATED ORDER ${order.orderNumber}: product image snapshots refreshed`);
    }
  }

  console.log(`Product image migration complete: ${updated} products updated, ${preserved} preserved, ${failed} failed; ${ordersUpdated} order snapshots refreshed.`);
  if (failed) process.exitCode = 1;
}

migrateProductImages()
  .catch((error) => {
    console.error(`Product image migration aborted: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
