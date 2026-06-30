import type { Metadata } from 'next'
import NavBar from '../components/NavBar'
import ReportForm from '../components/ReportForm'

export const metadata: Metadata = {
  title: 'Report an Issue — CivicTag',
  description: 'Upload a photo and submit a civic infrastructure issue. AI will automatically categorize it.',
}

export default function ReportPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar />

      <main style={{ flex: 1, background: 'var(--color-asphalt)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '2rem 1.5rem' }}>
          {/* Page header */}
          <div style={{ marginBottom: '1.75rem' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--color-orange)',
                padding: '0.2rem 0.75rem',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.625rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--color-paper)',
                marginBottom: '0.75rem',
              }}
            >
              FORM REP-001
            </div>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                color: 'var(--color-paper)',
                lineHeight: 1.1,
                marginBottom: '0.5rem',
              }}
            >
              Report an Issue
            </h1>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.9375rem',
                color: 'var(--color-paper-dim)',
                lineHeight: 1.6,
              }}
            >
              Take a photo, confirm your location, and submit. AI will classify the issue automatically.
              Duplicates in the same area are automatically clustered — your report raises community priority.
            </p>
          </div>

          {/* Divider */}
          <div className="divider" />

          {/* Form */}
          <ReportForm />

          {/* Footer note */}
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6875rem',
              color: 'var(--color-paper-dark)',
              marginTop: '2rem',
              letterSpacing: '0.04em',
              borderTop: '1px dashed var(--color-asphalt-mid)',
              paddingTop: '0.875rem',
            }}
          >
            All submissions are public. RLS policies allow community read/write (hackathon demo).
            Do not submit sensitive personal information.
          </p>
        </div>
      </main>
    </div>
  )
}
