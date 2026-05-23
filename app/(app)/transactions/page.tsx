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
        <div className="px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>
          ✓ Transfer completed successfully
        </div>
      )}

      {txs.length === 0 ? (
        <div className="card p-8 text-center" style={{ color: '#8892a4' }}>
          <p className="text-2xl mb-2">📭</p>
          <p className="text-sm">No transactions yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {txs.map(tx => {
            const isSender = tx.senderId === userId
            const counterparty = isSender ? tx.receiver.fullName : tx.sender.fullName
            const sign = isSender ? '-' : '+'
            const color = isSender ? '#f0f0f0' : '#22c55e'
            const isExpanded = expanded === tx.id
            const flags = (() => { try { return JSON.parse(tx.riskFlags) } catch { return [] } })()
            const showRisk = tx.riskScore > 0 && flags.length > 0

            return (
              <div key={tx.id} className="card card-hover overflow-hidden">
                <button
                  className="w-full p-4 flex items-center justify-between gap-3 text-left"
                  onClick={() => setExpanded(isExpanded ? null : tx.id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{counterparty}</p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: '#8892a4' }}>
                      {tx.description || (isSender ? 'Transfer sent' : 'Transfer received')}
                    </p>
                    <p className="text-xs mt-1" style={{ color: '#4a5568' }}>
                      {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-sm font-semibold" style={{ color }}>
                      {sign}€{tx.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })}
                    </p>
                    <div className="mt-1"><StatusBadge status={tx.status} /></div>
                  </div>
                </button>

                {isExpanded && showRisk && (
                  <div className="px-4 pb-4">
                    <RiskCard score={tx.riskScore} flags={flags} action={tx.riskAction} />
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
    <div className="px-4 pt-8 space-y-4 max-w-lg mx-auto">
      <h1 className="font-serif text-2xl">Transactions</h1>
      <Suspense>
        <TransactionsList />
      </Suspense>
    </div>
  )
}
