import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { run } from '../lib/errors'
export default function LoginPage() {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [signup, setSignup] = useState(false), [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    await run(async () => {
      const { error, data } = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (signup && !data.session) toast.info('Vui lòng kiểm tra email để xác nhận tài khoản')
    })
    setBusy(false)
  }
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-3 p-6">
        <h1 className="text-xl font-bold">🛍️ {signup ? 'Đăng ký' : 'Đăng nhập'}</h1>
        <input className="input" type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" required minLength={6} placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Đang xử lý…' : signup ? 'Đăng ký' : 'Đăng nhập'}</button>
        <button type="button" className="w-full text-sm text-blue-600" onClick={() => setSignup(!signup)}>{signup ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</button>
      </form>
    </div>
  )
}
