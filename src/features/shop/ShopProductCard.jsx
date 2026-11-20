import { Link } from 'react-router-dom'
import { money } from '../../utils/format'
export default function ShopProductCard({ p }) {
  const img = p.media?.find((m) => m.type === 'image')?.url
  return (
    <Link to={`/shop/p/${p.id}`} className={`card overflow-hidden ${p.in_stock ? '' : 'opacity-60'}`}>
      <div className="relative aspect-square bg-slate-100">
        {img && <img src={img} alt={p.name} loading="lazy" className="h-full w-full object-cover" />}
        {!p.in_stock && <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">{p.status === 'sold' ? 'Đã bán' : 'Hết hàng'}</span>}
      </div>
      <div className="p-2"><div className="truncate text-sm font-medium">{p.name || 'Sản phẩm'}</div>{p.sale_price != null && <div className="text-sm font-semibold">{money(p.sale_price)}</div>}</div>
    </Link>
  )
}
