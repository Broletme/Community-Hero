'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NavBar from '../components/NavBar'
import { getSupabaseBrowserClient } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })
      
      if (error) throw error
      
      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })
      if (error) throw error
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <NavBar />
      <main style={{ flex: 1, background: 'var(--color-asphalt)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: 400, width: '100%', background: 'var(--color-asphalt-light)', padding: '2rem', border: '1px solid var(--color-asphalt-mid)', borderRadius: '0.25rem' }}>
          
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.75rem', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-paper)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Sign Up
          </h1>
          
          {error && (
            <div style={{ border: '1px solid var(--color-sev-high)', padding: '0.625rem 0.875rem', color: 'var(--color-sev-high)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              ✕ {error}
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="field-label">Email</label>
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
            
            <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
              {loading ? <span className="spinner" /> : 'Create Account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-asphalt-mid)' }} />
            <span style={{ padding: '0 1rem', fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', color: 'var(--color-paper-dark)' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--color-asphalt-mid)' }} />
          </div>

          <button onClick={handleGoogleLogin} className="btn-secondary" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
            Continue with Google
          </button>

          <p style={{ marginTop: '1.5rem', textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '0.875rem', color: 'var(--color-paper-dim)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--color-orange)', textDecoration: 'none', fontWeight: 600 }}>
              Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
