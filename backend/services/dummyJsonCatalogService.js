import Category from '../models/Category.js';
import Product from '../models/Product.js';
import AppError from '../utils/appError.js';
import { isValidExternalImageUrl } from '../utils/imageUrl.js';

const API_BASE_URL = process.env.DUMMYJSON_API_BASE_URL || 'https://dummyjson.com';
const CACHE_TTL_MS = 60_000;
const PRODUCT_PRICE_MULTIPLIER = 10;
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=900&q=85';

let lastSyncAt = 0;
let syncInFlight;

const slugify = (value) => String(value || 'uncategorized')
  .toLowerCase()
  .trim()
  .replace(/[^\w\s-]/g, '')
  .replace(/[\s_-]+/g, '-')
  .replace(/^-+|-+$/g, '');

const categoryLabel = (slug) => slugify(slug)
  .split('-')
  .filter(Boolean)
  .map((word) => word[0].toUpperCase() + word.slice(1))
  .join(' ') || 'Uncategorized';

const requestJson = async (path) => {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { signal: AbortSignal.timeout(20_000) });
  } catch {
    throw new AppError('DummyJSON product service is currently unavailable', 502);
  }
  if (!response.ok) throw new AppError(`DummyJSON product service returned ${response.status}`, 502);
  try {
    return await response.json();
  } catch {
    throw new AppError('DummyJSON product service returned an invalid response', 502);
  }
};

const imageCandidates = (source) => [...new Set([
  ...(Array.isArray(source?.images) ? source.images : []),
  source?.thumbnail,
].filter(isValidExternalImageUrl).map((url) => url.trim()))];

const upsertCategories = async (categorySlugs, sourceProducts = []) => {
  const imageByCategory = new Map();
  for (const source of sourceProducts) {
    const slug = slugify(source?.category);
    const image = imageCandidates(source)[0];
    if (image && !imageByCategory.has(slug)) imageByCategory.set(slug, image);
  }

  const categoryBySlug = new Map();
  for (const rawSlug of categorySlugs) {
    if (typeof rawSlug !== 'string' || !rawSlug.trim()) continue;
    const slug = slugify(rawSlug);
    if (categoryBySlug.has(slug)) continue;
    let category = await Category.findOne({ catalogSource: 'dummyjson', externalId: slug });
    if (!category) category = await Category.findOne({ slug });
    if (!category) category = new Category({ name: categoryLabel(slug), slug });
    category.externalId = slug;
    category.catalogSource = 'dummyjson';
    category.name = categoryLabel(slug).slice(0, 50);
    category.slug = slug;
    category.description = '';
    category.image = imageByCategory.get(slug) || FALLBACK_IMAGE;
    category.isActive = true;
    await category.save();
    categoryBySlug.set(slug, category._id);
  }
  return categoryBySlug;
};

const upsertProducts = async (sourceProducts) => {
  const uniqueProducts = [...new Map(sourceProducts
    .filter((item) => item && Number.isInteger(Number(item.id)) && Number(item.id) > 0)
    .map((item) => [Number(item.id), item])).values()];
  if (!uniqueProducts.length) return;

  const categorySlugs = [...new Set(uniqueProducts.map((item) => slugify(item.category)))];
  const categories = await Category.find({ catalogSource: 'dummyjson', externalId: { $in: categorySlugs } }).select('_id externalId');
  const categoryBySlug = new Map(categories.map((category) => [category.externalId, category._id]));
  const operations = uniqueProducts.flatMap((source) => {
    const externalId = Number(source.id);
    const category = categoryBySlug.get(slugify(source.category));
    if (!category) return [];

    const price = Number(source.price);
    const rating = Number(source.rating);
    const rawDiscount = Number(source.discountPercentage);
    const rawStock = Number(source.stock);
    const images = imageCandidates(source);
    const image = images[0] || FALLBACK_IMAGE;
    const discount = Number.isFinite(rawDiscount)
      ? Math.max(0, Math.min(90, Math.round(rawDiscount / 10) * 10))
      : 0;
    const name = String(source.title || `Product ${externalId}`).trim().slice(0, 120);
    const values = {
      name,
      description: String(source.description || name).trim().slice(0, 2000),
      sku: `DUMMYJSON-${externalId}`,
      catalogSource: 'dummyjson',
      price: Number.isFinite(price) && price >= 0
        ? Math.round(price * PRODUCT_PRICE_MULTIPLIER * 100) / 100
        : 0,
      discount,
      category,
      stock: Number.isFinite(rawStock) ? Math.max(0, rawStock) : 0,
      image,
      images: images.length ? images : [FALLBACK_IMAGE],
      imageSource: images.length ? 'dummyjson' : 'dummyjson-fallback',
      imageCredit: '',
      imageCreditUrl: '',
      imageSourceUrl: '',
      ratingsAverage: Number.isFinite(rating) ? Math.max(0, Math.min(5, rating)) : 0,
      ratingsCount: Array.isArray(source.reviews) ? source.reviews.length : 0,
      isActive: true,
    };
    return [{ updateOne: { filter: { externalId }, update: { $set: values, $setOnInsert: { externalId } }, upsert: true } }];
  });
  if (operations.length) await Product.bulkWrite(operations, { ordered: false });
};

