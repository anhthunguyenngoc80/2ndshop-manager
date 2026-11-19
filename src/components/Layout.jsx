import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Package, CalendarDays, ShoppingBag, BarChart3, Plus, LogOut, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
const tabs = [
  { to: '/', label: 'Sản phẩm', icon: Package },
  { to: '/schedule', label: 'Lịch đăng', icon: CalendarDays },
  { to: '/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { to: '/stats', label: 'Thống kê', icon: BarChart3 },
]
export default function Layout() {
  const nav = useNavigate(), { pathname } = useLocation()
  const link = ({ isActive }) => `flex flex-col items-center gap-0.5 px-3 py-1 text-xs md:flex-row md:gap-2 md:text-sm ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-400'}`
  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2">
          <span className="font-bold">🛍️ Shop</span>
          <nav className="hidden gap-4 md:flex">{tabs.map((t) => <NavLink key={t.to} to={t.to} end className={link}><t.icon size={16} />{t.label}</NavLink>)}</nav>
          <div className="flex gap-3"><button onClick={() => nav('/names')} aria-label="Lưu tên"><Tag size={18} /></button><button onClick={() => supabase.auth.signOut()} aria-label="Đăng xuất"><LogOut size={18} /></button></div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-4"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t bg-white pb-[env(safe-area-inset-bottom)] pt-2 md:hidden">
        {tabs.slice(0, 2).map((t) => <NavLink key={t.to} to={t.to} end className={link}><t.icon size={20} />{t.label}</NavLink>)}
        <div className="w-14" />
        {tabs.slice(2).map((t) => <NavLink key={t.to} to={t.to} end className={link}><t.icon size={20} />{t.label}</NavLink>)}
      </nav>
      {pathname === '/' && (
        <button onClick={() => nav('/?new=1')} aria-label="Thêm nhanh" className="fixed bottom-7 left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg md:hidden"><Plus /></button>
      )}
    </div>
  )
}
