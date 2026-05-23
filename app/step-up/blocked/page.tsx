'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import RiskCard from '@/components/RiskCard'

interface TxDetail {
  id: string
  riskScore: number
  riskFlags: string
  riskAction: string
  amount: number
  receiver: { fullName: string }
  adminNote: string | null
}

function BlockedInner() {
  const searchParams = useSearchParams()
  const txId = searchParams.get('txId') ?? ''
  const [tx, setTx] = useState<TxDetail | null>(null)

  useEffect(() => {
    fetch('/api/transactions').then(r => r.json()).then((txs: TxDetail[]) => {
      const found = txs.find(t => t.id === txId)
      if (found) setTx(found)
    })
  }, [txId])

  const flags = tx ? (() => { try { return JSON.parse(tx.riskFlags) } catch { return [] } })() : []

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ zIndex: 1, position: 'relative' }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🔍</div>
          <h1 className="font-serif text-2xl mb-2">Transfer Under Review</h1>
          <p className="text-sm" style={{ color: '#8892a4' }}>
            Our team will review this transfer within minutes. You will be notified of the outcome.
          </p>
          {tx && (
            <p className="text-sm mt-3" style={{ color: '#8892a4' }}>
              €{tx.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} → {tx.receiver?.fullName}
            </p>
          )}
        </div>

        {tx && flags.length > 0 && (
          <RiskCard score={tx.riskScore} flags={flags} action={tx.riskAction} />
        )}

        {tx?.adminNote && (
          <div className="card p-4 text-sm" style={{ color: '#8892a4' }}>
            <span className="font-medium" style={{ color: '#f0f0f0' }}>Note: </span>
            {tx.adminNote}
          </div>
        )}

        <Link href="/transactions" className="btn-ghost w-full text-center block">
          View All Transactions
        </Link>
      </div>
    </div>
  )
}

export default function BlockedPage() {
  return <Suspense><BlockedInner /></Suspense>
}
