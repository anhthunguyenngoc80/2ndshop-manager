import { useState } from 'react'
import { Field, Select } from '../../components/ui'
import { SCHEDULE_STATUS } from '../../utils/constants'
export default function ScheduleForm({ initial, products, submitting, onSubmit, onDelete }) {
  const [f, setF] = useState({ product_id: '', scheduled_date: '', caption: '', status: 'planned', ...initial })
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(f) }}>
      <Field label="Sản phẩm"><select required className="input" value={f.product_id} onChange={set('product_id')}><option value="">Chọn sản phẩm…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name || 'Chưa đặt tên'}</option>)}</select></Field>
      <Field label="Ngày đăng"><input required type="date" className="input" value={f.scheduled_date} onChange={set('scheduled_date')} /></Field>
      <Field label="Trạng thái"><Select options={SCHEDULE_STATUS} value={f.status} onChange={set('status')} /></Field>
      <Field label="Nội dung cần đăng"><textarea className="input" rows={3} value={f.caption || ''} onChange={set('caption')} /></Field>
      <div className="flex gap-2"><button className="btn-primary flex-1" disabled={submitting}>Lưu</button>{onDelete && <button type="button" className="btn-danger" onClick={onDelete}>Xóa</button>}</div>
    </form>
  )
}
