import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { settingsService } from '../services/settingsService'
import { profileLink } from '../services/storefrontService'
import { run } from '../lib/errors'
import { Spinner, Empty, Badge, Field, PageHeader } from '../components/ui'
import { VISIBLE_FIELD_LABELS, CONTACT_TYPES, INQUIRY_STATUS } from '../utils/constants'
import { money, confirmDelete } from '../utils/format'

function SettingsTab() {
  const { data, loading } = useAsync(settingsService.load)
  const [f, setF] = useState(null), [saving, setSaving] = useState(false)
  useEffect(() => { if (data) setF({ shop_name: data.shop_name || '', intro: data.intro || '', contact_phone: data.contact_phone || '', contact_threads: data.contact_threads || '', contact_instagram: data.contact_instagram || '', visible_fields: data.visible_fields || {} }) }, [data])
  if (loading || !f) return <Spinner />
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const toggle = (k) => setF((s) => ({ ...s, visible_fields: { ...s.visible_fields, [k]: !s.visible_fields[k] } }))
  const save = async (e) => { e.preventDefault(); setSaving(true); await run(() => settingsService.save(f), 'Đã lưu cài đặt'); setSaving(false) }
  return (
    <form onSubmit={save} className="space-y-4">
      <div className="card space-y-3 p-4">
        <h2 className="font-semibold">Thông tin cửa hàng</h2>
        <Field label="Tên cửa hàng"><input className="input" value={f.shop_name} onChange={set('shop_name')} /></Field>
        <Field label="Giới thiệu ngắn"><textarea className="input" rows={2} value={f.intro} onChange={set('intro')} /></Field>
        <h2 className="pt-2 font-semibold">Cách khách liên hệ (để trống nếu không dùng)</h2>
        <div className="grid gap-2 md:grid-cols-3">
          <Field label="Threads (tên tài khoản)"><input className="input" placeholder="@shop" value={f.contact_threads} onChange={set('contact_threads')} /></Field>
          <Field label="Instagram (tên tài khoản)"><input className="input" placeholder="@shop" value={f.contact_instagram} onChange={set('contact_instagram')} /></Field>
          <Field label="Số điện thoại"><input className="input" type="tel" value={f.contact_phone} onChange={set('contact_phone')} /></Field>
        </div>
      </div>
      <div className="card space-y-2 p-4">
        <h2 className="font-semibold">Thông tin sản phẩm khách được xem</h2>
        <p className="text-xs text-slate-500">Ảnh và tên luôn hiển thị. Giá nhập, nhà cung cấp không bao giờ hiển thị cho khách.</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">{Object.entries(VISIBLE_FIELD_LABELS).map(([k, l]) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f.visible_fields[k]} onChange={() => toggle(k)} />{l}</label>)}</div>
      </div>
      <p className="text-xs text-slate-500">Sản phẩm chỉ hiện cho khách khi bạn tick "Đăng bán cho khách xem" trong form sản phẩm.</p>
      <button className="btn-primary w-full" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu cài đặt'}</button>
    </form>
  )
}

function InquiriesTab() {
  const { data, loading, reload } = useAsync(settingsService.inquiries)
  if (loading) return <Spinner />
  if (!data?.length) return <Empty text="Chưa có khách để lại thông tin" />
  const act = async (fn, msg) => { if (await run(fn, msg)) reload() }
  return (
    <div className="grid gap-3 md:grid-cols-2">{data.map((q) => (
      <div key={q.id} className="card space-y-2 p-3">
        <div className="flex items-start justify-between"><div><div className="font-semibold">{q.customer_name}</div><div className="text-xs text-slate-500">{new Date(q.created_at).toLocaleString('vi-VN')}</div></div><Badge tone={q.status === 'new' ? 'amber' : 'green'}>{INQUIRY_STATUS[q.status]}</Badge></div>
        <div className="text-sm">{CONTACT_TYPES[q.contact_type]}: <a className="text-blue-600" href={profileLink(q.contact_type, q.contact_value)} target="_blank" rel="noreferrer">{q.contact_value}</a></div>
        <div className="text-sm text-slate-600">{(q.items || []).map((i) => `${i.name} ×${i.qty}${i.price != null ? ` (${money(i.price)})` : ''}`).join(', ')}</div>
        {q.note && <div className="text-sm italic text-slate-500">“{q.note}”</div>}
        <div className="flex gap-2">
          <button className="btn-outline flex-1" onClick={() => act(() => settingsService.setInquiryStatus(q.id, q.status === 'new' ? 'done' : 'new'), 'Đã cập nhật')}>{q.status === 'new' ? 'Đánh dấu đã liên hệ' : 'Đánh dấu mới'}</button>
          <button className="btn-outline text-red-600" onClick={() => confirmDelete() && act(() => settingsService.removeInquiry(q.id), 'Đã xóa')}>Xóa</button>
        </div>
      </div>))}</div>
  )
}

export default function StorefrontAdminPage() {
  const [tab, setTab] = useState('settings')
  return (<>
    <PageHeader title="Cửa hàng online"><Link to="/shop" className="btn-outline"><ExternalLink size={16} />Xem trang khách</Link></PageHeader>
    <div className="mb-4 flex gap-2">{[['settings', 'Cài đặt'], ['inquiries', 'Khách liên hệ']].map(([k, l]) => <button key={k} className={tab === k ? 'btn-primary' : 'btn-outline'} onClick={() => setTab(k)}>{l}</button>)}</div>
    {tab === 'settings' ? <SettingsTab /> : <InquiriesTab />}
  </>)
}
