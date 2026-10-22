import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowDownUp, ArrowLeft, ArrowRight, Check, CircleAlert, Minus, PackageCheck, Plus, ShieldCheck, ShoppingBag, Sparkles, Star, Truck } from 'lucide-react';
import api from '../services/api';
import { ProductImage, ProductImageCredit } from '../components/ProductImage';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { OrderSuccessModal } from './OrderSuccessModal';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from './useAuth';

const fallbackImage = 'https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1000&q=85';

function Notice({ children, tone = 'error' }) {
  const styles = tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800';
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${styles}`}><CircleAlert size={17} className="mt-0.5 shrink-0" />{children}</div>;
}

function Loading({ label = 'Loading your store' }) {
  return <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500"><LoadingSpinner label={label} />{label}</div>;
}

function PageHeading({ eyebrow, title, copy }) {
  return <div className="mb-8"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">{eyebrow}</p><h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>{copy && <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{copy}</p>}</div>;
}

export function ProductCard({ product, priority = false }) {
  const category = typeof product.category === 'object' ? product.category?.name : '';
  return (
    <article className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_0_12px_rgba(0,0,0,0.15)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_0_18px_rgba(0,0,0,0.22)]">
      <Link to={`/products/${product._id}`} className="group flex flex-col">
        <div className="relative overflow-hidden bg-[#f0efe9]"><ProductImage product={{ ...product, category: category || product.category }} naturalHeight priority={priority} />{product.discount > 0 && <span className="absolute left-3 top-3 rounded-full bg-emerald-950 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">{product.discount}% off</span>}</div>
        <div className="p-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-800">{category || 'T-Kart select'}</p><h3 className="mt-2 line-clamp-1 text-sm font-semibold text-slate-900 group-hover:text-emerald-800">{product.name}</h3><p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-500" aria-label={`${Number(product.ratingsAverage || 0).toFixed(1)} out of 5 stars, ${product.ratingsCount || 0} ratings`}><Star size={13} className="fill-amber-400 text-amber-400" />{Number(product.ratingsAverage || 0).toFixed(1)} <span>({product.ratingsCount || 0})</span></p><div className="mt-2 flex items-center justify-between"><span className="font-bold">{formatCurrency(product.finalPrice ?? product.price)}</span>{product.discount > 0 && <span className="text-xs text-slate-400 line-through">{formatCurrency(product.price)}</span>}</div></div>
      </Link>
      <ProductImageCredit product={product} className="px-4 pb-3" />
    </article>
  );
}

function ProductMasonry({ products }) {
  const containerRef = useRef(null);
  const [columnCount, setColumnCount] = useState(() => Math.max(1, Math.min(products.length, 2)));

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || products.length === 0) return undefined;

    const updateColumns = () => {
      const width = container.getBoundingClientRect().width;
      const styles = window.getComputedStyle(container);
      const gap = Number.parseFloat(styles.columnGap) || 0;
      const minColumnWidth = width < 640 ? 130 : 185;
      const maxColumns = Math.max(1, Math.floor((width + gap) / (minColumnWidth + gap)));
      const nextColumnCount = Math.max(1, Math.min(products.length, maxColumns));
      setColumnCount((current) => current === nextColumnCount ? current : nextColumnCount);
    };

    updateColumns();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateColumns);
      return () => window.removeEventListener('resize', updateColumns);
    }

    const observer = new ResizeObserver(updateColumns);
    observer.observe(container);
    return () => observer.disconnect();
  }, [products.length]);

  const columns = Array.from({ length: columnCount }, () => []);
  products.forEach((product, index) => columns[index % columnCount].push({ product, index }));

  return <div ref={containerRef} className="grid w-full grid-cols-1 gap-3 sm:gap-5" style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}>
    {columns.map((column, columnIndex) => <div key={columnIndex} className="flex min-w-0 flex-col gap-3 sm:gap-5">
      {column.map(({ product, index }) => <ProductCard key={product._id} product={product} priority={index < 4} />)}
    </div>)}
  </div>;
}

export function HomePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api.get('/products?limit=20&sortBy=createdAt&sortOrder=desc', { signal: controller.signal }),
      api.get('/categories', { signal: controller.signal }),
    ])
      .then(([productResponse, categoryResponse]) => {
        setProducts(productResponse.data.data || []);
        setCategories(categoryResponse.data.data || []);
      })
      .catch((err) => { if (!controller.signal.aborted) setError(err.response?.data?.message || 'We could not load the latest products. Please try again.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <div className="relative isolate grid min-h-[420px] overflow-hidden rounded-[2rem] bg-[#dbe4d7] sm:min-h-[510px] lg:grid-cols-[1.02fr_.98fr]">
          <div className="relative z-10 flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-16">
            <p className="mb-5 inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.17em] text-emerald-950"><Sparkles size={13} /> The everyday, considered</p>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] text-emerald-950 sm:text-6xl">Good things for <span className="font-serif italic font-normal">slower</span> living.</h1>
            <p className="mt-5 max-w-md text-sm leading-6 text-emerald-950/70 sm:text-base">Useful, well-made essentials chosen to bring a little more intention to the spaces you call home.</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link to="/products" className="inline-flex items-center gap-2 rounded-full bg-emerald-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800">Explore the collection <ArrowRight size={16} /></Link><a href="#featured" className="rounded-full border border-emerald-950/20 bg-white/40 px-6 py-3 text-sm font-semibold text-emerald-950 hover:bg-white/70">Discover more</a></div>
          </div>
          <div className="relative min-h-64 lg:min-h-full"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=90" alt="Warm, calm living space with natural materials" className="absolute inset-0 h-full w-full object-cover" onError={(event) => { event.currentTarget.src = fallbackImage; }} /><div className="absolute inset-0 bg-gradient-to-r from-[#dbe4d7] via-transparent to-transparent lg:w-1/3" /></div>
        </div>
        <div className="grid grid-cols-1 gap-3 border-b border-slate-200 py-7 sm:grid-cols-3">
          {[['01', 'Made for everyday', 'Useful pieces, chosen with care'], ['02', 'A lighter footprint', 'Fewer, better things'], ['03', 'Here when you need us', 'Friendly support, always']].map(([n, title, text]) => <div key={n} className="flex items-center gap-4 px-2 py-1 sm:justify-center"><span className="text-xs font-bold text-emerald-700">{n}</span><div><p className="text-sm font-semibold">{title}</p><p className="mt-0.5 text-xs text-slate-500">{text}</p></div></div>)}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">Find your feeling</p><h2 className="mt-2 text-2xl font-bold tracking-tight">Shop by category</h2></div><Link to="/products" className="hidden items-center gap-1 text-sm font-semibold text-emerald-800 sm:flex">All categories <ArrowRight size={15} /></Link></div>
        {categories.length > 0 ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{categories.slice(0, 4).map((category, index) => <Link key={category._id} to={`/products?category=${category._id}`} className="group relative flex min-h-40 items-end overflow-hidden rounded-2xl bg-emerald-950 p-5 text-white sm:min-h-52"><img src={category.image || fallbackImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.src = fallbackImage; }} /><div className={`absolute inset-0 ${index % 2 ? 'bg-gradient-to-t from-slate-950/70 to-emerald-950/10' : 'bg-gradient-to-t from-emerald-950/70 to-transparent'}`} /><div className="relative"><h3 className="text-lg font-semibold">{category.name}</h3><span className="mt-1 inline-flex items-center gap-1 text-xs text-white/80">Explore <ArrowRight size={13} /></span></div></Link>)}</div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">New collections are on their way. Browse the full shop to see what’s available.</div>}
      </section>
      <section id="featured" className="w-full px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">Handpicked for you</p><h2 className="mt-2 text-2xl font-bold tracking-tight">A few good finds</h2></div><Link to="/products" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800">Shop all <ArrowRight size={15} /></Link></div>
        {error ? <Notice>{error}</Notice> : loading ? <Loading label="Finding the good stuff" /> : products.length ? <ProductMasonry products={products} /> : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><p className="text-lg font-semibold">A fresh collection is taking shape.</p><p className="mt-2 text-sm text-slate-500">There aren’t any products to show just yet. Please check back soon.</p></div>}
      </section>
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><div className="flex flex-col gap-4 rounded-3xl bg-[#e7e8dc] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-10"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">The small things matter</p><h2 className="mt-2 max-w-xl text-2xl font-semibold tracking-tight text-emerald-950">Bring home something you’ll reach for every day.</h2></div><Link to="/products" className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-950 hover:bg-emerald-50">Browse the shop <ArrowRight size={15} /></Link></div></section>
    </main>
  );
}

export function ProductListPage() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [loadedQuery, setLoadedQuery] = useState(null);
  const [requestError, setRequestError] = useState('');
  const requestedPage = Number(params.get('page') || 1);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const query = params.toString();
  const loading = loadedQuery !== query;
  const error = loading ? '' : requestError;

  useEffect(() => {
    const controller = new AbortController();
    api.get('/categories', { signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) setCategories(data.data || []); })
      .catch(() => { if (!controller.signal.aborted) setCategories([]); });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    const queryParams = Object.fromEntries(new URLSearchParams(query).entries());
    api.get('/products', { params: { ...queryParams, page, limit: 20 }, signal: controller.signal })
      .then(({ data }) => {
        if (!alive) return;
        const nextPagination = data.pagination || { currentPage: 1, totalPages: 1, totalItems: 0, hasPrevPage: false, hasNextPage: false };
        if (nextPagination.totalPages > 0 && page > nextPagination.totalPages) {
          setParams((current) => { current.set('page', String(nextPagination.totalPages)); return current; });
          return;
        }
        setProducts(data.data || []);
        setPagination(nextPagination);
        setRequestError('');
        setLoadedQuery(query);
      })
      .catch((err) => { if (alive && !controller.signal.aborted) { setProducts([]); setRequestError(err.response?.data?.message || 'Could not load products. Check your connection and try again.'); setLoadedQuery(query); } });
    return () => { alive = false; controller.abort(); };
  }, [page, query, setParams]);

  const applyFilters = (event) => {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    ['search', 'category', 'minPrice', 'maxPrice'].forEach((key) => { const value = String(values.get(key) || '').trim(); if (value) next.set(key, value); });
    const [sortBy, sortOrder] = String(values.get('sort') || 'createdAt:desc').split(':');
    next.set('sortBy', sortBy); next.set('sortOrder', sortOrder);
    next.set('page', '1');
    setParams(next);
  };

  return <main className="mx-auto w-full max-w-none px-4 py-10 sm:px-6 lg:px-8"><PageHeading eyebrow="The T-Kart edit" title="Find your next favourite." copy="Explore useful things for home and everyday life. Filter the collection to find the right fit." />
    <form key={params.toString()} onSubmit={applyFilters} className="mb-8 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-3 lg:grid-cols-6">
      <label className="col-span-2 flex flex-col gap-1.5 text-[11px] font-semibold text-slate-600 sm:col-span-3 lg:col-span-2">Search<input name="search" defaultValue={params.get('search') || ''} placeholder="What are you looking for?" className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-normal outline-none focus:border-emerald-700" /></label>
      <label className="flex flex-col gap-1.5 text-[11px] font-semibold text-slate-600">Category<select name="category" value={params.get('category') || ''} onChange={(event) => event.currentTarget.form?.requestSubmit()} className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-sm font-normal outline-none focus:border-emerald-700"><option value="">All categories</option>{categories.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}</select></label>
      <label className="flex flex-col gap-1.5 text-[11px] font-semibold text-slate-600">Min price<input name="minPrice" type="number" min="0" defaultValue={params.get('minPrice') || ''} className="h-10 rounded-lg border border-slate-200 px-2 text-sm font-normal outline-none focus:border-emerald-700" placeholder="No Limit" /></label>
      <label className="flex flex-col gap-1.5 text-[11px] font-semibold text-slate-600">Max price<input name="maxPrice" type="number" min="0" defaultValue={params.get('maxPrice') || ''} className="h-10 rounded-lg border border-slate-200 px-2 text-sm font-normal outline-none focus:border-emerald-700" placeholder="No limit" /></label>
      <div className="col-span-2 mt-auto flex gap-2 sm:col-span-3 lg:col-span-2"><button type="submit" className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-950 px-4 text-sm font-semibold text-white hover:bg-emerald-800"><ArrowDownUp size={15} /> Apply filters</button><button type="button" onClick={() => setParams({})} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Clear filters</button></div>
      <label className="col-span-2 flex items-center gap-2 text-xs text-slate-500 sm:col-span-3 lg:col-span-6">Sort by <select name="sort" defaultValue={`${params.get('sortBy') || 'createdAt'}:${params.get('sortOrder') || 'desc'}`} onChange={(event) => event.currentTarget.form?.requestSubmit()} className="rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700"><option value="createdAt:desc">Newest first</option><option value="price:asc">Price: low to high</option><option value="price:desc">Price: high to low</option><option value="name:asc">Name: A to Z</option></select><span className="ml-auto">{pagination.totalItems} items</span></label>
    </form>
    {error ? <Notice>{error}</Notice> : loading ? <Loading label="Loading the collection" /> : products.length ? <><ProductMasonry products={products} /><div className="mt-9 flex items-center justify-center gap-4"><button disabled={!pagination.hasPrevPage} onClick={() => { setParams((p) => { p.set('page', String(page - 1)); return p; }); }} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40">Previous</button><span className="text-xs text-slate-500">Page {pagination.currentPage} of {Math.max(1, pagination.totalPages)}</span><button disabled={!pagination.hasNextPage} onClick={() => { setParams((p) => { p.set('page', String(page + 1)); return p; }); }} className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40">Next</button></div></> : <div className="rounded-2xl border border-slate-200 bg-white px-5 py-14 text-center"><p className="text-lg font-semibold">No products found</p><p className="mt-2 text-sm text-slate-500">Try changing your search or filters.</p><button onClick={() => setParams({})} className="mt-5 text-sm font-semibold text-emerald-800">Clear all filters</button></div>}
  </main>;
}

export function ProductDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loadedProductId, setLoadedProductId] = useState(null);
  const loading = loadedProductId !== id;
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    let alive = true;
    api.get(`/products/${id}`)
      .then(({ data }) => { if (alive) { setProduct(data.data); setError(''); setLoadedProductId(id); } })
      .catch((err) => { if (alive) { setProduct(null); setError(err.response?.data?.message || 'We could not find this product.'); setLoadedProductId(id); } });
    return () => { alive = false; };
  }, [id]);
  const addToCart = async () => {
    if (!user) return navigate(`/login?next=${encodeURIComponent(`/products/${id}`)}`);
    setAdding(true);
    try { await api.post('/cart/items', { productId: id, quantity }); window.dispatchEvent(new Event('tkart:cart-updated')); navigate('/cart'); }
    catch (err) { setError(err.response?.data?.message || 'Could not add this item to your cart.'); }
    finally { setAdding(false); }
  };
  if (loading) return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><Loading label="Loading product" /></main>;
  if (error || !product) return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6"><Notice>{error || 'Product not found.'}</Notice><Link to="/products" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><ArrowLeft size={15} /> Back to shop</Link></main>;
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><Link to="/products" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-emerald-800"><ArrowLeft size={14} /> Back to collection</Link><div className="grid gap-8 lg:grid-cols-2 lg:gap-14"><div><div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-[#f0efe9]"><ProductImage product={product} priority /></div><ProductImageCredit product={product} className="mt-2 px-3" /></div><div className="flex flex-col justify-center py-2"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">{product.category?.name || 'T-Kart select'}</p><h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{product.name}</h1><p className="mt-3 inline-flex items-center gap-1 text-sm text-slate-500" aria-label={`${Number(product.ratingsAverage || 0).toFixed(1)} out of 5 stars, ${product.ratingsCount || 0} ratings`}><Star size={15} className="fill-amber-400 text-amber-400" />{Number(product.ratingsAverage || 0).toFixed(1)} <span>({product.ratingsCount || 0} ratings)</span></p><div className="mt-4 flex items-baseline gap-3"><span className="text-2xl font-bold">{formatCurrency(product.finalPrice ?? product.price)}</span>{product.discount > 0 && <><span className="text-sm text-slate-400 line-through">{formatCurrency(product.price)}</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-800">Save {product.discount}%</span></>}</div><p className="mt-6 whitespace-pre-line text-sm leading-7 text-slate-600">{product.description}</p><p className={`mt-6 text-xs font-semibold ${product.stock > 0 ? 'text-emerald-800' : 'text-rose-700'}`}>{product.stock > 0 ? `${product.stock} available` : 'Currently out of stock'}</p>{error && <div className="mt-4"><Notice>{error}</Notice></div>}<div className="mt-6 flex gap-3"><div className="flex h-12 items-center rounded-full border border-slate-300 bg-white"><button aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 text-slate-500 disabled:opacity-30"><Minus size={15} /></button><span className="min-w-7 text-center text-sm font-semibold">{quantity}</span><button aria-label="Increase quantity" disabled={quantity >= product.stock} onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="px-3 text-slate-500 disabled:opacity-30"><Plus size={15} /></button></div><button disabled={!product.stock || adding} onClick={addToCart} className="flex-1 rounded-full bg-emerald-950 px-6 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{adding ? 'Adding…' : 'Add to cart'}</button></div><div className="mt-8 grid grid-cols-2 gap-3 border-t border-slate-200 pt-6"><div className="flex gap-2 text-xs text-slate-500"><Truck size={17} className="shrink-0 text-emerald-800" /><span>Free shipping on every order</span></div><div className="flex gap-2 text-xs text-slate-500"><ShieldCheck size={17} className="shrink-0 text-emerald-800" /><span>Secure checkout with simulated payment</span></div></div></div></div></main>;
}

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn, register, user, loading } = useAuth();
  const registerMode = location.pathname === '/register';
  const requestedNext = new URLSearchParams(location.search).get('next') || (location.pathname.startsWith('/admin') ? '/admin' : '/');
  const next = requestedNext.startsWith('/') && !requestedNext.startsWith('//') ? requestedNext : '/';
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (user) return <Navigate to={next} replace />;
  const submit = async (event) => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { if (registerMode) await register(form); else await signIn({ email: form.email, password: form.password }); navigate(next, { replace: true }); }
    catch (err) { setError(err.response?.data?.message || 'We could not complete that request. Please try again.'); }
    finally { setSubmitting(false); }
  };
  if (loading) return <Loading label="Checking your account" />;
  return <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-16"><div className="hidden min-h-[520px] overflow-hidden rounded-3xl bg-emerald-950 lg:block"><div className="relative flex h-full flex-col justify-end p-10 text-white"><img src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85" alt="" className="absolute inset-0 h-full w-full object-cover opacity-75" /><div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-transparent to-emerald-950/5" /><div className="relative"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-100">Welcome to T-Kart</p><p className="mt-3 max-w-sm text-3xl font-semibold leading-tight">Make room for the things that feel like you.</p></div></div></div><div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-9"><PageHeading eyebrow={registerMode ? 'Your next chapter' : 'Good to see you'} title={registerMode ? 'Create your account.' : 'Welcome back.'} copy={registerMode ? 'A few details and you’re ready to find something good.' : 'Sign in to pick up right where you left off.'} />{error && <div className="mb-5"><Notice>{error}</Notice></div>}<form onSubmit={submit} className="space-y-4">{registerMode && <label className="block text-xs font-semibold text-slate-600">Full name<input required minLength="2" maxLength="50" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-emerald-800" /></label>}<label className="block text-xs font-semibold text-slate-600">Email address<input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-emerald-800" /></label><label className="block text-xs font-semibold text-slate-600">Password<input required type="password" minLength="6" autoComplete={registerMode ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-emerald-800" /></label>{registerMode && <label className="block text-xs font-semibold text-slate-600">Phone (optional)<input type="tel" autoComplete="tel" pattern="[0-9]{10,15}" title="Enter 10 to 15 digits" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-emerald-800" /></label>}<button disabled={submitting} className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-950 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{submitting ? 'Please wait…' : registerMode ? 'Create account' : 'Sign in'} <ArrowRight size={16} /></button></form><p className="mt-6 text-center text-sm text-slate-500">{registerMode ? 'Already have an account?' : 'New to T-Kart?'} <Link to={`${registerMode ? '/login' : '/register'}${location.search}`} className="font-semibold text-emerald-800">{registerMode ? 'Sign in' : 'Create account'}</Link></p><p className="mt-5 text-center text-[11px] leading-5 text-slate-400">Your account is for customer shopping. Administrator access is managed separately.</p></div></main>;
}

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loading label="Checking your account" />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return children;
}

export function CartPage() {
  const [cart, setCart] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const fetchCart = () => api.get('/cart').then(({ data }) => { setCart(data.data); setError(''); }).catch((err) => setError(err.response?.data?.message || 'Could not load your cart.')).finally(() => setLoading(false));
  const loadCart = () => { setLoading(true); setError(''); return fetchCart(); };
  useEffect(() => { fetchCart(); }, []);
  const mutate = async (path, method, body) => {
    setError('');
    try { await api[method](path, ...(body ? [body] : [])); window.dispatchEvent(new Event('tkart:cart-updated')); await loadCart(); }
    catch (err) { setError(err.response?.data?.message || 'Could not update your cart.'); }
  };
  if (loading) return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><Loading label="Loading your cart" /></main>;
  if (error && !cart) return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><PageHeading eyebrow="Your picks" title="Shopping cart" /><Notice>{error}</Notice><button onClick={loadCart} className="mt-5 rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white">Try again</button></main>;
  const items = cart?.items || [];
  return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><PageHeading eyebrow="Your picks" title="Shopping cart" copy="Your cart is kept just for you. Prices always reflect the latest product details." />{error && <div className="mb-5"><Notice>{error}</Notice></div>}{items.length === 0 ? <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-900"><ShoppingBag /></div><h2 className="mt-4 text-xl font-semibold">Your cart is taking a little break.</h2><p className="mt-2 text-sm text-slate-500">Let’s find something you’ll love bringing home.</p><Link to="/products" className="mt-6 inline-flex rounded-full bg-emerald-950 px-6 py-3 text-sm font-semibold text-white">Explore the shop</Link></div> : <div className="grid gap-6 lg:grid-cols-[1fr_340px]"><div className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-4">{items.map((item) => { const p = item.product; if (!p) return null; return <article key={item._id} className="flex gap-4 py-5"><Link to={`/products/${p._id}`} className="aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-xl bg-[#f0efe9] sm:w-28"><ProductImage product={p} /></Link><div className="min-w-0 flex-1"><Link to={`/products/${p._id}`} className="line-clamp-2 text-sm font-semibold hover:text-emerald-800">{p.name}</Link><p className="mt-1 text-xs text-slate-500">{formatCurrency(p.finalPrice ?? p.price)} each</p><div className="mt-3 flex items-center gap-3"><select aria-label={`Quantity for ${p.name}`} value={item.quantity} onChange={(e) => mutate(`/cart/items/${item._id}`, 'patch', { quantity: Number(e.target.value) })} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs">{Array.from({ length: Math.max(item.quantity, Math.min(p.stock, 10)) }, (_, i) => i + 1).map((q) => <option key={q} value={q}>{q}</option>)}</select><button onClick={() => mutate(`/cart/items/${item._id}`, 'delete')} className="text-xs font-semibold text-slate-400 hover:text-rose-700">Remove</button></div></div><p className="text-sm font-bold">{formatCurrency((p.finalPrice ?? p.price) * item.quantity)}</p></article>; })}</div><aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Order summary</h2><div className="mt-5 flex justify-between text-sm text-slate-500"><span>Subtotal</span><span>{formatCurrency(cart.subtotal)}</span></div>{cart.discountTotal > 0 && <div className="mt-3 flex justify-between text-sm text-emerald-800"><span>You saved</span><span>−{formatCurrency(cart.discountTotal)}</span></div>}<div className="mt-3 flex justify-between text-sm text-slate-500"><span>Delivery</span><span>Free</span></div><div className="mt-5 flex justify-between border-t border-slate-200 pt-4 text-base font-bold"><span>Total</span><span>{formatCurrency(cart.total)}</span></div><p className="mt-2 text-[11px] text-slate-400">Final total confirmed at checkout.</p><Link to="/checkout" className="mt-5 flex h-12 items-center justify-center gap-2 rounded-full bg-emerald-950 text-sm font-semibold text-white hover:bg-emerald-800">Continue to checkout <ArrowRight size={15} /></Link><button onClick={() => mutate('/cart', 'delete')} className="mt-3 w-full py-2 text-xs font-semibold text-slate-500 hover:text-rose-700">Clear cart</button></aside></div>}</main>;
}

const blankAddress = { fullName: '', phone: '', address: '', city: '', state: '', postalCode: '' };

export function CheckoutPage() {
  const { user } = useAuth();
  const [address, setAddress] = useState({ ...blankAddress, fullName: user?.name || '', phone: user?.phone || '' });
  const [outcome, setOutcome] = useState('success');
  const [cart, setCart] = useState(null);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const creatingOrder = useRef(false);
  const paymentInProgress = useRef(false);
  const shownSuccessOrder = useRef(null);
  const fetchCart = () => api.get('/cart').then(({ data }) => { setCart(data.data); setError(''); }).catch((err) => setError(err.response?.data?.message || 'Could not load checkout details.')).finally(() => setLoading(false));
  const loadCart = () => { setLoading(true); setError(''); return fetchCart(); };
  useEffect(() => { fetchCart(); }, []);
  const payOrder = async (orderId, paymentOutcome = outcome) => {
    if (paymentInProgress.current) return;
    paymentInProgress.current = true;
    setSubmitting(true); setError('');
    try {
      const { data } = await api.post('/payments/mock', { orderId, outcome: paymentOutcome });
      const paidOrder = data.data?.order;
      if (data.success === true && paidOrder?._id === orderId && paidOrder.paymentInfo?.status === 'paid') {
        window.dispatchEvent(new Event('tkart:cart-updated'));
        setOrder(paidOrder);
        if (shownSuccessOrder.current !== orderId) {
          shownSuccessOrder.current = orderId;
          setSuccess({ order: paidOrder, payment: data.data.payment });
        }
      } else {
        setError('Payment could not be confirmed. Please check your order before trying again.');
      }
    } catch (err) {
      if (err.response?.status === 402) {
        setError(err.response.data.message || 'The simulated payment was declined. Your order is saved and you can retry payment.');
        if (!order) setOrder(err.response.data.data?.order || { _id: orderId });
      } else setError(err.response?.data?.message || 'Payment could not be completed. Please try again.');
    } finally { paymentInProgress.current = false; setSubmitting(false); }
  };
  const submitOrder = async (event) => {
    event.preventDefault();
    if (creatingOrder.current || order) return;
    creatingOrder.current = true;
    setError(''); setSubmitting(true);
    try {
      const { data } = await api.post('/orders', { shippingAddress: address });
      const created = data.data; setOrder(created);
      await payOrder(created._id, outcome);
    } catch (err) {
      if (err.response?.status !== 402) setError(err.response?.data?.message || 'We could not place your order. Please review your details.');
    } finally { creatingOrder.current = false; setSubmitting(false); }
  };
  if (success) return <OrderSuccessModal order={success.order} payment={success.payment} />;
  if (loading) return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><Loading label="Preparing checkout" /></main>;
  if (error && !cart && !order) return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><PageHeading eyebrow="Almost yours" title="Checkout" /><Notice>{error}</Notice><button onClick={loadCart} className="mt-5 rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white">Try again</button></main>;
  if (!cart?.items?.length && !order) return <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6"><PageHeading eyebrow="Almost yours" title="Checkout" /><div className="rounded-2xl border border-slate-200 bg-white p-8 text-center"><p className="font-semibold">Your cart is empty.</p><Link to="/products" className="mt-4 inline-flex text-sm font-semibold text-emerald-800">Find something good <ArrowRight size={15} /></Link></div></main>;
  if (order) return <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6"><PageHeading eyebrow="One last step" title="Your order is saved." copy="Your items are reserved. Choose a mock outcome to complete payment, or retry after a simulated decline." />{error && <div className="mb-5"><Notice>{error}</Notice></div>}<div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between text-sm"><span className="text-slate-500">Order</span><span className="font-semibold">{order.orderNumber || order._id}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">Total</span><span className="font-bold">{formatCurrency(order.totalAmount || 0)}</span></div><div className="mt-5 flex gap-3"><button disabled={submitting} onClick={() => payOrder(order._id, 'success')} className="flex-1 rounded-full bg-emerald-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{submitting ? 'Processing…' : 'Retry payment successfully'}</button><button disabled={submitting} onClick={() => payOrder(order._id, 'failed')} className="rounded-full border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50">Simulate decline</button></div><Link to={`/orders/${order._id}`} className="mt-4 block text-center text-xs font-semibold text-emerald-800">View order details</Link></div></main>;
  return <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6"><PageHeading eyebrow="Almost yours" title="A good choice." copy="Add your delivery details and choose a simulated payment outcome. No real payment is taken." />{error && <div className="mb-5"><Notice>{error}</Notice></div>}<form onSubmit={submitOrder} className="grid gap-7 lg:grid-cols-[1fr_350px]"><section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7"><h2 className="text-lg font-semibold">Delivery details</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">{[['fullName', 'Full name', 'text'], ['phone', 'Phone number', 'tel'], ['address', 'Street address', 'text'], ['city', 'City', 'text'], ['state', 'State / province', 'text'], ['postalCode', 'Postal code', 'text']].map(([key, label, type]) => <label key={key} className={`text-xs font-semibold text-slate-600 ${key === 'address' ? 'sm:col-span-2' : ''}`}>{label}<input required autoComplete={key === 'fullName' ? 'name' : key === 'phone' ? 'tel' : key === 'address' ? 'street-address' : 'address-level2'} type={type} value={address[key]} onChange={(e) => setAddress({ ...address, [key]: e.target.value })} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-emerald-800" /></label>)}</div><h2 className="mt-8 text-lg font-semibold">Mock payment</h2><p className="mt-1 text-xs text-slate-500">Choose the outcome to simulate. This never contacts a payment provider.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{[['success', 'Approve payment', 'Complete checkout successfully'], ['failed', 'Decline payment', 'Save order and try again later']].map(([value, label, sub]) => <button type="button" key={value} onClick={() => setOutcome(value)} className={`rounded-xl border p-4 text-left transition ${outcome === value ? 'border-emerald-800 bg-emerald-50 ring-1 ring-emerald-800' : 'border-slate-200 hover:border-slate-300'}`}><span className="flex items-center justify-between text-sm font-semibold">{label}{outcome === value && <Check size={16} className="text-emerald-800" />}</span><span className="mt-1 block text-xs font-normal text-slate-500">{sub}</span></button>)}</div></section><aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Your order</h2><div className="mt-4 space-y-3">{cart.items.map((item) => <div key={item._id} className="flex items-center gap-3 text-xs"><div className="aspect-[4/3] w-12 shrink-0 overflow-hidden rounded-lg bg-[#f0efe9]"><ProductImage product={item.product} /></div><span className="min-w-0 flex-1 line-clamp-2 text-slate-500">{item.product?.name} × {item.quantity}</span><span className="shrink-0 font-semibold">{formatCurrency((item.product?.finalPrice ?? item.product?.price ?? 0) * item.quantity)}</span></div>)}</div><div className="mt-5 flex justify-between border-t border-slate-200 pt-4 text-sm font-bold"><span>Total</span><span>{formatCurrency(cart.total)}</span></div><p className="mt-2 text-[11px] text-slate-400">Shipping and tax are currently free.</p><button disabled={submitting} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-950 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{submitting ? 'Placing your order…' : 'Place order & pay'} <ArrowRight size={15} /></button></aside></form></main>;
}

export function OrdersPage() {
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  useEffect(() => { api.get('/orders/my-orders').then(({ data }) => setOrders(data.data || [])).catch((err) => setError(err.response?.data?.message || 'Could not load your orders.')).finally(() => setLoading(false)); }, []);
  return <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6"><PageHeading eyebrow="Your T-Kart account" title="Your orders" copy="A little place to keep track of the good things on their way." />{error ? <Notice>{error}</Notice> : loading ? <Loading label="Finding your orders" /> : orders.length ? <div className="space-y-3">{orders.map((order) => <Link key={order._id} to={`/orders/${order._id}`} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold">{order.orderNumber}</p><p className="mt-1 text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })} · {order.orderItems.length} {order.orderItems.length === 1 ? 'item' : 'items'}</p></div><div className="flex items-center justify-between gap-5 sm:justify-start"><span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${order.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-800' : order.orderStatus === 'cancelled' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'}`}>{order.orderStatus}</span><span className="text-sm font-bold">{formatCurrency(order.totalAmount)}</span><ArrowRight size={16} className="text-slate-400" /></div></Link>)}</div> : <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><PackageCheck className="mx-auto text-emerald-800" size={30} /><h2 className="mt-4 font-semibold">Your first order is waiting.</h2><p className="mt-2 text-sm text-slate-500">When you find something you love, it’ll show up here.</p><Link to="/products" className="mt-5 inline-flex rounded-full bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white">Browse the shop</Link></div>}</main>;
}

