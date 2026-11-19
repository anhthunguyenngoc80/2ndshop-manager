import { useCallback, useEffect, useState } from 'react'
import { handleError } from '../lib/errors'
export function useAsync(fn, deps = []) {
  const [state, set] = useState({ data: null, loading: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const load = useCallback(async () => {
    try { set({ data: await fn(), loading: false }) } catch (e) { handleError(e); set({ data: null, loading: false }) }
  }, deps)
  useEffect(() => { load() }, [load])
  return { ...state, reload: load }
}
