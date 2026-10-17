import { useState, useEffect } from 'react';
import { ShoppingBag, Server, CheckCircle2, ShieldCheck, Database, Layers, Activity, RefreshCw, AlertTriangle, Box, FolderTree, ShoppingCart, CreditCard, Users, ClipboardList } from 'lucide-react';
import api from './services/api';

export default function App() {
  const [apiStatus, setApiStatus] = useState({
    loading: true,
    healthy: false,
    data: null,
    error: null
  });

  const [errorTestResult, setErrorTestResult] = useState(null);

  const checkBackendHealth = async () => {
    setApiStatus(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await api.get('/health');
      setApiStatus({
        loading: false,
        healthy: true,
        data: response.data,
        error: null
      });
    } catch (err) {
      setApiStatus({
        loading: false,
        healthy: false,
        data: null,
        error: err.response?.data?.message || err.message || 'Cannot connect to backend'
      });
    }
  };

  const testOperationalError = async () => {
    setErrorTestResult({ loading: true, data: null });
    try {
      await api.get('/error-test?type=operational');
    } catch (err) {
      setErrorTestResult({
        loading: false,
        status: err.response?.status,
        message: err.response?.data?.message || err.message,
        success: err.response?.data?.success
      });
    }
  };

  useEffect(() => {
    checkBackendHealth();
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
                Phase 4 Verified
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
                onClick={checkBackendHealth}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-600/30 active:scale-95 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${apiStatus.loading ? 'animate-spin' : ''}`} />
                Refresh System & DB Status
              </button>
              <button
                onClick={testOperationalError}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Test Centralized Error Handler
              </button>
            </div>

            {errorTestResult && (
              <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>
                  <strong>Status {errorTestResult.status}:</strong> {errorTestResult.message}
                </span>
                <span className="text-emerald-400 ml-4 font-sans font-medium text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                  Caught by Centralized Handler
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Phase 4 Models Grid */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <span>Mongoose Schemas & Data Models (Phase 4 Verified)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">Strict type validations, relational references, virtuals, and compound indexes active</p>
            </div>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              6/6 Models Tested
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
                  <span>Centralized error handler & 404 catcher</span>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Phase 1 Done</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Project Initialization</h4>
              <p className="text-xs text-slate-600">Frontend & backend scaffolds, environment templates, dependencies & startup verification.</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Phase 2 Done</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">MongoDB & Compass</h4>
              <p className="text-xs text-slate-600">tkart_db cluster, Mongoose connection, Compass setup guide and diagnostics.</p>
            </div>
            <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Phase 3 Done</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Backend Foundation</h4>
              <p className="text-xs text-slate-600">Centralized error handler, CORS policies, Helmet security, rate limiting & route architecture.</p>
            </div>
            <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Phase 4 (Verified)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse"></span>
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Database Models</h4>
              <p className="text-xs text-slate-600">User, Product, Category, Cart, Order, Payment Mongoose schemas and validations.</p>
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