const hasCachedCatalog = async () => Boolean(await Product.exists({ catalogSource: 'dummyjson', externalId: { $exists: true } }));

export const syncDummyJsonCatalog = async ({ force = false } = {}) => {
  if (!force && Date.now() - lastSyncAt < CACHE_TTL_MS) return;
  if (syncInFlight) return syncInFlight;

  syncInFlight = (async () => {
    try {
      const [categorySlugs, payload] = await Promise.all([
        requestJson('/products/category-list'),
        requestJson('/products?limit=0'),
      ]);
      if (!Array.isArray(categorySlugs) || !Array.isArray(payload?.products) || !Number.isFinite(Number(payload.total))) {
        throw new AppError('DummyJSON product service returned an invalid catalog', 502);
      }
      const products = [...new Map(payload.products
        .filter((item) => item && Number.isInteger(Number(item.id)) && Number(item.id) > 0)
        .map((item) => [Number(item.id), item])).values()];
      if (Number(payload.total) > 0 && !products.length) {
        throw new AppError('DummyJSON product service returned an empty catalog', 502);
      }
      const productCategories = products.map((item) => slugify(item.category));
      const allCategories = [...new Set([...categorySlugs, ...productCategories])];
      await upsertCategories(allCategories, products);
      await upsertProducts(products);
      lastSyncAt = Date.now();
    } catch (error) {
      if (!(await hasCachedCatalog())) throw error;
      // Keep serving the last successful snapshot when the public API is unavailable.
    } finally {
      syncInFlight = undefined;
    }
  })();
  return syncInFlight;
};

export const refreshDummyJsonProduct = async (externalId) => {
  const source = await requestJson(`/products/${encodeURIComponent(externalId)}`);
  if (!source || typeof source !== 'object' || Number(source.id) !== Number(externalId)) {
    throw new AppError('Product not found in DummyJSON catalog', 404);
  }
  const categorySlug = slugify(source.category);
  let category = await Category.findOne({ catalogSource: 'dummyjson', externalId: categorySlug });
  if (!category) {
    await syncDummyJsonCatalog();
    category = await Category.findOne({ catalogSource: 'dummyjson', externalId: categorySlug });
  }
  if (!category) await upsertCategories([categorySlug], [source]);
  await upsertProducts([source]);
  return Product.findOne({ externalId: Number(externalId), catalogSource: 'dummyjson' }).populate('category', 'name slug image');
};

export const refreshDummyJsonCategory = async (categorySlug) => {
  try {
    const payload = await requestJson(`/products/category/${encodeURIComponent(categorySlug)}`);
    if (!Array.isArray(payload?.products)) throw new AppError('DummyJSON product service returned an invalid category list', 502);
    await upsertProducts(payload.products);
  } catch (error) {
    const category = await Category.findOne({ catalogSource: 'dummyjson', externalId: slugify(categorySlug) });
    const hasCategoryProducts = category && await Product.exists({ catalogSource: 'dummyjson', category: category._id, externalId: { $exists: true } });
    if (!hasCategoryProducts) throw error;
  }
};

export default { syncDummyJsonCatalog, refreshDummyJsonProduct, refreshDummyJsonCategory };
