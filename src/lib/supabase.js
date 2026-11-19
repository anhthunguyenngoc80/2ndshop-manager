import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
export const unwrap = ({ data, error }) => { if (error) throw error; return data }
export const BUCKET = 'product-media'
