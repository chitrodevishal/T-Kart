import { useState, useEffect } from 'react';
import { ShoppingBag, Server, CheckCircle2, ShieldCheck, Database, Layers, Activity } from 'lucide-react';
import api from './services/api';

export default function App() {
  const [apiStatus, setApiStatus] = useState({
    loading: true,
    healthy: false,
    data: null,
    error: null
  });

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

  useEffect(() => {
    checkBackendHealth();
  }, []);

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
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                Phase 1 Active
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
                <Activity className="w-4 h-4" />
                Check API Health Status
              </button>
            </div>
          </div>
        </div>

        {/* Phase 1 Verification Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Frontend Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Frontend Application</h3>
                  <p className="text-xs text-slate-500">React + Vite + Tailwind CSS</p>
                </div>
              </div>
              <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                Running :5173
              </span>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>React 19 with Vite HMR scaffolded</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Tailwind CSS v4 & Lucide Icons integrated</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>React Router DOM & Axios ready</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Clean directory structure (components, pages, context)</span>
              </li>
            </ul>
          </div>

          {/* Backend Status Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${apiStatus.healthy ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Backend REST API</h3>
                  <p className="text-xs text-slate-500">Express.js + Node.js Engine</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${apiStatus.healthy ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {apiStatus.loading ? 'Checking...' : apiStatus.healthy ? 'Active :5000' : 'Awaiting Connection'}
              </span>
            </div>
            {apiStatus.healthy && apiStatus.data ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
                <div><strong>Message:</strong> {apiStatus.data.message}</div>
                <div><strong>Environment:</strong> {apiStatus.data.environment}</div>
                <div><strong>Timestamp:</strong> {apiStatus.data.timestamp}</div>
                <div><strong>Uptime:</strong> {apiStatus.data.uptimeSeconds}s</div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 p-3.5 bg-amber-50/50 rounded-xl border border-amber-200">
                {apiStatus.error ? (
                  <p className="text-amber-800">Note: Backend server can be tested at <code>http://localhost:5000/api/health</code> once started.</p>
                ) : (
                  <p>Connecting to backend API at port 5000...</p>
                )}
              </div>
            )}
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Express application configured with Helmet security</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>CORS & API rate-limiting middleware active</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Phase Breakdown Roadmap */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            <span>T-Kart Development Milestones</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border-2 border-blue-500 bg-blue-50/30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Phase 1 (Current)</span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">Project Initialization</h4>
              <p className="text-xs text-slate-600">Frontend & backend scaffolds, environment templates, dependencies & startup verification.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Phase 2 (Next)</span>
                <Database className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">MongoDB & Atlas Setup</h4>
              <p className="text-xs text-slate-600">tkart_db cluster, Compass connectivity, Mongoose models, and verified connection.</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Phases 3-14</span>
                <ShieldCheck className="w-4 h-4 text-slate-400" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm mb-1">APIs, UI, & Admin</h4>
              <p className="text-xs text-slate-600">Auth, Products, Cart, Orders, Mock Payment, Customer Store, Admin Dashboard & Postman Tests.</p>
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
