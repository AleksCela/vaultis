'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import RiskCard from '@/components/RiskCard'

interface Tx {
  id: string
  amount: number
  status: string
  description: string | null
  createdAt: string
  riskScore: number
  riskFlags: string
  riskAction: string
  senderId: string
  sender: { fullName: string; iban: string }
  receiver: { fullName: string; iban: string }
}

function TransactionsList() {
  const [txs, setTxs] = useState<Tx[]>([])
  const [userId, setUserId] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const success = searchParams.get('success')

  useEffect(() => {
    fetch('/api/user/me').then(r => r.json()).then(d => setUserId(d.id))
    fetch('/api/transactions').then(r => r.json()).then(d => setTxs(Array.isArray(d) ? d : []))
  }, [])

  return (
    <div className="space-y-4">
      {success && (
        <div
          className="px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2"
          style={{ background: 'var(--green-dim)', border: '1px solid rgba(5,150,105,0.25)', color: 'var(--green)' }}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Transfer completed successfully
        </div>
      )}

      {txs.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'var(--blue-dim)' }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: 'var(--blue)' }}>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>No transactions yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Your transfer history will appear here</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {txs.map((tx, i) => {
            const isSender = tx.senderId === userId
            const counterparty = isSender ? tx.receiver.fullName : tx.sender.fullName
            const sign = isSender ? '-' : '+'
            const amountColor = isSender ? 'var(--text)' : 'var(--green)'
            const avatarBg = isSender ? 'var(--red-dim)' : 'var(--green-dim)'
            const avatarColor = isSender ? 'var(--red)' : 'var(--green)'
            const isExpanded = expanded === tx.id
            const flags = (() => { try { return JSON.parse(tx.riskFlags) } catch { return [] } })()
            const showRisk = tx.riskScore > 0 && flags.length > 0

            return (
              <div key={tx.id} style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}>
                <button
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
                  onClick={() => setExpanded(isExpanded ? null : tx.id)}
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
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                      {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold" style={{ color: amountColor }}>
                      {sign}€{tx.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-1 flex justify-end"><StatusBadge status={tx.status} /></div>
                    {showRisk && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                        {isExpanded ? '↑ hide' : '↓ risk'}
                      </p>
                    )}
                  </div>
                </button>

                {isExpanded && showRisk && (
                  <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--border)' }}>
                    <div className="pt-3">
                      <RiskCard score={tx.riskScore} flags={flags} action={tx.riskAction} />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function TransactionsPage() {
  return (
    <div className="px-4 pt-8 pb-2 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Activity</h1>
      </div>
      <Suspense>
        <TransactionsList />
      </Suspense>
    </div>
  )
}
