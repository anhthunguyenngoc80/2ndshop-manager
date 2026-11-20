import { useState } from 'react'
import { toast } from 'sonner'
import { Copy, MessageCircle, Phone, CheckCircle2 } from 'lucide-react'
import { Modal, Field, Select } from '../../components/ui'
import { CONTACT_TYPES } from '../../utils/constants'
import { contactLinks, orderMessage, storefrontService } from '../../services/storefrontService'
import { run } from '../../lib/errors'

/** items: [{ id, name, price?, qty }] – sản phẩm khách muốn mua */
export default function ContactModal({ shop, items, onClose, onSent }) {
  const links = contactLinks(shop)
  const [f, setF] = useState({ name: '', type: 'threads', value: '', note: '' })
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false)
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }))
  const copy = () => navigator.clipboard?.writeText(orderMessage(items)).then(() => toast.success('Đã sao chép nội dung, hãy dán vào tin nhắn')).catch(() => toast.error('Không sao chép được'))
  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    const ok = await run(() => storefrontService.submitInquiry({ ...f, items }))
    setBusy(false); if (ok) { setDone(true); onSent?.() }
  }
  const open = (href, label, Icon) => href && <a key={label} href={href} target="_blank" rel="noreferrer" className="btn-outline"><Icon size={16} />{label}</a>
  return (
    <Modal title="Liên hệ để mua hàng" onClose={onClose}>
      {done ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center"><CheckCircle2 className="text-green-600" size={40} /><div className="font-semibold">Đã gửi thông tin!</div><div className="text-sm text-slate-500">Cửa hàng sẽ liên hệ với bạn sớm.</div><button className="btn-primary mt-2" onClick={onClose}>Đóng</button></div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-50 p-3 text-sm">{items.map((i) => <div key={i.id}>• {i.name} ×{i.qty || 1}</div>)}</div>
          {(links.threads || links.instagram || links.phone) && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Nhắn trực tiếp cho cửa hàng</div>
              <div className="flex flex-wrap gap-2">{open(links.threads, 'Threads', MessageCircle)}{open(links.instagram, 'Instagram', MessageCircle)}{open(links.phone, 'Gọi điện', Phone)}</div>
              <button type="button" className="btn-outline w-full" onClick={copy}><Copy size={16} />Sao chép nội dung đặt mua</button>
            </div>)}
          <form onSubmit={submit} className="space-y-3 border-t pt-3">
            <div className="text-sm font-medium">Hoặc để lại thông tin, cửa hàng sẽ liên hệ bạn</div>
            <Field label="Tên của bạn"><input required className="input" maxLength={100} value={f.name} onChange={set('name')} /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Cách liên hệ"><Select options={CONTACT_TYPES} value={f.type} onChange={set('type')} /></Field>
              <Field label={f.type === 'phone' ? 'Số điện thoại' : 'Tên tài khoản'}><input required className="input" maxLength={100} value={f.value} onChange={set('value')} placeholder={f.type === 'phone' ? '09xx xxx xxx' : '@ten_tai_khoan'} /></Field>
            </div>
            <Field label="Ghi chú (không bắt buộc)"><input className="input" maxLength={500} value={f.note} onChange={set('note')} /></Field>
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Đang gửi…' : 'Gửi thông tin'}</button>
          </form>
        </div>)}
    </Modal>
  )
}
