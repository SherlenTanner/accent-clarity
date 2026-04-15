'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { CSSProperties } from 'react'

const T = {
  teal: '#1a7a7a', tealLt: '#e8f5f5',
  ink: '#1a1a2e', muted: '#6b7280',
  border: '#e5e7eb', white: '#ffffff',
  success: '#10b981', danger: '#ef4444',
  font: '"DM Sans", system-ui, sans-serif',
} as const

const NAV = [
  { href: '/dashboard', icon: '👋', label: 'Welcome' },
  { href: '/lesson',    icon: '📚', label: 'Lessons' },
  { href: '/fluency',   icon: '🎯', label: 'Fluency' },
  { href: '/sounds',    icon: '🔊', label: 'Sounds' },
  { href: '/notes',     icon: '📝', label: 'Notes' },
  { href: '/account',   icon: '👤', label: 'Account' },
]

interface SidebarProps { isAdmin?: boolean }

export default function Sidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sidebarStyle: CSSProperties = {
    width: 80, height: '100vh', position: 'fixed', left: 0, top: 0,
    background: T.white, borderRight: `1px solid ${T.border}`,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '1.2rem 0', zIndex: 100, fontFamily: T.font,
  }

  const logoStyle: CSSProperties = {
    width: 46, height: 46, background: T.teal, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.4rem', marginBottom: '0.5rem',
  }

  const dividerStyle: CSSProperties = {
    width: 36, height: 1, background: T.border, margin: '0.5rem 0 1rem',
  }

  const navItem = (active: boolean): CSSProperties => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 4, padding: '0.85rem 0', width: '100%', cursor: 'pointer',
    textDecoration: 'none', color: active ? T.teal : T.muted,
    fontSize: '1rem', fontWeight: 600, position: 'relative',
    background: 'none', border: 'none', fontFamily: T.font,
  })

  const activeBar: CSSProperties = {
    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
    width: 3, height: 32, background: T.teal, borderRadius: '0 3px 3px 0',
  }

  const items = isAdmin
    ? [...NAV, { href: '/admin', icon: '⚙️', label: 'Admin' }]
    : NAV

  return (
    <aside style={sidebarStyle}>
      <div style={logoStyle}>🎙️</div>
      <div style={dividerStyle} />
      {items.map(item => {
        const active = pathname === item.href
        return (
          <Link key={item.href + item.label} href={item.href} style={navItem(active)} title={item.label}>
            {active && <div style={activeBar} />}
            <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{item.icon}</span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</span>
          </Link>
        )
      })}
      <div style={{ flex: 1 }} />
      <button onClick={handleLogout} style={navItem(false)} title="Sign Out">
        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>🚪</span>
        <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sign Out</span>
      </button>
    </aside>
  )
}