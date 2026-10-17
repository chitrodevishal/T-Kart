import { BrowserRouter, Route, Routes } from 'react-router-dom';
import SystemOverview from './SystemOverview';
import { AuthProvider } from './storefront/AuthContext.jsx';
import { ThemeProvider } from './storefront/ThemeProvider.jsx';
import { StoreLayout } from './storefront/StoreLayout';
import { AdminCategories, AdminCustomers, AdminGuard, AdminInventory, AdminLayout, AdminOrders, AdminOverview, AdminProducts } from './admin/AdminDashboard';
import {
  AuthPage,
  CartPage,
  CheckoutPage,
  HomePage,
  NotFoundPage,
  OrderDetailsPage,
  OrdersPage,
  ProductDetailsPage,
  ProductListPage,
  RequireAuth,
} from './storefront/Pages';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="admin/login" element={<AuthPage />} />
          <Route path="admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
            <Route index element={<AdminOverview />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="inventory" element={<AdminInventory />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="customers" element={<AdminCustomers />} />
          </Route>
          <Route element={<StoreLayout />}>
            <Route index element={<HomePage />} />
            <Route path="products" element={<ProductListPage />} />
            <Route path="products/:id" element={<ProductDetailsPage />} />
            <Route path="login" element={<AuthPage />} />
            <Route path="register" element={<AuthPage />} />
            <Route path="cart" element={<RequireAuth><CartPage /></RequireAuth>} />
            <Route path="checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
            <Route path="orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
            <Route path="orders/:id" element={<RequireAuth><OrderDetailsPage /></RequireAuth>} />
            <Route path="system" element={<SystemOverview />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
