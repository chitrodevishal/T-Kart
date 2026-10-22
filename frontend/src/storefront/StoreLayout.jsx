import { useCallback, useEffect, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ArrowRight, Search, ShoppingBag, ShoppingCart, UserRound } from 'lucide-react';
import api from '../services/api';
import { useAuth } from './useAuth';
import { ThemeToggle } from '../components/ThemeToggle';

export function StoreLayout() {
  const { user, loading, signOut } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const refreshCartCount = useCallback(async () => {
    if (!localStorage.getItem('tkart_token')) return;
    try {
      const { data } = await api.get('/cart');
      setCartCount((data.data.items || []).reduce((total, item) => total + item.quantity, 0));
    } catch {
      setCartCount(0);
    }
  }, []);

  useEffect(() => {
    const handleCartUpdate = () => {
      if (!localStorage.getItem('tkart_token')) setCartCount(0);
      else refreshCartCount();
    };
    window.addEventListener('tkart:cart-updated', handleCartUpdate);
    if (localStorage.getItem('tkart_token')) window.dispatchEvent(new Event('tkart:cart-updated'));
    return () => window.removeEventListener('tkart:cart-updated', handleCartUpdate);
  }, [refreshCartCount]);

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(`/products${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`);
  };

  return (
    <div className="min-h-screen bg-[#f7f7f3] text-slate-900">
      <div className="bg-emerald-950 px-4 py-2 text-center text-xs font-medium tracking-wide text-emerald-50">
        Thoughtful essentials, delivered to your door <span className="mx-2 text-emerald-400">·</span> Free delivery on every order
      </div>
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#fbfbf8]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="T-Kart home">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-900 text-white"><ShoppingBag size={20} /></span>
            <span className="text-xl font-extrabold tracking-tight">T-kart<span className="text-emerald-700">.</span></span>
          </Link>
          <form onSubmit={submitSearch} className="hidden max-w-xl flex-1 items-center rounded-full border border-slate-200 bg-white px-4 py-2.5 md:flex">
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Search for something lovely" aria-label="Search products" />
            <button className="text-xs font-bold text-emerald-800" type="submit">Search</button>
          </form>
          <nav className="ml-auto flex items-center gap-2 sm:gap-5" aria-label="Main navigation">
            <Link className="hidden text-sm font-semibold text-slate-600 transition hover:text-emerald-800 sm:block" to="/products">Shop</Link>
            {user && <Link className="hidden text-sm font-semibold text-slate-600 transition hover:text-emerald-800 sm:block" to="/orders">Orders</Link>}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden max-w-28 truncate text-sm font-medium text-slate-600 lg:block">Hi, {user.name.split(' ')[0]}</span>
                <button onClick={signOut} className="hidden text-xs font-semibold text-slate-500 hover:text-rose-700 sm:block">Sign out</button>
              </div>
            ) : !loading && <Link to="/login" className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-800"><UserRound size={17} /><span className="hidden sm:inline">Sign in</span></Link>}
            <ThemeToggle compact />
            <Link to={user ? '/cart' : '/login?next=%2Fcart'} className="relative grid h-10 w-10 place-items-center rounded-full bg-white text-slate-800 ring-1 ring-slate-200 transition hover:bg-emerald-50" aria-label={`Cart with ${cartCount} items`}>
              <ShoppingCart size={18} />
              {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-emerald-800 px-1 text-[10px] font-bold text-white">{cartCount}</span>}
            </Link>
          </nav>
        </div>
        <form onSubmit={submitSearch} className="flex items-center gap-2 border-t border-slate-100 px-4 py-2.5 md:hidden">
          <Search className="h-4 w-4 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Search products" aria-label="Search products" />
          <button type="submit" className="text-xs font-bold text-emerald-800">Search</button>
        </form>
      </header>
      <Outlet />
      <footer className="mt-20 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <Link to="/" className="font-extrabold tracking-tight text-slate-800">T-kart<span className="text-emerald-700">.</span></Link>
          <div className="space-y-1"><p>Considered goods for everyday living.</p></div>
        </div>
      </footer>
    </div>
  );
}
