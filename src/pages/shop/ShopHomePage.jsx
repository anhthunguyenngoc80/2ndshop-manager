import { useNavigate, useOutletContext } from 'react-router-dom'
import Slider from '../../features/shop/Slider'
import ShopProductCard from '../../features/shop/ShopProductCard'
import { Empty } from '../../components/ui'
export default function ShopHomePage() {
  const { shop, products } = useOutletContext()
  const nav = useNavigate()
  const slides = products.filter((p) => p.in_stock).map((p) => ({ id: p.id, name: p.name || 'Sản phẩm', image: p.media?.find((m) => m.type === 'image')?.url })).filter((s) => s.image).slice(0, 8)
  return (
    <div className="space-y-5">
      {shop.intro && <p className="text-sm text-slate-600">{shop.intro}</p>}
      {!!slides.length && <section className="space-y-2"><h2 className="font-semibold">Sắp bán</h2><Slider slides={slides} onOpen={(id) => nav(`/shop/p/${id}`)} /></section>}
      <section className="space-y-2">
        <h2 className="font-semibold">Sản phẩm</h2>
        {!products.length ? <Empty text="Chưa có sản phẩm nào" /> : <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{products.map((p) => <ShopProductCard key={p.id} p={p} />)}</div>}
      </section>
    </div>
  )
}
