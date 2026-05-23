'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CountUp from '@/components/CountUp'
import StatusBadge from '@/components/StatusBadge'
import { formatIban } from '@/lib/iban'

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved) {
      setTheme(saved)
    } else {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    }
  }, [])

  function toggle() {
    const next = (theme ?? 'light') === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  return { theme, toggle }
}

interface User {
  id: string
  fullName: string
  iban: string
  balance: number
  hasWebAuthn: boolean
}

interface Tx {
  id: string
  amount: number
  status: string
  description: string | null
  createdAt: string
  sender: { fullName: string; iban: string }
  receiver: { fullName: string; iban: string }
  senderId: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [txs, setTxs] = useState<Tx[]>([])
  const [userId, setUserId] = useState('')
  const [greeting, setGreeting] = useState('')
  const { theme, toggle } = useTheme()

  useEffect(() => {
    setGreeting(getGreeting())
    fetch('/api/user/me').then(r => r.json()).then(d => { setUser(d); setUserId(d.id) })
    fetch('/api/transactions').then(r => r.json()).then(d => setTxs(Array.isArray(d) ? d : []))
  }, [])

  const now = new Date()
  const thisMonth = txs.filter(tx => {
    const d = new Date(tx.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })

  const spentThisMonth = thisMonth
    .filter(tx => tx.senderId === userId && tx.status === 'COMPLETED')
    .reduce((s, tx) => s + tx.amount, 0)

  const receivedThisMonth = thisMonth
    .filter(tx => tx.senderId !== userId && tx.status === 'COMPLETED')
    .reduce((s, tx) => s + tx.amount, 0)

  const recentTxs = txs.slice(0, 4)

  return (
    <div className="px-4 pt-8 pb-2 space-y-5 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            {greeting}
          </p>
          <h1 className="text-xl font-semibold mt-0.5 tracking-tight" style={{ color: 'var(--text)' }}>
            {user?.fullName?.split(' ')[0] ?? '—'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
            aria-label="Toggle theme"
          >
            {theme === null ? null : theme === 'dark' ? (
              <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
            style={{ background: 'var(--blue)', color: '#fff', boxShadow: '0 2px 8px var(--blue-dim)' }}
          >
            {user?.fullName?.[0] ?? '?'}
          </div>
        </div>
      </div>

      {/* Balance card */}
      <div
        className="rounded-2xl p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 55%, #2563eb 100%)',
          boxShadow: '0 8px 32px rgba(29,78,216,0.3), 0 2px 8px rgba(29,78,216,0.2)',
        }}
      >
        <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="absolute -right-2 top-16 w-28 h-28 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute left-1/3 -bottom-8 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.03)' }} />

        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Available Balance
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Current Account · EUR
              </p>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.9)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#4ade80' }} />
              Active
            </div>
          </div>

          <div className="font-mono text-[2.6rem] font-bold text-white leading-none">
            {user ? <CountUp to={user.balance} prefix="€" /> : <span style={{ opacity: 0.4 }}>—</span>}
          </div>

          <div
            className="pt-4 flex items-end justify-between"
            style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}
          >
            <div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>IBAN</p>
              <p className="font-mono text-sm mt-0.5 tracking-wider" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {user ? formatIban(user.iban) : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>Account holder</p>
              <p className="text-sm mt-0.5 font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {user?.fullName ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label="Spent"
          value={spentThisMonth > 0
            ? `€${spentThisMonth.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : '—'}
          sub="This month"
          accent="var(--red)"
        />
        <StatCard
          label="Received"
          value={receivedThisMonth > 0
            ? `€${receivedThisMonth.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
            : '—'}
          sub="This month"
          accent="var(--green)"
        />
        <StatCard
          label="Transfers"
          value={txs.length > 0 ? String(txs.length) : '—'}
          sub="All time"
          accent="var(--blue)"
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-4 gap-2.5">
        <ActionButton icon={<SendIcon />} label="Send" href="/send" primary />
        <ActionButton icon={<HistoryIcon />} label="Activity" href="/transactions" />
        <ActionButton icon={<UserIcon />} label="Profile" href="/profile" />
        <ActionButton icon={<ShieldIcon />} label="Security" href="/profile" />
      </div>

      {/* Biometric CTA */}
      {user && !user.hasWebAuthn && (
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            background: 'var(--surface)',
            border: '1.5px solid var(--blue)',
            boxShadow: '0 2px 12px var(--blue-dim)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--blue-dim)' }}
          >
            <LockIcon />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
              Enable biometric authentication
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Required for transfers above €500
            </p>
          </div>
          <Link
            href="/profile"
            className="text-xs font-semibold shrink-0 px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--blue)', color: '#fff' }}
          >
            Set up
          </Link>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Recent activity</h2>
          <Link
            href="/transactions"
            className="text-xs font-semibold"
            style={{ color: 'var(--blue)' }}
          >
            View all
          </Link>
        </div>

        {recentTxs.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No transactions yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>Your activity will appear here</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            {recentTxs.map((tx, i) => {
              const isSender = tx.senderId === userId
              const counterparty = isSender ? tx.receiver.fullName : tx.sender.fullName
              const sign = isSender ? '-' : '+'
              const amountColor = isSender ? 'var(--text)' : 'var(--green)'
              const avatarBg = isSender ? 'var(--red-dim)' : 'var(--green-dim)'
              const avatarColor = isSender ? 'var(--red)' : 'var(--green)'

              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
                    style={{ background: avatarBg, color: avatarColor }}
                  >
                    {counterparty[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{counterparty}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      {tx.description || (isSender ? 'Transfer sent' : 'Transfer received')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold" style={{ color: amountColor }}>
                      {sign}€{tx.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-0.5 flex justify-end">
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="card p-3.5">
      <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-mono text-base font-bold mt-1.5 tracking-tight" style={{ color: accent }}>{value}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{sub}</p>
    </div>
  )
}

function ActionButton({ icon, label, href, primary }: { icon: React.ReactNode; label: string; href: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl transition-all"
      style={{
        background: primary ? 'var(--blue)' : 'var(--surface)',
        border: primary ? 'none' : '1px solid var(--border)',
        boxShadow: primary ? '0 2px 8px var(--blue-dim)' : 'var(--shadow-sm)',
      }}
    >
      <span style={{ color: primary ? '#fff' : 'var(--text-muted)' }}>{icon}</span>
      <span className="text-[11px] font-semibold" style={{ color: primary ? '#fff' : 'var(--text-muted)' }}>{label}</span>
    </Link>
  )
}

function SendIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: 'var(--blue)' }}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}
