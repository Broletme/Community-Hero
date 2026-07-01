import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase'
import type { Status } from '@/lib/types'

const VALID_STATUSES: Status[] = ['reported', 'verified', 'resolved']

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body as { id?: string; status?: Status }

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[status] Update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Call notify API (non-blocking)
    if (status === 'verified' || status === 'resolved') {
      fetch(new URL('/api/notify', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: id, status }),
      }).catch(err => console.error('[status] Failed to trigger notification:', err))
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[status] Unhandled error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
