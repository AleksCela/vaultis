'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import CountUp from '@/components/CountUp'
import StatusBadge from '@/components/StatusBadge'
import { formatIban } from '@/lib/iban'

interface User {
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

  useEffect(() => {
    fetch('/api/user/me').then(r => r.json()).then(d => { setUser(d); setUserId(d.id) })
    fetch('/api/transactions').then(r => r.json()).then(d => setTxs(Array.isArray(d) ? d.slice(0, 3) : []))
  }, [])

  return (
    <div className="px-4 pt-8 space-y-6 max-w-lg mx-auto">
      {/* Greeting */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm" style={{ color: '#8892a4' }}>Good {getGreeting()},</p>
          <h1 className="font-serif text-2xl mt-0.5">{user?.fullName?.split(' ')[0] ?? '—'}</h1>
        </div>
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
          style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}
        >
          {user?.fullName?.[0] ?? '?'}
        </div>
      </div>

      {/* Balance card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: '#8892a4' }}>Total Balance</p>
          <span className="badge badge-green text-xs">● Active</span>
        </div>

        <div className="font-mono text-4xl font-semibold" style={{ color: '#c9a84c' }}>
          {user ? <CountUp to={user.balance} prefix="€" /> : '—'}
        </div>

        <div className="pt-2 border-t" style={{ borderColor: 'rgba(201,168,76,0.15)' }}>
          <p className="text-xs" style={{ color: '#8892a4' }}>IBAN</p>
          <p className="font-mono text-sm mt-0.5" style={{ color: '#f0f0f0' }}>
            {user ? formatIban(user.iban) : '—'}
          </p>
        </div>
      </div>

      {/* Setup Secure Transactions CTA — shown only when biometrics not registered */}
      {user && !user.hasWebAuthn && (
        <div
          className="animate-gold-glow rounded-xl p-5 space-y-3 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(10,14,26,0.97) 60%, rgba(201,168,76,0.06) 100%)',
            border: '1.5px solid rgba(201,168,76,0.5)',
          }}
        >
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 blur-sm"
            style={{ background: 'rgba(201,168,76,0.7)' }}
          />

          <div className="flex items-center gap-3">
            <span className="text-3xl">🔐</span>
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono mb-0.5"
                style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#c9a84c' }} />
                ACTION REQUIRED
              </div>
              <h2 className="font-serif text-lg leading-tight" style={{ color: '#c9a84c' }}>
                Setup Secure Transactions
              </h2>
            </div>
          </div>

          <p className="text-sm leading-relaxed" style={{ color: '#8892a4' }}>
            Biometric auth isn&apos;t set up. High-risk transfers will require extra PIN steps.
            Register Face ID or fingerprint to lower your risk score and speed up approvals.
          </p>

          <div className="flex flex-wrap gap-2">
            {['Reduces risk score', 'PSD2 SCA compliant', 'On-device only — never uploaded'].map(tag => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full font-mono"
                style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.2)', color: '#8892a4' }}
              >
                {tag}
              </span>
            ))}
          </div>

          <Link href="/profile" className="btn-gold w-full text-center block py-3 text-sm">
            🔐 Setup Biometric Authentication →
          </Link>
        </div>
      )}

      {/* Send CTA */}
      <Link href="/send" className="btn-gold w-full text-center block py-4 text-base">
        ↗ Send Money
      </Link>

      {/* Recent transactions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: '#8892a4' }}>Recent</h2>
          <Link href="/transactions" className="text-xs" style={{ color: '#c9a84c' }}>See all</Link>
        </div>

        {txs.length === 0 ? (
          <div className="card p-6 text-center text-sm" style={{ color: '#8892a4' }}>
            No transactions yet
          </div>
        ) : (
          <div className="space-y-2">
            {txs.map(tx => {
              const isSender = tx.senderId === userId
              const counterparty = isSender ? tx.receiver.fullName : tx.sender.fullName
              const sign = isSender ? '-' : '+'
              const color = isSender ? '#f0f0f0' : '#22c55e'

              return (
                <div key={tx.id} className="card card-hover p-4 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{counterparty}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#8892a4' }}>
                      {tx.description || (isSender ? 'Transfer sent' : 'Transfer received')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold" style={{ color }}>
                      {sign}€{tx.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-1"><StatusBadge status={tx.status} /></div>
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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}
