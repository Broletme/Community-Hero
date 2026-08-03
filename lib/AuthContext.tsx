'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { getSupabaseBrowserClient } from './supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  // Prevent background network fetch errors (e.g., unreachable Supabase DNS) from popping up red Next.js overlays
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message ?? String(event.reason ?? '')
      if (msg.includes('Failed to fetch') || msg.includes('fetch failed')) {
        console.warn('[CivicTag] Suppressed background fetch error:', event.reason)
        event.preventDefault()
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Fetch initial session
    const initAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }))
        if (mounted) {
          setSession(data?.session ?? null)
          setUser(data?.session?.user ?? null)
        }
      } catch (err) {
        console.warn('Failed to initialize auth:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    // Subscribe to auth changes
    let subscription: { unsubscribe: () => void } | null = null
    try {
      const res = supabase.auth.onAuthStateChange(
        (_event, session) => {
          if (mounted) {
            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)
          }
        }
      )
      subscription = res?.data?.subscription ?? null
    } catch (err) {
      console.warn('Auth state change subscription error:', err)
      if (mounted) setLoading(false)
    }

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
