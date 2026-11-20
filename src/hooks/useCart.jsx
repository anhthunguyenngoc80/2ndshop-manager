import { createContext, useContext, useEffect, useMemo, useState } from 'react'
const KEY = 'shop_cart_v1'
const Ctx = createContext(null)
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] } }
export function CartProvider({ children }) {
  const [items, setItems] = useState(load) // [{ id, qty }] – tên/giá luôn lấy mới từ cửa hàng
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* bỏ qua */ } }, [items])
  const api = useMemo(() => ({
    items,
    count: items.reduce((s, i) => s + i.qty, 0),
    has: (id) => items.some((i) => i.id === id),
    add: (id) => setItems((s) => (s.some((i) => i.id === id) ? s.map((i) => (i.id === id ? { ...i, qty: Math.min(i.qty + 1, 99) } : i)) : [...s, { id, qty: 1 }])),
    setQty: (id, qty) => setItems((s) => s.map((i) => (i.id === id ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i))),
    remove: (id) => setItems((s) => s.filter((i) => i.id !== id)),
    clear: () => setItems([]),
  }), [items])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
export const useCart = () => useContext(Ctx)
