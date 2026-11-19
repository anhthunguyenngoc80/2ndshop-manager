import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { scheduleService } from '../services/scheduleService'
import { productService } from '../services/productService'
import { run } from '../lib/errors'
import { Spinner, Modal, Badge, PageHeader, Empty } from '../components/ui'
import ScheduleForm from '../features/schedule/ScheduleForm'
import { toISODate, mondayOf, addDays } from '../utils/dates'
import { coverOf, dateVN, confirmDelete } from '../utils/format'
import { SCHEDULE_STATUS } from '../utils/constants'

const DOW = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
export default function SchedulePage() {
  const { data: schedules, loading, reload } = useAsync(scheduleService.list)
  const { data: products } = useAsync(productService.list)
  const [view, setView] = useState('month'), [cursor, setCursor] = useState(new Date()), [tab, setTab] = useState('calendar')
  const [form, setForm] = useState(null), [saving, setSaving] = useState(false)
  const days = useMemo(() => {
    if (view === 'week') return Array.from({ length: 7 }, (_, i) => addDays(mondayOf(cursor), i))
    const start = mondayOf(new Date(cursor.getFullYear(), cursor.getMonth(), 1))
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }, [view, cursor])
  const byDay = useMemo(() => (schedules || []).reduce((m, s) => ({ ...m, [s.scheduled_date]: [...(m[s.scheduled_date] || []), s] }), {}), [schedules])
  const scheduledIds = new Set((schedules || []).filter((s) => s.status !== 'cancelled').map((s) => s.product_id))
  const unscheduled = (products || []).filter((p) => !scheduledIds.has(p.id))
  const shift = (n) => setCursor((c) => (view === 'week' ? addDays(c, 7 * n) : new Date(c.getFullYear(), c.getMonth() + n, 1)))
  const save = async (f) => { setSaving(true); const ok = await run(() => scheduleService.save(form.id, f), 'Đã lưu lịch'); setSaving(false); if (ok) { setForm(null); reload() } }
  const del = async () => { if (confirmDelete() && (await run(() => scheduleService.remove(form.id), 'Đã xóa lịch'))) { setForm(null); reload() } }
  const title = view === 'week' ? `Tuần ${dateVN(days[0])} – ${dateVN(days[6])}` : `Tháng ${cursor.getMonth() + 1}/${cursor.getFullYear()}`
  const thumb = (s) => coverOf(s.products)
  return (
    <>
      <PageHeader title="Lên lịch đăng bài">
        <button className="btn-outline" onClick={() => setView(view === 'month' ? 'week' : 'month')}>{view === 'month' ? 'Xem tuần' : 'Xem tháng'}</button>
      </PageHeader>
      <div className="mb-3 flex gap-2 text-sm">{[['calendar', 'Lịch'], ['scheduled', 'Đã lên lịch'], ['unscheduled', `Chưa lên lịch (${unscheduled.length})`]].map(([k, l]) => <button key={k} className={tab === k ? 'btn-primary' : 'btn-outline'} onClick={() => setTab(k)}>{l}</button>)}</div>
      {loading ? <Spinner /> : tab === 'calendar' ? (
        <>
          <div className="mb-2 flex items-center justify-between"><button onClick={() => shift(-1)}><ChevronLeft /></button><b>{title}</b><button onClick={() => shift(1)}><ChevronRight /></button></div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-slate-200 text-xs">
            {DOW.map((d) => <div key={d} className="bg-slate-50 p-1 text-center font-medium">{d}</div>)}
            {days.map((d) => {
              const iso = toISODate(d), items = byDay[iso] || [], dim = view === 'month' && d.getMonth() !== cursor.getMonth()
              return (
                <div key={iso} className={`min-h-[72px] cursor-pointer bg-white p-1 ${dim ? 'opacity-40' : ''} ${view === 'week' ? 'min-h-[160px]' : ''}`} onClick={() => setForm({ initial: { scheduled_date: iso } })}>
                  <div className={iso === toISODate(new Date()) ? 'font-bold text-blue-600' : ''}>{d.getDate()}</div>
                  {items.map((s) => (
                    <div key={s.id} onClick={(e) => { e.stopPropagation(); setForm({ id: s.id, initial: s }) }} className={`mt-1 flex items-center gap-1 rounded bg-slate-100 p-0.5 ${s.status === 'cancelled' ? 'line-through opacity-50' : ''} ${s.status === 'posted' ? 'bg-green-100' : ''}`}>
                      {thumb(s) && <img src={thumb(s)} className="h-5 w-5 rounded object-cover" />}<span className="truncate">{s.products?.name || 'SP'}</span>
                    </div>))}
                </div>)
            })}
          </div>
        </>
      ) : tab === 'scheduled' ? (
        !schedules?.length ? <Empty text="Chưa có lịch đăng" /> : <div className="card divide-y">{schedules.map((s) => (
          <button key={s.id} className="flex w-full items-center gap-3 p-3 text-left" onClick={() => setForm({ id: s.id, initial: s })}>
            <div className="h-12 w-12 overflow-hidden rounded bg-slate-100">{thumb(s) && <img src={thumb(s)} className="h-full w-full object-cover" />}</div>
            <div className="flex-1"><div className="text-sm font-medium">{s.products?.name || 'SP'}</div><div className="text-xs text-slate-500">{dateVN(s.scheduled_date)} {s.caption && `· ${s.caption}`}</div></div>
            <Badge tone={s.status === 'posted' ? 'green' : s.status === 'cancelled' ? 'red' : 'amber'}>{SCHEDULE_STATUS[s.status]}</Badge>
          </button>))}</div>
      ) : (
        !unscheduled.length ? <Empty text="Tất cả sản phẩm đã được lên lịch" /> : <div className="grid grid-cols-3 gap-2 md:grid-cols-6">{unscheduled.map((p) => (
          <button key={p.id} className="card overflow-hidden text-left" onClick={() => setForm({ initial: { product_id: p.id, scheduled_date: toISODate(new Date()) } })}>
            <div className="aspect-square bg-slate-100">{coverOf(p) && <img src={coverOf(p)} className="h-full w-full object-cover" />}</div><div className="truncate p-1 text-xs">{p.name || 'Chưa đặt tên'}</div>
          </button>))}</div>
      )}
      {form && <Modal title={form.id ? 'Sửa lịch đăng' : 'Lên lịch đăng'} onClose={() => setForm(null)}><ScheduleForm initial={form.initial} products={products || []} submitting={saving} onSubmit={save} onDelete={form.id && del} /></Modal>}
    </>
  )
}
