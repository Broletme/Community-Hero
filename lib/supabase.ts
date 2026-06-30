import { createClient } from '@supabase/supabase-js'
import type { Report } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type Database = {
  public: {
    Tables: {
      reports: {
        Row: Report
        Insert: Partial<Report>
        Update: Partial<Report>
      }
    }
    Functions: {
      find_nearby_report: {
        Args: {
          p_lat: number
          p_lng: number
          p_category: string
          radius_m?: number
          days_window?: number
        }
        Returns: { id: string; cluster_id: string | null }[]
      }
    }
  }
}

/** Browser/client-side Supabase client (singleton) */
let _browserClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (!_browserClient) {
    _browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return _browserClient
}

/** Server-side Supabase client (new instance per call — safe in Route Handlers) */
export function getSupabaseServerClient() {
  return createClient<Database>(supabaseUrl, supabaseAnonKey)
}
