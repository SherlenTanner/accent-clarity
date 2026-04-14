'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const T = {
  teal: '#1a7a7a', tealDk: '#145f5f', tealLt: '#e8f5f5',
  ink: '#1a1a2e', text: '#2d2d2d', muted: '#6b7280',
  border: '#e5e7eb', bg: '#f8fafb', white: '#ffffff',
  danger: '#ef4444',
  font: '"DM Sans", system-ui, sans-serif',
  serif: '"Cormorant Garamond", Georgia, serif',
} as const

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { supabase.auth.signOut().catch(() => {}) }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }
    const { data: student } = await supabase.from('students').select('role').eq('email', email).single()
    if (student?.role === 'admin') router.push('/admin')
    else router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(135deg, ${T.ink} 0%, #1a3a4a 60%, #0e2a2a 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.font, padding: '2rem' }}>
      <div style={{ background: T.white, borderRadius: 24, padding: '3rem 2.5rem', width: '100%', maxWidth: 400, textAlign: 'center' as const, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ width: 64, height: 64, background: T.teal, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', margin: '0 auto 1.2rem' }}>🎙️</div>

        <div style={{ fontFamily: T.serif, fontSize: '1.6rem', fontWeight: 600, color: T.teal, marginBottom: 2 }}>LangSolution</div>
        <div style={{ fontSize: '0.85rem', color: T.muted, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' as const, marginBottom: '2rem' }}>Accent Clarity</div>

        <form onSubmit={handleLogin}>
          {error && (
            <div style={{ background: '#fef2f2', border: `1px solid ${T.danger}`, color: T.danger, borderRadius: 10, padding: '0.6rem 1rem', fontSize: '0.82rem', marginBottom: '1rem', textAlign: 'left' as const }}>{error}</div>
          )}

          <div style={{ textAlign: 'left' as const, marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.text, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com" required autoComplete="email"
              style={{ width: '100%', padding: '0.75rem 1rem', border: `1px solid ${T.border}`, borderRadius: 10, fontSize: '0.9rem', fontFamily: T.font, outline: 'none', background: T.bg, boxSizing: 'border-box' as const }}
            />
          </div>

          <div style={{ textAlign: 'left' as const, marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: T.text, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.06em' }}>Password</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" required autoComplete="current-password"
              style={{ width: '100%', padding: '0.75rem 1rem', border: `1px solid ${T.border}`, borderRadius: 10, fontSize: '0.9rem', fontFamily: T.font, outline: 'none', background: T.bg, boxSizing: 'border-box' as const }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '0.85rem', background: T.teal, color: 'white',
            border: 'none', borderRadius: 10, fontFamily: T.font, fontSize: '0.9rem',
            fontWeight: 600, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
          }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', fontSize: '0.7rem', color: T.muted, letterSpacing: '0.05em' }}>LangSolution Accent Clarity — v1.0</p>
      </div>
    </div>
  )
}