export function OrderDetailsPage() {
  const { id } = useParams(); const [order, setOrder] = useState(null); const [payment, setPayment] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [paying, setPaying] = useState(false);
  const paidFromQuery = new URLSearchParams(useLocation().search).get('paid'); const navigate = useNavigate();
  const loadOrder = useCallback(async () => { const { data } = await api.get(`/orders/${id}`); setOrder(data.data); try { const response = await api.get(`/payments/${id}`); setPayment(response.data.data); } catch { setPayment(null); } }, [id]);
  useEffect(() => {
    let active = true;
    const fetchOrder = async () => {
      try { await loadOrder(); }
      catch (err) { if (active) setError(err.response?.data?.message || 'Could not load this order.'); }
      finally { if (active) setLoading(false); }
    };
    fetchOrder();
    return () => { active = false; };
  }, [loadOrder]);
  const retryPayment = async (outcome) => { setPaying(true); setError(''); try { await api.post('/payments/mock', { orderId: id, outcome }); await loadOrder(); navigate(`/orders/${id}?paid=1`, { replace: true }); } catch (err) { if (err.response?.status === 402) { setError('The simulated payment was declined. You can safely try again.'); await loadOrder(); } else setError(err.response?.data?.message || 'Payment could not be completed.'); } finally { setPaying(false); } };
  if (loading) return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><Loading label="Loading order" /></main>;
  if (error && !order) return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><Notice>{error}</Notice><Link to="/orders" className="mt-5 inline-flex text-sm font-semibold text-emerald-800">Back to your orders</Link></main>;
  return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><Link to="/orders" className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><ArrowLeft size={14} /> All orders</Link><PageHeading eyebrow={paidFromQuery ? 'Thank you' : 'Order details'} title={paidFromQuery ? 'It’s on its way.' : order.orderNumber} copy={`Placed ${new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}`} />{error && <div className="mb-5"><Notice>{error}</Notice></div>}<div className="grid gap-5 lg:grid-cols-[1fr_300px]"><section className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white px-5">{order.orderItems.map((item) => <div key={item._id} className="flex gap-4 py-5"><div className="aspect-[4/3] w-20 shrink-0 overflow-hidden rounded-xl bg-[#f0efe9]"><ProductImage product={{ name: item.name, image: item.image, imageSource: item.imageSource, imageCredit: item.imageCredit, imageCreditUrl: item.imageCreditUrl, imageSourceUrl: item.imageSourceUrl, category: item.categoryName }} /></div><div className="flex-1"><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 text-xs text-slate-500">Qty {item.quantity} · {item.sku}</p><ProductImageCredit product={item} className="mt-1" /></div><p className="text-sm font-bold">{formatCurrency(item.finalPrice * item.quantity)}</p></div>)}</section><aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5"><div className="flex justify-between text-sm"><span className="text-slate-500">Order status</span><span className="font-semibold capitalize">{order.orderStatus}</span></div><div className="mt-3 flex justify-between text-sm"><span className="text-slate-500">Payment</span><span className="font-semibold capitalize">{order.paymentInfo.status}</span></div>{payment && <p className="mt-2 text-[10px] text-slate-400">Latest attempt · {payment.transactionId}</p>}<div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-sm font-bold"><span>Total</span><span>{formatCurrency(order.totalAmount)}</span></div>{['pending', 'failed'].includes(order.paymentInfo.status) && order.orderStatus !== 'cancelled' && <div className="mt-5 space-y-2"><p className="text-xs text-slate-500">Your order is reserved. Finish mock payment:</p><button disabled={paying} onClick={() => retryPayment('success')} className="w-full rounded-full bg-emerald-950 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-50">{paying ? 'Processing…' : 'Retry payment'}</button><button disabled={paying} onClick={() => retryPayment('failed')} className="w-full rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50">Simulate decline</button></div>}<div className="mt-5 border-t border-slate-200 pt-4"><p className="text-xs font-semibold">Delivering to</p><p className="mt-2 text-xs leading-5 text-slate-500">{order.shippingAddress.fullName}<br />{order.shippingAddress.address}<br />{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />{order.shippingAddress.phone}</p></div></aside></div><div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-xs leading-5 text-emerald-950"><Truck className="mr-2 inline" size={15} />We’ll keep this page updated as your order moves through fulfillment.</div></main>;
}

export function NotFoundPage() { return <main className="mx-auto max-w-xl px-4 py-20 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-800">404 · Wrong turn</p><h1 className="mt-3 text-3xl font-bold">This page isn’t on the shelf.</h1><Link to="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-950 px-5 py-3 text-sm font-semibold text-white">Back to home <ArrowRight size={15} /></Link></main>; }
