import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, LayoutGrid, List, Search } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { productService, filterProducts } from '../services/productService'
import { run } from '../lib/errors'
import { Spinner, Empty, Badge, Modal, Select, PageHeader } from '../components/ui'
import ProductForm from '../features/products/ProductForm'
import { money, coverOf, confirmDelete } from '../utils/format'
import { PRODUCT_STATUS, SORT_OPTIONS } from '../utils/constants'

export default function ProductsPage() {
  const nav = useNavigate()
  const [params, setParams] = useSearchParams()
  const { data, loading, reload } = useAsync(productService.list)
  const [view, setView] = useState('grid')
  const [q, setQ] = useState({ search: '', status: 'all', sort: 'newest' })
  const [saving, setSaving] = useState(false)
  const adding = params.get('new') === '1'
  const list = useMemo(() => filterProducts(data || [], q), [data, q])
  const sold = (data || []).filter((p) => p.status === 'sold').length

  const create = async (form) => {
    setSaving(true)
    const ok = await run(() => productService.create(form), 'Đã thêm sản phẩm')
    setSaving(false)
    if (ok) { setParams({}); reload() }
  }
  const toggle = (e, p) => { e.stopPropagation(); run(() => productService.setSold(p.id, p.status !== 'sold'), 'Đã cập nhật trạng thái').then(reload) }
  const del = async (e, p) => { e.stopPropagation(); if (confirmDelete()) { await run(() => productService.remove(p), 'Đã xóa sản phẩm'); reload() } }
  const StatusBadge = ({ p }) => <Badge tone={p.status === 'sold' ? 'green' : 'amber'}>{PRODUCT_STATUS[p.status]}</Badge>

  return (
    <>
      <PageHeader title="Sản phẩm">
        <button className="btn-outline" onClick={() => setView(view === 'grid' ? 'table' : 'grid')}>{view === 'grid' ? <List size={16} /> : <LayoutGrid size={16} />}</button>
        <button className="btn-primary" onClick={() => setParams({ new: '1' })}><Plus size={16} />Thêm</button>
      </PageHeader>
      <div className="mb-3 text-sm text-slate-500">Đã bán <b>{sold}</b> · Chưa bán <b>{(data || []).length - sold}</b></div>
      <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        <div className="relative col-span-2"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input className="input pl-9" placeholder="Tìm theo tên…" value={q.search} onChange={(e) => setQ({ ...q, search: e.target.value })} /></div>
        <Select options={{ all: 'Tất cả', ...PRODUCT_STATUS }} value={q.status} onChange={(e) => setQ({ ...q, status: e.target.value })} />
        <Select options={SORT_OPTIONS} value={q.sort} onChange={(e) => setQ({ ...q, sort: e.target.value })} />
      </div>
      {loading ? <Spinner /> : !list.length ? <Empty text="Chưa có sản phẩm. Nhấn + để thêm." /> : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{list.map((p) => (
          <div key={p.id} onClick={() => nav(`/products/${p.id}`)} className="card cursor-pointer overflow-hidden">
            <div className="aspect-square bg-slate-100">{coverOf(p) && <img src={coverOf(p)} className="h-full w-full object-cover" loading="lazy" />}</div>
            <div className="space-y-1 p-2">
              <div className="truncate text-sm font-medium">{p.is_published && <span title="Đang đăng bán cho khách">🌐 </span>}{p.name || 'Chưa đặt tên'}</div>
              <div className="flex items-center justify-between"><span className="text-sm font-semibold">{money(p.sale_price)}</span><StatusBadge p={p} /></div>
              <div className="flex gap-1"><button className="btn-outline flex-1 !py-1 text-xs" onClick={(e) => toggle(e, p)}>{p.status === 'sold' ? 'Đánh dấu chưa bán' : 'Đánh dấu đã bán'}</button><button className="btn-outline !py-1 text-xs text-red-600" onClick={(e) => del(e, p)}>Xóa</button></div>
            </div>
          </div>))}</div>
      ) : (
        <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-slate-50 text-left text-xs text-slate-500"><tr><th className="p-2">Ảnh</th><th>Tên</th><th>Giá bán</th><th>SL</th><th>Trạng thái</th><th /></tr></thead><tbody>{list.map((p) => (
          <tr key={p.id} className="cursor-pointer border-t" onClick={() => nav(`/products/${p.id}`)}>
            <td className="p-2"><div className="h-10 w-10 overflow-hidden rounded bg-slate-100">{coverOf(p) && <img src={coverOf(p)} className="h-full w-full object-cover" />}</div></td>
            <td>{p.name || 'Chưa đặt tên'}</td><td>{money(p.sale_price)}</td><td>{p.quantity}</td><td><StatusBadge p={p} /></td>
            <td className="space-x-2 pr-2 text-right"><button className="text-blue-600" onClick={(e) => toggle(e, p)}>{p.status === 'sold' ? 'Chưa bán' : 'Đã bán'}</button><button className="text-red-600" onClick={(e) => del(e, p)}>Xóa</button></td></tr>))}</tbody></table></div>
      )}
      {adding && <Modal title="Thêm sản phẩm" onClose={() => setParams({})}><ProductForm withFiles submitting={saving} onSubmit={create} /></Modal>}
    </>
  )
}
