import { useState, useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { Plus } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { productService } from '../services/productService'
import { orderService } from '../services/orderService'
import { expenseService } from '../services/expenseService'
import { computeStats } from '../services/statsService'
import { run } from '../lib/errors'
import { Spinner, Stat, Modal, PageHeader, Badge } from '../components/ui'
import ExpenseForm from '../features/stats/ExpenseForm'
import { getRange, toISODate } from '../utils/dates'
import { money, dateVN, confirmDelete } from '../utils/format'

const COLORS = ['#0f172a', '#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#9333ea']
const Chart = ({ title, children }) => <div className="card p-3"><div className="mb-2 text-sm font-medium">{title}</div><div className="h-56"><ResponsiveContainer>{children}</ResponsiveContainer></div></div>
const compact = (v) => (Math.abs(v) >= 1e6 ? `${(v / 1e6).toFixed(1)}tr` : Math.abs(v) >= 1e3 ? `${Math.round(v / 1e3)}k` : v)

export default function StatsPage() {
  const { data, loading, reload } = useAsync(async () => {
    const [products, orders, expenses, categories] = await Promise.all([productService.list(), orderService.list(), expenseService.list(), expenseService.categories()])
    return { products, orders, expenses, categories }
  })
  const now = new Date()
  const [custom, setCustom] = useState({ from: toISODate(new Date(now.getFullYear(), now.getMonth(), 1)), to: toISODate(now) })
  const [form, setForm] = useState(null), [saving, setSaving] = useState(false)
  const range = useMemo(() => getRange('custom', { from: custom.from && new Date(custom.from + 'T00:00:00'), to: custom.to && new Date(custom.to + 'T00:00:00') }), [custom])
  const s = useMemo(() => data && computeStats({ ...data, range }), [data, range])
  const save = async (f) => { setSaving(true); const ok = await run(() => expenseService.save(form.id, f), 'Đã lưu chi phí'); setSaving(false); if (ok) { setForm(null); reload() } }
  const addCat = async (name) => { let c; await run(async () => { [c] = await expenseService.addCategory(name) }, 'Đã thêm loại chi phí'); if (c) await reload(); return c }
  if (loading || !s) return <Spinner />
  return (
    <div className="space-y-4">
      <PageHeader title="Thống kê"><button className="btn-primary" onClick={() => setForm({ initial: {} })}><Plus size={16} />Chi phí vốn</button></PageHeader>
      <div className="grid grid-cols-2 gap-2 sm:max-w-md">
        <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Từ ngày</span><input type="date" className="input" value={custom.from} max={custom.to || undefined} onChange={(e) => setCustom({ ...custom, from: e.target.value })} /></label>
        <label className="space-y-1"><span className="text-xs font-medium text-slate-500">Tới ngày</span><input type="date" className="input" value={custom.to} min={custom.from || undefined} onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></label>
      </div>

      <h2 className="font-semibold">Sản phẩm</h2>
      <div className="grid grid-cols-3 gap-2"><Stat label="Tổng sản phẩm" value={s.products.total} /><Stat label="Đã bán" value={s.products.sold} /><Stat label="Chưa bán" value={s.products.unsold} /></div>
      <h2 className="font-semibold">Thu tiền</h2>
      <div className="grid grid-cols-2 gap-2"><Stat label="Đã thu" value={money(s.collection.collected)} /><Stat label="Còn phải thu" value={money(s.collection.receivable)} tone="text-amber-600" /></div>
      <h2 className="font-semibold">Giá vốn & lợi nhuận</h2>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        <Stat label="Chi phí vốn" value={money(s.summary.capital)} />
        <Stat label="Tổng giá bán ra dự kiến" value={money(s.summary.expectedSales)} />
        <Stat label="Tổng giá bán ra thực tế" value={money(s.summary.actualSales)} tone="text-green-600" />
        <Stat label="Lợi nhuận dự kiến" value={money(s.summary.expectedProfit)} tone={s.summary.expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
        <Stat label="Lợi nhuận thực tế" value={money(s.summary.actualProfit)} tone={s.summary.actualProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
      </div>
      <p className="text-xs text-slate-500">Chi phí vốn = giá nhập sản phẩm (tạo trong khoảng ngày) + mọi khoản chi phí bạn thêm (tag nào cũng tính). Giá bán ra dự kiến = giá bán của số hàng đó; thực tế = các đơn đã giao. Lợi nhuận = giá bán ra − chi phí vốn. Nếu đã nhập giá nhập ở sản phẩm thì đừng nhập lại khoản đó ở chi phí vốn để tránh tính trùng.</p>

      <div className="grid gap-3 md:grid-cols-2">
        <Chart title="Doanh thu theo thời gian"><LineChart data={s.charts.series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} tickFormatter={compact} /><Tooltip formatter={money} /><Line dataKey="revenue" name="Doanh thu" stroke={COLORS[1]} /></LineChart></Chart>
        <Chart title="Lợi nhuận"><BarChart data={s.charts.series}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} tickFormatter={compact} /><Tooltip formatter={money} /><Bar dataKey="profit" name="Lợi nhuận" fill={COLORS[2]} /></BarChart></Chart>
        <Chart title="Chi phí theo loại"><PieChart><Pie data={s.charts.costByCat} dataKey="value" nameKey="name" outerRadius={70}>{s.charts.costByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={money} /><Legend /></PieChart></Chart>
        <Chart title="Đã bán và tồn kho"><BarChart data={s.charts.stock}><XAxis dataKey="name" fontSize={11} /><YAxis allowDecimals={false} fontSize={11} /><Tooltip /><Bar dataKey="value" name="Số lượng">{s.charts.stock.map((_, i) => <Cell key={i} fill={COLORS[i + 1]} />)}</Bar></BarChart></Chart>
      </div>

      <h2 className="font-semibold">Chi phí vốn trong kỳ</h2>
      <div className="card divide-y">{!s.expensesInRange.length ? <div className="p-4 text-sm text-slate-400">Chưa có khoản chi phí</div> : s.expensesInRange.map((e) => (
        <div key={e.id} className="flex items-center justify-between gap-2 p-3 text-sm">
          <div><div className="font-medium">{e.name} <Badge tone="slate">{e.expense_categories?.name || 'Khác'}</Badge></div><div className="text-xs text-slate-500">{dateVN(e.incurred_on)}{e.note && ` · ${e.note}`}</div></div>
          <div className="flex items-center gap-2"><b>{money(e.amount)}</b><button className="text-blue-600" onClick={() => setForm({ id: e.id, initial: e })}>Sửa</button><button className="text-red-600" onClick={() => confirmDelete() && run(() => expenseService.remove(e.id), 'Đã xóa').then(reload)}>Xóa</button></div>
        </div>))}</div>
      {form && <Modal title={form.id ? 'Sửa chi phí vốn' : 'Thêm chi phí vốn'} onClose={() => setForm(null)}><ExpenseForm initial={form.initial} categories={data.categories} submitting={saving} onSubmit={save} onAddCategory={addCat} /></Modal>}
    </div>
  )
}
