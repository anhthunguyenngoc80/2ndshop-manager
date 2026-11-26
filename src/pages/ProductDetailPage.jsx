import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2, Plus, ZoomIn } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { productService } from '../services/productService'
import { run } from '../lib/errors'
import { Spinner, Badge, Modal } from '../components/ui'
import ImageViewer from '../components/ImageViewer'
import ProductForm from '../features/products/ProductForm'
import { money, dateVN, sortedMedia, confirmDelete } from '../utils/format'
import { PRODUCT_STATUS } from '../utils/constants'

export default function ProductDetailPage() {
  const { id } = useParams(), nav = useNavigate()
  const { data: p, loading, reload } = useAsync(() => productService.get(id), [id])
  const [edit, setEdit] = useState(false), [saving, setSaving] = useState(false)
  const [idx, setIdx] = useState(0), [viewer, setViewer] = useState(false)
  if (loading) return <Spinner />
  if (!p) return <div className="py-12 text-center text-slate-400">Không tìm thấy sản phẩm</div>

  const media = sortedMedia(p)
  const cur = media[Math.min(idx, media.length - 1)]
  const curIdx = cur ? media.indexOf(cur) : 0
  const act = async (fn, msg) => { const ok = await run(fn, msg); if (ok) reload(); return ok }
  const save = async (form) => { setSaving(true); const ok = await run(() => productService.update(p.id, (({ files, ...r }) => r)(form)), 'Đã lưu'); setSaving(false); if (ok) { setEdit(false); reload() } }
  const move = async (d) => { if (await act(() => productService.moveMedia(p, curIdx, d))) setIdx(Math.min(Math.max(curIdx + d, 0), media.length - 1)) }
  const rows = [['Danh mục', p.category], ['Giá nhập', p.cost_price != null && money(p.cost_price)], ['Chất liệu', p.material], ['Màu sắc', p.color], ['Kích thước', p.size], ['Số lượng', p.quantity], ['Ngày tạo', dateVN(p.created_at)], ['Nhà cung cấp', p.supplier], ['Ghi chú', p.note], ['Ý tưởng phối đồ', p.styling_ideas]].filter(([, v]) => v !== null && v !== undefined && v !== '' && v !== false)
  const measurements = (p.measurements || []).filter((m) => m.label)
  const Row = ({ k, v }) => <div className="flex justify-between gap-4 p-3 text-sm"><span className="text-slate-500">{k}</span><span className="text-right">{v}</span></div>

  return (
    <div className="space-y-4">
      <button className="flex items-center gap-1 text-sm text-slate-500" onClick={() => nav('/')}><ArrowLeft size={16} />Quay lại</button>
      <div className="grid gap-6 md:grid-cols-2 md:items-start">
        {/* Bên trái: ảnh */}
        <div className="space-y-2 md:sticky md:top-16">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
            {!cur ? <div className="flex h-full items-center justify-center text-sm text-slate-400">Chưa có ảnh</div>
              : cur.media_type === 'video' ? <video src={cur.url} controls className="h-full w-full object-contain" />
              : <button className="h-full w-full cursor-zoom-in" onClick={() => setViewer(true)}><img src={cur.url} className="h-full w-full object-cover" /><span className="absolute bottom-2 right-2 rounded-full bg-black/60 p-1.5 text-white"><ZoomIn size={16} /></span></button>}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {media.map((m, i) => (
              <button key={m.id} onClick={() => setIdx(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${i === curIdx ? 'border-slate-900' : 'border-transparent'}`}>
                {m.media_type === 'video' ? <video src={m.url} className="h-full w-full object-cover" /> : <img src={m.url} className="h-full w-full object-cover" />}
              </button>))}
            <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed text-slate-400"><Plus /><input hidden multiple type="file" accept="image/*,video/*" onChange={(e) => { const fs = [...e.target.files]; e.target.value = ''; act(() => productService.addMedia(p, fs), 'Đã thêm ảnh/video') }} /></label>
          </div>
          {!!cur && <div className="flex gap-2">
            <button className="btn-outline flex-1 !py-1" disabled={curIdx === 0} onClick={() => move(-1)}><ChevronLeft size={16} />Trước</button>
            <button className="btn-outline flex-1 !py-1" disabled={curIdx === media.length - 1} onClick={() => move(1)}>Sau<ChevronRight size={16} /></button>
            <button className="btn-outline !py-1 text-red-600" onClick={() => confirmDelete('Xóa file này?') && act(() => productService.removeMedia(cur), 'Đã xóa')}><Trash2 size={16} /></button>
          </div>}
        </div>

        {/* Bên phải: thông tin */}
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-2"><h1 className="text-xl font-bold">{p.name || 'Chưa đặt tên'}</h1><Badge tone={p.status === 'sold' ? 'green' : 'amber'}>{PRODUCT_STATUS[p.status]}</Badge></div>
          <div className="text-2xl font-bold">{money(p.sale_price)}</div>
          {!!rows.length && <div className="card divide-y">{rows.map(([k, v]) => <Row key={k} k={k} v={v} />)}</div>}
          {!!measurements.length && <div><div className="mb-1 text-sm font-semibold">Số đo</div><div className="card divide-y">{measurements.map((m, i) => <Row key={i} k={m.label} v={m.value} />)}</div></div>}
          <div className="flex gap-2"><button className="btn-primary flex-1" onClick={() => setEdit(true)}>Chỉnh sửa</button><button className="btn-outline flex-1" onClick={() => act(() => productService.setSold(p.id, p.status !== 'sold'), 'Đã cập nhật trạng thái')}>{p.status === 'sold' ? 'Đánh dấu chưa bán' : 'Đánh dấu đã bán'}</button></div>
        </div>
      </div>
      {edit && <Modal title="Sửa sản phẩm" onClose={() => setEdit(false)}><ProductForm initial={p} submitting={saving} onSubmit={save} /></Modal>}
      {viewer && <ImageViewer items={media.map((m) => ({ url: m.url, type: m.media_type }))} index={curIdx} onChange={setIdx} onClose={() => setViewer(false)} />}
    </div>
  )
}
