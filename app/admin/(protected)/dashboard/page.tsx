'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Stats {
  totalUsers: number
  totalTransactions: number
  pendingQueue: number
  blockedCount: number
  riskEventsToday: number
}

interface RiskEvent {
  id: string
  userId: string
  score: number
  flags: string
  action: string
  createdAt: string
  transactionId: string | null
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [events, setEvents] = useState<RiskEvent[]>([])

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats)
    fetch('/api/admin/events').then(r => r.json()).then(d => setEvents(Array.isArray(d) ? d.slice(0, 10) : []))
  }, [])

  const STAT_CARDS = stats
    ? [
        { label: 'Total Users', value: stats.totalUsers, color: '#c9a84c' },
        { label: 'Transactions', value: stats.totalTransactions, color: '#60a5fa' },
        { label: 'Pending Review', value: stats.pendingQueue, color: '#f59e0b', href: '/admin/queue' },
        { label: 'Blocked', value: stats.blockedCount, color: '#ef4444' },
        { label: 'Risk Events Today', value: stats.riskEventsToday, color: '#a78bfa' },
      ]
    : []

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="font-serif text-3xl">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>Fraud detection overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {STAT_CARDS.map(s => (
          <div key={s.label} className="card p-4">
            {s.href ? (
              <Link href={s.href} className="block">
                <p className="text-xs mb-1" style={{ color: '#8892a4' }}>{s.label}</p>
                <p className="font-mono text-3xl font-semibold" style={{ color: s.color }}>{s.value}</p>
              </Link>
            ) : (
              <>
                <p className="text-xs mb-1" style={{ color: '#8892a4' }}>{s.label}</p>
                <p className="font-mono text-3xl font-semibold" style={{ color: s.color }}>{s.value}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Pending queue alert */}
      {stats && stats.pendingQueue > 0 && (
        <Link
          href="/admin/queue"
          className="flex items-center justify-between p-4 rounded-xl"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <span style={{ color: '#f59e0b' }}>
            ⚑ {stats.pendingQueue} transfer{stats.pendingQueue !== 1 ? 's' : ''} awaiting manual review
          </span>
          <span style={{ color: '#f59e0b' }}>Review →</span>
        </Link>
      )}

      {/* Live risk feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Risk Events</h2>
          <Link href="/admin/events" className="text-sm" style={{ color: '#c9a84c' }}>See all</Link>
        </div>
        <div className="space-y-2">
          {events.map(ev => {
            const flags = (() => { try { return JSON.parse(ev.flags) } catch { return [] } })()
            const riskColor = ev.score >= 90 ? '#ef4444' : ev.score >= 56 ? '#f59e0b' : '#22c55e'
            return (
              <div key={ev.id} className="card p-3 flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm font-semibold shrink-0"
                  style={{ background: `${riskColor}22`, color: riskColor }}
                >
                  {ev.score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono" style={{ color: '#8892a4' }}>
                    User {ev.userId} · {ev.action}
                  </p>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#4a5568' }}>
                    {flags.map((f: { label: string }) => f.label).join(' · ')}
                  </p>
                </div>
                <p className="text-xs shrink-0" style={{ color: '#4a5568' }}>
                  {new Date(ev.createdAt).toLocaleTimeString()}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
