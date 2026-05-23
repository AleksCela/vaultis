'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '⬡' },
  { href: '/admin/queue', label: 'Review Queue', icon: '⚑' },
  { href: '/admin/events', label: 'Risk Events', icon: '≋' },
]

export default function AdminSidebar({ email, children }: { email: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex" style={{ position: 'relative', zIndex: 1 }}>
      <aside
        className="w-60 shrink-0 flex flex-col py-8 px-4 gap-1"
        style={{ background: '#0a0e1a', borderRight: '1px solid rgba(201,168,76,0.15)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 mb-6">
          <span className="text-2xl" style={{ color: '#c9a84c' }}>⬡</span>
          <div>
            <p className="font-serif text-sm" style={{ color: '#c9a84c' }}>Vaultis</p>
            <p className="text-xs" style={{ color: '#4a5568' }}>Admin Console</p>
          </div>
        </div>

        {/* Navigation */}
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                color: active ? '#c9a84c' : '#8892a4',
                background: active ? 'rgba(201,168,76,0.08)' : undefined,
                borderLeft: active ? '2px solid #c9a84c' : '2px solid transparent',
              }}
            >
              <span className="shrink-0">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}

        {/* Footer */}
        <div className="mt-auto flex flex-col gap-1 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="px-3 py-1 text-xs truncate" style={{ color: '#4a5568' }}>{email}</p>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5 text-left w-full"
            style={{ color: '#4a5568' }}
          >
            <span>↩</span> Sign out
          </button>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-white/5"
            style={{ color: '#4a5568' }}
          >
            <span>↗</span> Client App
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
