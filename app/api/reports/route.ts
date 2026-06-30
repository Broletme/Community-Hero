import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import type { Report } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (error) {
      console.error('[reports] Fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data as Report[])
  } catch (err) {
    console.error('[reports] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
