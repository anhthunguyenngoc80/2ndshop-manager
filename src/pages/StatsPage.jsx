import { useState, useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { Plus } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { productService } from '../services/productService'
import { orderService } from '../services/orderService'
import { expenseService } from '../services/expenseService'
import { computeStats } from '../services/statsService'
import { run } from '../lib/errors'
import { Spinner, Stat, Modal, Select, PageHeader, Badge } from '../components/ui'
import ExpenseForm from '../features/stats/ExpenseForm'
import { getRange, toISODate } from '../utils/dates'
import { money, dateVN, confirmDelete } from '../utils/format'
import { RANGE_OPTIONS, GROUP_OPTIONS } from '../utils/constants'

const COLORS = ['#0f172a', '#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#9333ea']
const Chart = ({ title, children }) => <div className="card p-3"><div className="mb-2 text-sm font-medium">{title}</div><div className="h-56"><ResponsiveContainer>{children}</ResponsiveContainer></div></div>
const compact = (v) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}tr` : Math.abs(v) >= 1e3 ? `${Math.round(v / 1e3)}k` : v)

export default function StatsPage() {
  const { data, loading, reload } = useAsync(async () => {
    const [products, orders, expenses, categories] = await Promise.all([productService.list(), orderService.list(), expenseService.list(), expenseService.categories()])
    return { products, orders, expenses, categories }
  })
  const [rangeKey, setRangeKey] = useState('month'), [group, setGroup] = useState('day')
  const [custom, setCustom] = useState({ from: toISODate(new Date()), to: toISODate(new Date()) })
  const [form, setForm] = useState(null), [saving, setSaving] = useState(false)
  const range = useMemo(() => getRange(rangeKey, { from: custom.from && new Date(custom.from + 'T00:00:00'), to: custom.to && new Date(custom.to + 'T00:00:00') }), [rangeKey, custom])
  const s = useMemo(() => data && computeStats({ ...data, range, group }), [data, range, group])
  const save = async (f) => { setSaving(true); const ok = await run(() => expenseService.save(form.id, f), 'Đã lưu chi phí'); setSaving(false); if (ok) { setForm(null); reload() } }
  const addCat = async (name) => { let c; await run(async () => { [c] = await expenseService.addCategory(name) }, 'Đã thêm loại chi phí'); if (c) await reload(); return c }
  if (loading || !s) return <Spinner />
  return (
    <div className="space-y-4">
      <PageHeader title="Thống kê"><button className="btn-primary" onClick={() => setForm({ initial: {} })}><Plus size={16} />Chi phí</button></PageHeader>
      <div className="flex flex-wrap items-center gap-2">
        {Object.entries(RANGE_OPTIONS).map(([k, l]) => <button key={k} className={`!py-1 ${rangeKey === k ? 'btn-primary' : 'btn-outline'}`} onClick={() => setRangeKey(k)}>{l}</button>)}
        <div className="w-28"><Select options={GROUP_OPTIONS} value={group} onChange={(e) => setGroup(e.target.value)} /></div>
      </div>
      {rangeKey === 'custom' && <div className="flex gap-2"><input type="date" className="input" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} /><input type="date" className="input" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></div>}

      <h2 className="font-semibold">Sản phẩm</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5"><Stat label="Tổng sản phẩm" value={s.products.total} /><Stat label="Đã bán" value={s.products.sold} /><Stat label="Chưa bán" value={s.products.unsold} /><Stat label="Số lượng tồn kho" value={s.products.stockQty} /><Stat label="Giá trị tồn (giá nhập)" value={money(s.products.stockValue)} /></div>
      <h2 className="font-semibold">Doanh thu</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4"><Stat label="Giá trị bán dự kiến" value={money(s.revenue.expectedSales)} /><Stat label="Doanh thu (đã giao)" value={money(s.revenue.actual)} tone="text-green-600" /><Stat label="Đã thu" value={money(s.revenue.collected)} /><Stat label="Còn phải thu" value={money(s.revenue.receivable)} tone="text-amber-600" /></div>
      <h2 className="font-semibold">Chi phí & lợi nhuận</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4"><Stat label="Tổng giá nhập hàng" value={money(s.cost.purchase)} /><Stat label="Chi phí marketing" value={money(s.cost.marketing)} /><Stat label="Chi phí khác" value={money(s.cost.other)} /><Stat label="Tổng chi phí" value={money(s.cost.total)} /><Stat label="Giá vốn hàng đã bán" value={money(s.cost.cogs)} /><Stat label="Lợi nhuận dự kiến" value={money(s.profit.expected)} /><Stat label="Lợi nhuận thực tế" value={money(s.profit.actual)} tone={s.profit.actual >= 0 ? 'text-green-600' : 'text-red-600'} /></div>
      <p className="text-xs text-slate-500">Lợi nhuận thực tế = Doanh thu đã giao − Giá vốn hàng đã bán − Chi phí vận hành đã phát sinh (không gồm tiền nhập hàng, tránh tính trùng với giá vốn).</p>

      <div className="grid gap-3 md:grid-cols-2">
        <Chart title="Doanh thu theo thời gian"><LineChart data={s.charts.series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} tickFormatter={compact} /><Tooltip formatter={money} /><Line dataKey="revenue" name="Doanh thu" stroke={COLORS[1]} /></LineChart></Chart>
        <Chart title="Lợi nhuận"><BarChart data={s.charts.series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} tickFormatter={compact} /><Tooltip formatter={money} /><Bar dataKey="profit" name="Lợi nhuận" fill={COLORS[2]} /></BarChart></Chart>
        <Chart title="Chi phí theo loại"><PieChart><Pie data={s.charts.costByCat} dataKey="value" nameKey="name" outerRadius={70}>{s.charts.costByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={money} /><Legend /></PieChart></Chart>
        <Chart title="Đã bán và tồn kho"><BarChart data={s.charts.stock}><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="value" name="Số lượng">{s.charts.stock.map((_, i) => <Cell key={i} fill={COLORS[i + 1]} />)}</Bar></BarChart></Chart>
      </div>

      <h2 className="font-semibold">Khoản chi phí trong kỳ</h2>
      <div className="card divide-y">{!s.expensesInRange.length ? <div className="p-4 text-sm text-slate-400">Chưa có khoản chi phí</div> : s.expensesInRange.map((e) => (
        <div key={e.id} className="flex items-center justify-between gap-2 p-3 text-sm">
          <div><div className="font-medium">{e.name} <Badge tone={e.kind === 'planned' ? 'amber' : 'slate'}>{e.expense_categories?.name || 'Khác'}{e.kind === 'planned' && ' · dự kiến'}</Badge></div><div className="text-xs text-slate-500">{dateVN(e.incurred_on)}{e.note && ` · ${e.note}`}</div></div>
          <div className="flex items-center gap-2"><b>{money(e.amount)}</b><button className="text-blue-600" onClick={() => setForm({ id: e.id, initial: e })}>Sửa</button><button className="text-red-600" onClick={() => confirmDelete() && run(() => expenseService.remove(e.id), 'Đã xóa').then(reload)}>Xóa</button></div>
        </div>))}</div>
      {form && <Modal title={form.id ? 'Sửa chi phí' : 'Thêm chi phí'} onClose={() => setForm(null)}><ExpenseForm initial={form.initial} categories={data.categories} submitting={saving} onSubmit={save} onAddCategory={addCat} /></Modal>}
    </div>
  )
}
