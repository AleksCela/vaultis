'use client'

import { useEffect, useState } from 'react'

interface RiskEvent {
  id: string
  userId: string
  transactionId: string | null
  score: number
  flags: string
  action: string
  createdAt: string
}

const ACTION_COLOR: Record<string, string> = {
  ALLOW: '#22c55e',
  STEP_UP_PIN: '#f59e0b',
  STEP_UP_BIOMETRIC: '#f97316',
  COOLING_OFF: '#60a5fa',
  ADMIN_QUEUE: '#ef4444',
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<RiskEvent[]>([])

  useEffect(() => {
    fetch('/api/admin/events').then(r => r.json()).then(d => setEvents(Array.isArray(d) ? d : []))
  }, [])

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Risk Events</h1>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>
          Pseudonymized feed — user IDs show first 8 characters only
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
              {['Time', 'User', 'Score', 'Action', 'Flags'].map(h => (
                <th key={h} className="text-left py-3 px-3 text-xs font-medium uppercase tracking-wide" style={{ color: '#8892a4' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {events.map(ev => {
              const flags = (() => { try { return JSON.parse(ev.flags) } catch { return [] } })()
              const riskColor = ev.score >= 90 ? '#ef4444' : ev.score >= 56 ? '#f59e0b' : '#22c55e'
              const actionColor = ACTION_COLOR[ev.action] ?? '#8892a4'

              return (
                <tr
                  key={ev.id}
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-3 font-mono text-xs" style={{ color: '#4a5568' }}>
                    {new Date(ev.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-mono text-xs" style={{ color: '#8892a4' }}>
                    {ev.userId}…
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className="font-mono text-sm font-semibold"
                      style={{ color: riskColor }}
                    >
                      {ev.score}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className="badge text-xs"
                      style={{
                        background: `${actionColor}22`,
                        color: actionColor,
                        border: `1px solid ${actionColor}44`,
                      }}
                    >
                      {ev.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs" style={{ color: '#8892a4' }}>
                    {flags.map((f: { label: string }) => f.label).slice(0, 3).join(', ')}
                    {flags.length > 3 && <span style={{ color: '#4a5568' }}> +{flags.length - 3}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {events.length === 0 && (
          <div className="card p-12 text-center mt-4">
            <p className="text-sm" style={{ color: '#8892a4' }}>No risk events recorded yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
