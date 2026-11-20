import { Link, Outlet } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useCart } from '../../hooks/useCart'
import { storefrontService } from '../../services/storefrontService'
import { Spinner, Empty } from '../../components/ui'
export default function ShopLayout() {
  const { data, loading } = useAsync(storefrontService.get)
  const { count } = useCart()
  const shop = data?.shop
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/shop" className="font-bold">🛍️ {shop?.name || 'Cửa hàng'}</Link>
          <Link to="/shop/cart" className="relative p-1" aria-label="Giỏ hàng"><ShoppingBag />{count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs text-white">{count}</span>}</Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-4">{loading ? <Spinner /> : !shop ? <Empty text="Cửa hàng chưa sẵn sàng" /> : <Outlet context={{ shop, products: data.products }} />}</main>
      <footer className="py-6 text-center text-xs text-slate-400"><Link to="/login">Quản trị</Link></footer>
    </div>
  )
}
