import { useState, useMemo } from 'react'
import { Camera, Image as ImageIcon, X } from 'lucide-react'
import { Field, Select } from '../../components/ui'
import { PRODUCT_STATUS } from '../../utils/constants'

const EMPTY = { name: '', sale_price: '', category: '', cost_price: '', material: '', color: '', size: '', quantity: 1, status: 'available', supplier: '', note: '', styling_ideas: '' }
export default function ProductForm({ initial, withFiles, submitting, onSubmit }) {
  const [f, setF] = useState({ ...EMPTY, ...(initial || {}) })
  const [files, setFiles] = useState([])
  const [more, setMore] = useState(!!initial)
  const previews = useMemo(() => files.map((x) => ({ x, url: URL.createObjectURL(x) })), [files])
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const text = (k, label, type = 'text') => <Field label={label}><input className="input" type={type} value={f[k] ?? ''} onChange={set(k)} /></Field>
  const addFiles = (e) => { setFiles((s) => [...s, ...e.target.files]); e.target.value = '' }
  const submit = (e) => {
    e.preventDefault()
    const { id, created_at, user_id, product_media, ...fields } = f
    onSubmit({ ...fields, files })
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      {withFiles && (
        <div>
          <div className="flex gap-2">
            <label className="btn-outline flex-1 cursor-pointer"><Camera size={16} />Chụp ảnh<input hidden type="file" accept="image/*" capture="environment" onChange={addFiles} /></label>
            <label className="btn-outline flex-1 cursor-pointer"><ImageIcon size={16} />Thư viện<input hidden type="file" accept="image/*,video/*" multiple onChange={addFiles} /></label>
          </div>
          {!!previews.length && <div className="mt-2 grid grid-cols-4 gap-2">{previews.map((p, i) => (
            <div key={p.url} className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
              {p.x.type.startsWith('video') ? <video src={p.url} className="h-full w-full object-cover" /> : <img src={p.url} className="h-full w-full object-cover" />}
              <button type="button" className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white" onClick={() => setFiles((s) => s.filter((_, j) => j !== i))}><X size={12} /></button>
            </div>))}</div>}
        </div>
      )}
      {text('sale_price', 'Giá bán (₫)', 'number')}
      <button type="button" className="text-sm text-blue-600" onClick={() => setMore(!more)}>{more ? 'Ẩn thông tin thêm' : 'Thêm thông tin chi tiết'}</button>
      {more && <div className="space-y-3">
        {text('name', 'Tên sản phẩm')}
        <div className="grid grid-cols-2 gap-2">{text('category', 'Danh mục')}{text('cost_price', 'Giá nhập (₫)', 'number')}{text('material', 'Chất liệu')}{text('color', 'Màu sắc')}{text('size', 'Kích thước')}{text('quantity', 'Số lượng', 'number')}</div>
        <Field label="Trạng thái"><Select options={PRODUCT_STATUS} value={f.status} onChange={set('status')} /></Field>
        {text('supplier', 'Nhà cung cấp')}
        <Field label="Ghi chú"><textarea className="input" rows={2} value={f.note ?? ''} onChange={set('note')} /></Field>
        <Field label="Ý tưởng phối đồ / nội dung"><textarea className="input" rows={2} value={f.styling_ideas ?? ''} onChange={set('styling_ideas')} /></Field>
      </div>}
      <button className="btn-primary w-full" disabled={submitting || (withFiles && !files.length && !f.sale_price && !f.name)}>{submitting ? 'Đang lưu…' : 'Lưu'}</button>
    </form>
  )
}
