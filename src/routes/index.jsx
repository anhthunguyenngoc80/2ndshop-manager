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

export default function AppRoutes() {
  const { session, loading } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Routes><Route path="*" element={<LoginPage />} /></Routes>
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<ProductsPage />} />
        <Route path="products/:id" element={<ProductDetailPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="names" element={<NamesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
