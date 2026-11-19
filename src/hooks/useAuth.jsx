import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
const Ctx = createContext(null)
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])
  return <Ctx.Provider value={{ session, user: session?.user, loading: session === undefined }}>{children}</Ctx.Provider>
}
export const useAuth = () => useContext(Ctx)
