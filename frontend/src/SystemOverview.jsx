import { useState, useEffect } from 'react';
import { ShoppingBag, Server, CheckCircle2, ShieldCheck, Database, Layers, RefreshCw, Box, FolderTree, ShoppingCart, CreditCard, Users, ClipboardList, Key, Lock, UserCheck, ShieldAlert, FileText } from 'lucide-react';
import api from './services/api';

export default function SystemOverview() {
  const [apiStatus, setApiStatus] = useState({
    loading: true,
    healthy: false,
    data: null,
    error: null,
  });

  const [authTestLogs, setAuthTestLogs] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [activeToken, setActiveToken] = useState('');

  const addLog = (type, message, status = 200) => {
    setAuthTestLogs((prev) => [
      { id: Date.now(), type, message, status, time: new Date().toLocaleTimeString() },
      ...prev.slice(0, 5),
    ]);
  };

  const checkBackendHealth = async () => {
    try {
      const response = await api.get('/health');
      setApiStatus({
        loading: false,
        healthy: true,
        data: response.data,
        error: null,
      });
    } catch (err) {
      setApiStatus({
        loading: false,
        healthy: false,
        data: null,
        error: err.response?.data?.message || err.message || 'Cannot connect to backend',
      });
    }
  };

  const refreshBackendHealth = () => {
    setApiStatus((prev) => ({ ...prev, loading: true, error: null }));
    checkBackendHealth();
  };

  // Test 1: Register Customer
  const testRegisterCustomer = async () => {
    const demoEmail = `customer_${Date.now()}@example.com`;
    try {
      const res = await api.post('/auth/register', {
        name: 'Demo Customer',
        email: demoEmail,
        password: 'Password123!',
        phone: '9876543210',
        role: 'admin', // Test privilege escalation resistance
      });
      const user = res.data.data.user;
      const token = res.data.data.token;
      setActiveUser(user);
      setActiveToken(token);
      addLog('REGISTER_SUCCESS', `Customer registered: ${user.email} (Role enforced: ${user.role})`, 201);
    } catch (err) {
      addLog('REGISTER_ERROR', err.response?.data?.message || err.message, err.response?.status || 500);
    }
  };

  // Test 2: Customer /me Profile
  const testGetProfile = async () => {
    try {
      const token = activeToken || localStorage.getItem('tkart_token');
      if (!token) return addLog('PROFILE_ERROR', 'Register or sign in before checking the current profile.', 401);
      const res = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
      addLog('PROFILE_SUCCESS', `Verified /api/auth/me for: ${res.data.data.user.name} (${res.data.data.user.role})`, 200);
    } catch (err) {
      addLog('PROFILE_ERROR', err.response?.data?.message || err.message, err.response?.status || 401);
    }
  };

  // Admins use the controlled login form; no demo credentials are shipped in the client.
  const testAdminLogin = () => { window.location.assign('/admin/login'); };

  // Test 4: Customer Attempts Admin Check (RBAC Test)
  const testRbacDeny = async () => {
    // Register or use a customer token
    try {
      const reg = await api.post('/auth/register', {
        name: 'Normal Customer',
        email: `buyer_${Date.now()}@example.com`,
        password: 'Password123!',
      });
      const customerToken = reg.data.data.token;
      setActiveToken(customerToken);
      setActiveUser(reg.data.data.user);

      // Attempt to access admin endpoint
      await api.get('/auth/admin-check', { headers: { Authorization: `Bearer ${customerToken}` } });
      addLog('RBAC_FAIL', 'Security violation: Customer was granted access to admin endpoint!', 200);
    } catch (err) {
      if (err.response?.status === 403) {
        addLog('RBAC_PASSED', `RBAC Enforced: ${err.response.data.message}`, 403);
      } else {
        addLog('RBAC_ERROR', err.response?.data?.message || err.message, err.response?.status || 500);
      }
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    api.get('/health', { signal: controller.signal })
      .then((response) => setApiStatus({ loading: false, healthy: true, data: response.data, error: null }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setApiStatus({ loading: false, healthy: false, data: null, error: err.response?.data?.message || err.message || 'Cannot connect to backend' });
      });
    return () => controller.abort();
  }, []);

  const dbConnected = apiStatus.data?.database?.connected;
  const sys = apiStatus.data?.system;

  const modelsList = [
    { name: 'User', icon: Users, desc: 'Bcrypt hashing, email index, role enforcement, safe serialization' },
    { name: 'Category', icon: FolderTree, desc: 'Slug generator, unique name index, product relationship' },
    { name: 'Product', icon: Box, desc: 'SKU unique index, text search, virtual final price, low stock' },
    { name: 'Cart', icon: ShoppingCart, desc: 'Server recalculation, authenticated customer ownership' },
    { name: 'Order', icon: ClipboardList, desc: 'Line item snapshots, status machine, inventory restore flag' },
    { name: 'Payment', icon: CreditCard, desc: 'Simulated audit log, unique transaction reference' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navbar Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">T-Kart</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Phase 13 In Progress
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/" className="text-sm font-semibold text-emerald-800 hover:text-emerald-600">Open customer shop</a>
            {activeUser ? (
              <span className="text-xs font-medium px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                {activeUser.name} ({activeUser.role})
              </span>
            ) : null}
            <a
              href="http://localhost:5000/api/health"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
            >
              <Server className="w-4 h-4" />
              API: 5000/api/health
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-8 sm:p-12 mb-10 shadow-xl border border-slate-800">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-300 text-xs font-medium mb-4">
              <Layers className="w-3.5 h-3.5" />
              <span>Full-Stack MERN Architecture</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              T-Kart E-Commerce Platform
            </h1>
            <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed">
              Customer shopping website and protected admin management system. Built with React, Tailwind CSS, Node.js, Express, and MongoDB.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <button
                onClick={refreshBackendHealth}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${apiStatus.loading ? 'animate-spin' : ''}`} />
                Refresh System Status
              </button>
            </div>
          </div>
        </div>

        {/* Phase 6 Product & Category API Overview */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-10">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-600" />
                <span>Phase 6: Product & Category APIs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Catalog endpoints passed the Phase 6 Postman checks.</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Box className="w-4 h-4 text-blue-600" /> Product API
              </h3>
              <p className="text-xs text-slate-500 mt-2">Browse, search, filter by category or price, sort, and paginate products. Admins can create, update, and deactivate products.</p>
              <code className="block text-xs text-slate-700 bg-slate-50 rounded-lg p-2 mt-3">GET · POST · PUT · DELETE /api/products</code>
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-emerald-600" /> Category API
              </h3>
              <p className="text-xs text-slate-500 mt-2">List categories by ID or slug. Admins can create and update categories; deletion is blocked while products use them.</p>
              <code className="block text-xs text-slate-700 bg-slate-50 rounded-lg p-2 mt-3">GET · POST · PUT · DELETE /api/categories</code>
            </article>
          </div>
        </section>

        {/* Phase 7 Cart & Inventory Overview */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-10">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <span>Phase 7: Cart & Inventory</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Cart operations and admin inventory passed the Phase 7 Postman checks.</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Verified
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-indigo-600" /> Customer Cart
              </h3>
              <p className="text-xs text-slate-500 mt-2">View, add, update, remove, and clear cart items. Server checks product availability and calculates current prices and totals.</p>
              <code className="block text-xs text-slate-700 bg-slate-50 rounded-lg p-2 mt-3">GET · POST · PATCH · DELETE /api/cart</code>
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Box className="w-4 h-4 text-amber-600" /> Admin Inventory
              </h3>
              <p className="text-xs text-slate-500 mt-2">Inspect stock levels and low-stock products, then update product quantities with an administrator token.</p>
              <code className="block text-xs text-slate-700 bg-slate-50 rounded-lg p-2 mt-3">GET /api/admin/inventory · PATCH /api/admin/products/:id/stock</code>
            </article>
          </div>
        </section>

        {/* Phase 8 Orders & Mock Payments Overview */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-10">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-violet-600" />
                <span>Phase 8: Orders & Mock Payments</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Checkout snapshots, order ownership, stock handling, and simulated payment outcomes.</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-violet-100 text-violet-800 border border-violet-200">Verified</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-violet-600" /> Orders</h3>
              <p className="text-xs text-slate-500 mt-2">Create an order from the authenticated cart, preserve item and address snapshots, view order history, and manage fulfillment transitions.</p>
              <code className="block text-xs text-slate-700 bg-slate-50 rounded-lg p-2 mt-3">POST · GET /api/orders</code>
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2"><CreditCard className="w-4 h-4 text-violet-600" /> Mock Payments</h3>
              <p className="text-xs text-slate-500 mt-2">Record simulated success or failure, keep payment status separate from fulfillment, and allow failed attempts to be retried.</p>
              <code className="block text-xs text-slate-700 bg-slate-50 rounded-lg p-2 mt-3">POST /api/payments/mock · GET /api/payments/:orderId</code>
            </article>
          </div>
        </section>

        {/* Phase 9 Postman Collection & API Documentation Overview */}
        <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-10">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <span>Phase 9: Postman Collection & API Documentation</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Importable API requests, reusable local environment, regression assertions, and caller-facing endpoint guidance.</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-sky-100 text-sky-800 border border-sky-200">Verified · 74 requests / 107 assertions</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <article className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">Postman API suite</h3>
              <p className="text-xs text-slate-500 mt-2">Collection v2.1 covers positive and negative API flows. Import the local environment and provide the seeded administrator secret to run it.</p>
              <code className="block text-xs text-slate-700 bg-slate-50 rounded-lg p-2 mt-3">postman/T-Kart.postman_collection.json</code>
            </article>
            <article className="rounded-xl border border-slate-200 p-4">
              <h3 className="font-semibold text-slate-900">API reference</h3>
              <p className="text-xs text-slate-500 mt-2">Endpoint index, authentication rules, request behavior, error statuses, checkout rules, and local run instructions.</p>
              <code className="block text-xs text-slate-700 bg-slate-50 rounded-lg p-2 mt-3">docs/API_DOCUMENTATION.md</code>
            </article>
          </div>
        </section>

        {/* Phase 5 Interactive Authentication & RBAC Test Console */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Phase 5: Interactive Authentication & RBAC Testing Console</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Live verification of Registration, Bcrypt Hashing, JWT Tokens, and Role-Based Access Control</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Interactive checks
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <button
              onClick={testRegisterCustomer}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">1. Register Customer</span>
                <Key className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-[11px] text-slate-500">Creates customer, issues JWT & blocks role escalation</p>
            </button>

            <button
              onClick={testGetProfile}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">2. Test /api/auth/me</span>
                <UserCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500">Validates Bearer token & retrieves current profile</p>
            </button>

            <button
              onClick={testAdminLogin}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600">3. Admin Login & Check</span>
                <Lock className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-[11px] text-slate-500">Opens the protected admin sign-in form</p>
            </button>

            <button
              onClick={testRbacDeny}
              className="p-3.5 rounded-xl border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 text-left transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-900 group-hover:text-rose-600">4. Test RBAC Block (403)</span>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <p className="text-[11px] text-slate-500">Verifies customer cannot access admin endpoints</p>
            </button>
          </div>

          {authTestLogs.length > 0 && (
            <div className="rounded-xl bg-slate-900 text-slate-200 p-4 font-mono text-xs space-y-1.5">
              <div className="text-[11px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-2">Live Authentication Test Audit Log:</div>
              {authTestLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between">
                  <span>
                    <span className="text-slate-500">[{log.time}]</span>{' '}
                    <strong className={log.status === 200 || log.status === 201 ? 'text-emerald-400' : log.status === 403 ? 'text-amber-400' : 'text-rose-400'}>
                      [{log.type}]
                    </strong>{' '}
                    {log.message}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold ${
                    log.status === 200 || log.status === 201 ? 'bg-emerald-500/20 text-emerald-300' : log.status === 403 ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    HTTP {log.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Phase 4 Models Grid */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span>Mongoose Schemas & Data Models</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Strict type validations, relational references, virtuals, and compound indexes active</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              6/6 Models Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {modelsList.map((m) => {
              const Icon = m.icon;
              return (
                <div key={m.name} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{m.name} Model</h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.desc}</p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-2">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Schema & Index Verified</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Verification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Frontend Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Frontend Client</h3>
                    <p className="text-xs text-slate-500">React 19 + Vite 8</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                  :5173 Active
                </span>
              </div>
              <ul className="space-y-2 text-xs text-slate-600 mt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>React 19 with Vite HMR scaffolded</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Tailwind CSS v4 & Lucide Icons ready</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Axios interceptor configured</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Backend Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${apiStatus.healthy ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Server className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">REST API Server</h3>
                    <p className="text-xs text-slate-500">Express.js Engine</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${apiStatus.healthy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {apiStatus.loading ? 'Checking...' : apiStatus.healthy ? ':5000 Active' : 'Disconnected'}
                </span>
              </div>

              {sys && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 space-y-1 mb-2">
                  <div><strong>Node:</strong> {sys.nodeVersion}</div>
                  <div><strong>Heap:</strong> {sys.memoryUsageMB.heapUsed} MB</div>
                  <div><strong>Uptime:</strong> {sys.uptimeSeconds}s</div>
                </div>
              )}

              <ul className="space-y-2 text-xs text-slate-600 mt-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Helmet headers & CORS whitelisting</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Dual rate limiting (general & auth)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Centralized error handler active</span>
                </li>
              </ul>
            </div>
          </div>

          {/* MongoDB Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dbConnected ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">MongoDB Database</h3>
                    <p className="text-xs text-slate-500">Mongoose ODM</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${dbConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                  {dbConnected ? 'Connected' : 'Connecting...'}
                </span>
              </div>

              {dbConnected ? (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
                  <div><strong>Database:</strong> {apiStatus.data.database.name}</div>
                  <div><strong>Host:</strong> {apiStatus.data.database.host}</div>
                  <div><strong>Status:</strong> {apiStatus.data.database.status}</div>
                </div>
              ) : (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  Awaiting database connection via Mongoose...
                </div>
              )}

              <ul className="space-y-2 text-xs text-slate-600 mt-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Target database: <code>tkart_db</code></span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Mongoose autoIndex enabled</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Phase Breakdown Roadmap */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>T-Kart Development Milestones</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Phase 1 Done</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">Initialization</h4>
              <p className="text-xs text-slate-600">Frontend & backend scaffolds, environment templates.</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Phase 2 Done</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">MongoDB</h4>
              <p className="text-xs text-slate-600">tkart_db cluster, Compass guide, Mongoose connect.</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Phase 3 Done</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">Foundation</h4>
              <p className="text-xs text-slate-600">CORS policies, Helmet, rate limiting & error handler.</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Phase 4 Done</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">Models</h4>
              <p className="text-xs text-slate-600">User, Product, Category, Cart, Order, Payment.</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Phase 5 Done</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">Auth & RBAC</h4>
              <p className="text-xs text-slate-600">Registration, login, JWT, /me, admin seed & RBAC.</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Phase 6 Verified</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">Catalog APIs</h4>
              <p className="text-xs text-slate-600">Product search and category CRUD with admin access control.</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Phase 7 Verified</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">Cart & Inventory</h4>
              <p className="text-xs text-slate-600">Customer cart APIs, stock validation, admin inventory updates.</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-violet-500 bg-violet-50/40">
              <span className="text-xs font-bold uppercase tracking-wider text-violet-700">Phase 8 Verified</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">Orders & Payments</h4>
              <p className="text-xs text-slate-600">Checkout snapshots, payment attempts, fulfillment, inventory restoration.</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-sky-500 bg-sky-50/40">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700">Phase 9 Verified</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">Postman & API Docs</h4>
              <p className="text-xs text-slate-600">Importable regression collection, local environment, and API reference.</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/50">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Phase 10 Complete</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">Customer Storefront</h4>
              <p className="text-xs text-slate-600">Browse products, manage cart, check out, and follow orders.</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/50">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Phase 11 Complete</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">Admin Dashboard</h4>
              <p className="text-xs text-slate-600">Protected admin workspace for metrics, products, categories, stock, orders, and customers.</p>
              <a href="/admin" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">Open admin dashboard <span aria-hidden="true">→</span></a>
            </div>
            <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/50">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Phase 12 In Progress</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">Frontend/API Integration</h4>
              <p className="text-xs text-slate-600">Store and admin screens use the configured API client, protected auth state, and shared session-expiry handling.</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-blue-600 bg-blue-50/50">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Phase 13 In Progress</span>
              <h4 className="font-semibold text-slate-900 text-sm mt-1 mb-1">End-to-end Testing & Security Review</h4>
              <p className="text-xs text-slate-600">Live API journey, access-control, inventory, cancellation, and security checks are underway.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <p>&copy; 2026 T-Kart E-Commerce Platform. Built for learning and production standards.</p>
      </footer>
    </div>
  );
}
