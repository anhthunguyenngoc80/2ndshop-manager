import { X, Loader2, Inbox } from 'lucide-react'
export const Spinner = () => <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-400" /></div>
export const Empty = ({ text = 'Chưa có dữ liệu' }) => <div className="flex flex-col items-center gap-2 py-12 text-slate-400"><Inbox />{text}</div>
export const Badge = ({ children, tone = 'slate' }) => {
  const tones = { slate: 'bg-slate-100 text-slate-700', green: 'bg-green-100 text-green-700', amber: 'bg-amber-100 text-amber-700', red: 'bg-red-100 text-red-700', blue: 'bg-blue-100 text-blue-700' }
  return <span className={`badge ${tones[tone]}`}>{children}</span>
}
export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 sm:max-w-lg sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><button onClick={onClose} aria-label="Đóng"><X /></button></div>
        {children}
      </div>
    </div>
  )
}
export const Field = ({ label, children }) => <label className="block space-y-1"><span className="text-xs font-medium text-slate-500">{label}</span>{children}</label>
export const Select = ({ options, ...p }) => <select className="input" {...p}>{Object.entries(options).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
export const Stat = ({ label, value, tone }) => <div className="card p-3"><div className="text-xs text-slate-500">{label}</div><div className={`text-lg font-semibold ${tone || ''}`}>{value}</div></div>
export const PageHeader = ({ title, children }) => <div className="mb-3 flex items-center justify-between gap-2"><h1 className="text-xl font-bold">{title}</h1><div className="flex gap-2">{children}</div></div>
