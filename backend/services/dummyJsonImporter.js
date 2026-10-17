import Category from '../models/Category.js';
import Product from '../models/Product.js';
import productImageService from './productImageService.js';
import { isValidExternalImageUrl } from '../utils/imageUrl.js';

export const DUMMYJSON_PRODUCTS_URL = 'https://dummyjson.com/products';
const SOURCE_PREFIX = 'DJ-';
const FETCH_TIMEOUT_MS = 20_000;

const CATEGORY_GROUPS = [
  { name: 'Beauty', slugs: ['beauty', 'fragrances', 'skin-care'] },
  { name: 'Home & Living', slugs: ['furniture', 'home-decoration'] },
  { name: 'Kitchen & Dining', slugs: ['groceries', 'kitchen-accessories'] },
  { name: 'Audio & Tech', slugs: ['laptops', 'mobile-accessories', 'smartphones', 'tablets'] },
  { name: 'Fashion', slugs: ['mens-shirts', 'mens-shoes', 'tops', 'womens-dresses', 'womens-shoes'] },
  { name: 'Accessories', slugs: ['mens-watches', 'sunglasses', 'womens-bags', 'womens-jewellery'] },
  { name: 'Sports', slugs: ['sports-accessories'] },
  { name: 'Automotive', slugs: ['motorcycle', 'vehicle'] },
];

const slugify = (value) => String(value || 'uncategorized')
  .toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

export function mapDummyJsonCategory(sourceCategory) {
  const slug = slugify(sourceCategory);
  return CATEGORY_GROUPS.find((group) => group.slugs.includes(slug))?.name ||
    slug.split('-').filter(Boolean).map((word) => word[0].toUpperCase() + word.slice(1)).join(' ') || 'Uncategorized';
}

export function normalizeDummyJsonImageKey(value) {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname}`.toLowerCase();
  } catch {
    return String(value || '').trim().toLowerCase();
  }
}

export async function fetchDummyJsonProducts({ fetchImpl = globalThis.fetch, timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const url = new URL(DUMMYJSON_PRODUCTS_URL);
    url.searchParams.set('limit', '0');
    url.searchParams.set('select', 'id,title,description,price,category,rating,stock,discountPercentage,sku,images,thumbnail');
    const response = await fetchImpl(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`DummyJSON returned HTTP ${response.status}`);
    const payload = await response.json();
    if (!Array.isArray(payload?.products)) throw new Error('DummyJSON response did not include a products array');
    return payload.products;
  } finally {
    clearTimeout(timeout);
  }
}

function productImageCandidates(source) {
  const candidates = [...(Array.isArray(source.images) ? source.images : []), source.thumbnail]
    .filter(isValidExternalImageUrl);
  return [...new Map(candidates.map((url) => [normalizeDummyJsonImageKey(url), url])).values()];
}

export function mapDummyJsonProduct(source, categoryId, imageData) {
  const id = Number(source.id);
  if (!Number.isInteger(id) || id < 1) throw new Error('DummyJSON product has an invalid id');
  const name = String(source.title || '').trim();
  if (name.length < 2) throw new Error(`DummyJSON product ${id} has no usable title`);
  const description = String(source.description || name).trim().slice(0, 2000);
  const price = Number(source.price);
  if (!Number.isFinite(price) || price < 0) throw new Error(`DummyJSON product ${id} has an invalid price`);
  const rating = Number(source.rating);
  const discount = Number(source.discountPercentage);
  const stock = Number(source.stock);
  return {
    name,
    description,
    sku: `${SOURCE_PREFIX}${id}`,
    price: Math.round(price * 100),
    discount: Number.isFinite(discount) ? Math.max(0, Math.min(90, Math.round(discount / 10) * 10)) : 0,
    category: categoryId,
    stock: Number.isFinite(stock) ? Math.max(0, stock) : 0,
    image: imageData.image,
    images: imageData.images,
    imageSource: imageData.imageSource,
    imageCredit: imageData.imageCredit || '',
    imageCreditUrl: imageData.imageCreditUrl || '',
    imageSourceUrl: imageData.imageSourceUrl || '',
    isActive: true,
    ratingsAverage: Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0,
    ratingsCount: Array.isArray(source.reviews) ? source.reviews.length : 0,
  };
}

export async function importDummyJsonProducts(products, {
  CategoryModel = Category,
  ProductModel = Product,
  imageService = productImageService,
  logger = console,
} = {}) {
  if (!Array.isArray(products)) throw new TypeError('products must be an array');

  const existingProducts = await ProductModel.find().select('sku price image images').lean();
  const existingBySku = new Map(existingProducts.map((product) => [product.sku, product]));
  const existingSkus = new Set(existingBySku.keys());
  const usedImageKeys = new Set(existingProducts.flatMap((product) => [product.image, ...(product.images || [])])
    .filter(isValidExternalImageUrl).map(normalizeDummyJsonImageKey));
  const categories = new Map();
  let categoriesCreated = 0;
  let imported = 0;
  let skipped = 0;
  let pricesConverted = 0;
  let failed = 0;

  for (const source of products) {
    const productId = Number(source?.id);
    if (!Number.isInteger(productId) || productId < 1) {
      failed += 1;
      logger.error?.('[dummyjson-import] Skipped a record with an invalid product id.');
      continue;
    }
    const sku = `${SOURCE_PREFIX}${productId}`;
    if (existingSkus.has(sku)) {
      const existing = existingBySku.get(sku);
      const sourcePrice = Number(source.price);
      if (Number.isFinite(sourcePrice) && Number(existing.price) === sourcePrice) {
        await ProductModel.updateOne(
          { sku, price: sourcePrice },
          { $set: { price: Math.round(sourcePrice * 100) } },
          { runValidators: true }
        );
        existing.price = Math.round(sourcePrice * 100);
        pricesConverted += 1;
      }
      skipped += 1;
      continue;
    }

    try {
      const categoryName = mapDummyJsonCategory(source.category);
      let category = categories.get(categoryName);
      if (!category) {
        const slug = slugify(categoryName);
        category = await CategoryModel.findOne({ slug });
        if (!category) {
          category = await CategoryModel.create({ name: categoryName, slug });
          categoriesCreated += 1;
        }
        categories.set(categoryName, category);
      }

      const freeImages = productImageCandidates(source)
        .filter((url) => !usedImageKeys.has(normalizeDummyJsonImageKey(url)));
      let imageData;
      if (freeImages.length) {
        imageData = { image: freeImages[0], images: freeImages, imageSource: 'dummyjson' };
      } else {
        imageData = await imageService.lookup(source.title, categoryName, {
          excludeImageUrls: [...usedImageKeys],
          cacheKeySuffix: sku,
        });
      }

      const product = mapDummyJsonProduct(source, category._id, imageData);
      const result = await ProductModel.updateOne(
        { sku },
        { $setOnInsert: product },
        { upsert: true, runValidators: true }
      );
      if (result.upsertedCount) {
        imported += 1;
        existingSkus.add(sku);
        existingBySku.set(sku, { sku, price: product.price, image: product.image, images: product.images });
        for (const image of product.images) usedImageKeys.add(normalizeDummyJsonImageKey(image));
      } else {
        skipped += 1;
      }
    } catch (error) {
      failed += 1;
      logger.error?.(`[dummyjson-import] ${sku} failed: ${error.message}`);
    }
  }

  return { received: products.length, imported, skipped, failed, categoriesCreated, pricesConverted };
}
