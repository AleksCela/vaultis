'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '⬡' },
  { href: '/send', label: 'Send', icon: '↗' },
  { href: '/transactions', label: 'History', icon: '≡' },
  { href: '/profile', label: 'Profile', icon: '◉' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex"
      style={{
        background: 'rgba(10,14,26,0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(201,168,76,0.15)',
      }}
    >
      {NAV.map(item => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px] transition-colors"
            style={{ color: active ? '#c9a84c' : '#8892a4' }}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
