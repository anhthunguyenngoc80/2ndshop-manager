import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2, Plus } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { productService } from '../services/productService'
import { run } from '../lib/errors'
import { Spinner, Badge, Modal } from '../components/ui'
import ProductForm from '../features/products/ProductForm'
import { money, dateVN, sortedMedia, confirmDelete } from '../utils/format'
import { PRODUCT_STATUS } from '../utils/constants'

export default function ProductDetailPage() {
  const { id } = useParams(), nav = useNavigate()
  const { data: p, loading, reload } = useAsync(() => productService.get(id), [id])
  const [edit, setEdit] = useState(false), [zoom, setZoom] = useState(null), [saving, setSaving] = useState(false)
  if (loading) return <Spinner />
  if (!p) return <div className="py-12 text-center text-slate-400">Không tìm thấy sản phẩm</div>
  const media = sortedMedia(p)
  const act = async (fn, msg) => { if (await run(fn, msg)) reload() }
  const save = async (form) => { setSaving(true); const ok = await run(() => productService.update(p.id, (({ files, ...r }) => r)(form)), 'Đã lưu'); setSaving(false); if (ok) { setEdit(false); reload() } }
  const rows = [['Danh mục', p.category], ['Giá nhập', p.cost_price != null && money(p.cost_price)], ['Giá bán', money(p.sale_price)], ['Chất liệu', p.material], ['Màu sắc', p.color], ['Kích thước', p.size], ['Số lượng', p.quantity], ['Ngày tạo', dateVN(p.created_at)], ['Nhà cung cấp', p.supplier], ['Ghi chú', p.note], ['Ý tưởng phối đồ', p.styling_ideas]]
  return (
    <div className="space-y-4">
      <button className="flex items-center gap-1 text-sm text-slate-500" onClick={() => nav('/')}><ArrowLeft size={16} />Quay lại</button>
      <div className="flex items-start justify-between"><h1 className="text-xl font-bold">{p.name || 'Chưa đặt tên'}</h1><Badge tone={p.status === 'sold' ? 'green' : 'amber'}>{PRODUCT_STATUS[p.status]}</Badge></div>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
        {media.map((m, i) => (
          <div key={m.id} className="card relative aspect-square overflow-hidden">
            <button className="h-full w-full" onClick={() => setZoom(m)}>{m.media_type === 'video' ? <video src={m.url} className="h-full w-full object-cover" /> : <img src={m.url} className="h-full w-full object-cover" />}</button>
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/50 p-0.5 text-white">
              <button onClick={() => act(() => productService.moveMedia(p, i, -1))}><ChevronLeft size={16} /></button>
              <button onClick={() => confirmDelete('Xóa file này?') && act(() => productService.removeMedia(m), 'Đã xóa')}><Trash2 size={14} /></button>
              <button onClick={() => act(() => productService.moveMedia(p, i, 1))}><ChevronRight size={16} /></button>
            </div>
          </div>))}
        <label className="card flex aspect-square cursor-pointer items-center justify-center text-slate-400"><Plus /><input hidden multiple type="file" accept="image/*,video/*" onChange={(e) => { const fs = [...e.target.files]; e.target.value = ''; act(() => productService.addMedia(p, fs), 'Đã thêm ảnh/video') }} /></label>
      </div>
      <div className="card divide-y">{rows.filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== false).map(([k, v]) => <div key={k} className="flex justify-between gap-4 p-3 text-sm"><span className="text-slate-500">{k}</span><span className="text-right">{v}</span></div>)}</div>
      <div className="flex gap-2"><button className="btn-primary flex-1" onClick={() => setEdit(true)}>Chỉnh sửa</button><button className="btn-outline flex-1" onClick={() => act(() => productService.setSold(p.id, p.status !== 'sold'), 'Đã cập nhật trạng thái')}>{p.status === 'sold' ? 'Đánh dấu chưa bán' : 'Đánh dấu đã bán'}</button></div>
      {edit && <Modal title="Sửa sản phẩm" onClose={() => setEdit(false)}><ProductForm initial={p} submitting={saving} onSubmit={save} /></Modal>}
      {zoom && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-2" onClick={() => setZoom(null)}>{zoom.media_type === 'video' ? <video src={zoom.url} controls autoPlay className="max-h-full max-w-full" onClick={(e) => e.stopPropagation()} /> : <img src={zoom.url} className="max-h-full max-w-full object-contain" />}</div>}
    </div>
  )
}
