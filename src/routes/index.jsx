import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Layout from '../components/Layout'
import { Spinner } from '../components/ui'
import LoginPage from '../pages/LoginPage'
import ProductsPage from '../pages/ProductsPage'
import ProductDetailPage from '../pages/ProductDetailPage'
import SchedulePage from '../pages/SchedulePage'
import OrdersPage from '../pages/OrdersPage'
import StatsPage from '../pages/StatsPage'
import NamesPage from '../pages/NamesPage'
import StorefrontAdminPage from '../pages/StorefrontAdminPage'
import ShopLayout from '../features/shop/ShopLayout'
import ShopHomePage from '../pages/shop/ShopHomePage'
import ShopProductPage from '../pages/shop/ShopProductPage'
import CartPage from '../pages/shop/CartPage'

export default function AppRoutes() {
  const { session, loading } = useAuth()
  if (loading) return <Spinner />
  return (
    <Routes>
      {/* Khách: không cần đăng nhập */}
      <Route path="/shop" element={<ShopLayout />}>
        <Route index element={<ShopHomePage />} />
        <Route path="p/:id" element={<ShopProductPage />} />
        <Route path="cart" element={<CartPage />} />
      </Route>
      <Route path="/login" element={session ? <Navigate to="/" replace /> : <LoginPage />} />
      {/* Admin: cần đăng nhập */}
      {session ? (
        <Route element={<Layout />}>
          <Route index element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="names" element={<NamesPage />} />
          <Route path="storefront" element={<StorefrontAdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/shop" replace />} />
      )}
    </Routes>
  )
}
