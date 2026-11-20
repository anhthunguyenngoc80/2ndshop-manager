import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { run } from '../lib/errors'
export default function LoginPage() {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    await run(async () => { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error })
    setBusy(false)
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3 p-6">
        <h1 className="text-xl font-bold">🛍️ Đăng nhập quản trị</h1>
        <input className="input" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" required placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Đang xử lý…' : 'Đăng nhập'}</button>
        <Link to="/shop" className="block text-center text-sm text-blue-600">← Về trang cửa hàng</Link>
      </form>
    </div>
  )
}
