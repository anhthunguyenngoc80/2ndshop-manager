import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { nameService } from '../services/nameService'
import { run } from '../lib/errors'
import { Spinner, Empty, PageHeader } from '../components/ui'
import { confirmDelete } from '../utils/format'
export default function NamesPage() {
  const { data, loading, reload } = useAsync(nameService.list)
  const [name, setName] = useState('')
  const add = async (e) => { e.preventDefault(); if (!name.trim()) return; if (await run(() => nameService.add(name), 'Đã lưu tên')) { setName(''); reload() } }
  return (<>
    <PageHeader title="Lưu tên" />
    <form onSubmit={add} className="mb-4 flex gap-2"><input className="input" placeholder="Nhập tên…" value={name} onChange={(e) => setName(e.target.value)} /><button className="btn-primary">Lưu</button></form>
    {loading ? <Spinner /> : !data?.length ? <Empty text="Chưa lưu tên nào" /> : <div className="card divide-y">{data.map((n) => <div key={n.id} className="flex items-center justify-between p-3"><span>{n.name}</span><button onClick={() => confirmDelete() && run(() => nameService.remove(n.id), 'Đã xóa').then(reload)}><Trash2 size={16} className="text-red-500" /></button></div>)}</div>}
  </>)
}
