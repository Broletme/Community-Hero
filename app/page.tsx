import { getSupabaseServerClient } from '@/lib/supabase'
import type { Report } from '@/lib/types'
import NavBar from './components/NavBar'
import MapView from './components/MapView'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  // SSR seed: fetch initial reports server-side for faster first paint
  let initialReports: Report[] = []
  try {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    initialReports = (data as Report[]) ?? []
  } catch {
    // silent — MapView will still mount with realtime
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <NavBar />

      {/* Full-viewport map */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <MapView initialReports={initialReports} />

        {/* Floating report button */}
        <Link
          href="/report"
          id="fab-report-btn"
          className="fab-report-btn"
        >
          <span style={{ fontSize: '1rem' }}>⊕</span> Report Issue
        </Link>
      </div>
    </div>
  )
}
