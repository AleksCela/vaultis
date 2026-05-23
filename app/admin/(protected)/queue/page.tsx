'use client'

import { useEffect, useState } from 'react'
import RiskCard from '@/components/RiskCard'

interface QueueTx {
  id: string
  amount: number
  description: string | null
  riskScore: number
  riskFlags: string
  riskAction: string
  createdAt: string
  sender: { fullName: string; email: string; iban: string }
  receiver: { fullName: string; iban: string; country: string }
}

export default function AdminQueuePage() {
  const [queue, setQueue] = useState<QueueTx[]>([])
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch('/api/admin/queue').then(r => r.json()).then(d => setQueue(Array.isArray(d) ? d : []))
  }, [])

  async function act(txId: string, action: 'approve' | 'reject') {
    setLoading(prev => ({ ...prev, [txId]: true }))
    await fetch(`/api/admin/queue/${txId}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: notes[txId] || undefined }),
    })
    setQueue(prev => prev.filter(t => t.id !== txId))
    setLoading(prev => ({ ...prev, [txId]: false }))
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="font-serif text-3xl">Review Queue</h1>
        <p className="text-sm mt-1" style={{ color: '#8892a4' }}>
          {queue.length} transfer{queue.length !== 1 ? 's' : ''} awaiting manual review
        </p>
      </div>

      {queue.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm" style={{ color: '#8892a4' }}>Queue is empty — all transfers reviewed</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-2xl">
          {queue.map(tx => {
            const flags = (() => { try { return JSON.parse(tx.riskFlags) } catch { return [] } })()
            return (
              <div key={tx.id} className="card p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{tx.sender.fullName}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: '#8892a4' }}>{tx.sender.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xl font-semibold" style={{ color: '#c9a84c' }}>
                      €{tx.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Transfer details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="card p-3">
                    <p className="text-xs mb-1" style={{ color: '#8892a4' }}>Recipient</p>
                    <p className="font-medium">{tx.receiver.fullName}</p>
                    <p className="font-mono text-xs mt-0.5" style={{ color: '#4a5568' }}>{tx.receiver.iban}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>Country: {tx.receiver.country}</p>
                  </div>
                  <div className="card p-3">
                    <p className="text-xs mb-1" style={{ color: '#8892a4' }}>Description</p>
                    <p>{tx.description || '—'}</p>
                  </div>
                </div>

                {/* Risk card */}
                <RiskCard score={tx.riskScore} flags={flags} action={tx.riskAction} />

                {/* Note */}
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: '#8892a4' }}>Note (optional)</label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    placeholder="Reason for decision…"
                    value={notes[tx.id] || ''}
                    onChange={e => setNotes(prev => ({ ...prev, [tx.id]: e.target.value }))}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => act(tx.id, 'approve')}
                    disabled={loading[tx.id]}
                    className="btn-gold flex-1"
                  >
                    {loading[tx.id] ? '…' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => act(tx.id, 'reject')}
                    disabled={loading[tx.id]}
                    className="flex-1 py-3 rounded-lg text-sm font-medium transition-colors"
                    style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                  >
                    {loading[tx.id] ? '…' : '✗ Reject'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
