import { createClient } from '@supabase/supabase-js'
import type { Report } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/** Browser/client-side Supabase client (singleton) */
let _browserClient: ReturnType<typeof createClient<{ public: { Tables: { reports: { Row: Report } } } }>> | null = null

export function getSupabaseBrowserClient() {
  if (!_browserClient) {
    _browserClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _browserClient
}

/** Server-side Supabase client (new instance per call — safe in Route Handlers) */
export function getSupabaseServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}
