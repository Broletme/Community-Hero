'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, PlusCircle, LayoutList, User as UserIcon } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { getSupabaseBrowserClient } from '@/lib/supabase'

const navLinks = [
  { href: '/', label: 'Live Map', icon: MapPin },
  { href: '/report', label: 'Report Issue', icon: PlusCircle },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutList },
]

export default function NavBar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <nav
      style={{
        background: 'var(--color-asphalt)',
        borderBottom: '2px solid var(--color-orange)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            textDecoration: 'none',
          }}
        >
          <span
            style={{
              background: 'var(--color-orange)',
              color: 'var(--color-paper)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.7rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.2rem 0.5rem',
              clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
            }}
          >
            ⚠
          </span>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '1.125rem',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--color-paper)',
            }}
          >
            Civic<span style={{ color: 'var(--color-orange)' }}>Tag</span>
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.375rem 0.875rem',
                  fontFamily: 'var(--font-display)',
                  fontWeight: active ? 700 : 600,
                  fontSize: '0.8125rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: active ? 'var(--color-orange)' : 'var(--color-paper-dim)',
                  borderBottom: active ? '2px solid var(--color-orange)' : '2px solid transparent',
                  transition: 'color 0.15s, border-color 0.15s',
                  marginBottom: '-2px',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-paper)'
                    ;(e.currentTarget as HTMLAnchorElement).style.borderBottomColor =
                      'var(--color-asphalt-mid)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-paper-dim)'
                    ;(e.currentTarget as HTMLAnchorElement).style.borderBottomColor = 'transparent'
                  }
                }}
              >
                <Icon size={14} strokeWidth={2} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            )
          })}
          
          {user && (
            <Link
              href="/my-reports"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.375rem 0.875rem',
                fontFamily: 'var(--font-display)',
                fontWeight: pathname === '/my-reports' ? 700 : 600,
                fontSize: '0.8125rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: pathname === '/my-reports' ? 'var(--color-orange)' : 'var(--color-paper-dim)',
                borderBottom: pathname === '/my-reports' ? '2px solid var(--color-orange)' : '2px solid transparent',
                transition: 'color 0.15s, border-color 0.15s',
                marginBottom: '-2px',
              }}
              onMouseEnter={(e) => {
                if (pathname !== '/my-reports') {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-paper)'
                  ;(e.currentTarget as HTMLAnchorElement).style.borderBottomColor =
                    'var(--color-asphalt-mid)'
                }
              }}
              onMouseLeave={(e) => {
                if (pathname !== '/my-reports') {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'var(--color-paper-dim)'
                  ;(e.currentTarget as HTMLAnchorElement).style.borderBottomColor = 'transparent'
                }
              }}
            >
              <UserIcon size={14} strokeWidth={2} />
              <span className="hidden sm:inline">My Reports</span>
            </Link>
          )}

          {/* Auth section */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem', paddingLeft: '1rem', borderLeft: '1px solid var(--color-asphalt-mid)' }}>
            {user ? (
              <>
                <span style={{ 
                  fontFamily: 'var(--font-body)', 
                  fontSize: '0.75rem', 
                  color: 'var(--color-paper-dim)',
                  maxWidth: '120px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-orange)',
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                style={{
                  color: 'var(--color-paper)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                }}
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
