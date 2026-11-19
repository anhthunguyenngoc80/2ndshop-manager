import { useState } from 'react'
import { Field } from '../../components/ui'
import { toISODate } from '../../utils/dates'
export default function ExpenseForm({ initial, categories, submitting, onSubmit, onAddCategory }) {
  const [f, setF] = useState({ name: '', amount: '', category_id: categories[0]?.id || '', kind: 'incurred', incurred_on: toISODate(new Date()), note: '', ...initial })
  const [newCat, setNewCat] = useState('')
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSubmit(f) }}>
      <Field label="Tên khoản chi phí"><input required className="input" value={f.name} onChange={set('name')} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Số tiền (₫)"><input required type="number" min="0" className="input" value={f.amount} onChange={set('amount')} /></Field>
        <Field label="Ngày phát sinh"><input required type="date" className="input" value={f.incurred_on} onChange={set('incurred_on')} /></Field>
      </div>
      <Field label="Tag"><select className="input" value={f.category_id} onChange={set('category_id')}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <div className="flex gap-2"><input className="input" placeholder="Thêm tag mới…" value={newCat} onChange={(e) => setNewCat(e.target.value)} /><button type="button" className="btn-outline" onClick={async () => { if (newCat.trim()) { const c = await onAddCategory(newCat.trim()); if (c) setF((s) => ({ ...s, category_id: c.id })); setNewCat('') } }}>Thêm</button></div>
      <Field label="Ghi chú (không bắt buộc)"><input className="input" value={f.note || ''} onChange={set('note')} /></Field>
      <button className="btn-primary w-full" disabled={submitting}>Lưu</button>
    </form>
  )
}
