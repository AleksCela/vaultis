'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import RiskCard from '@/components/RiskCard'

interface TxDetail {
  riskScore: number
  riskFlags: string
  riskAction: string
  cooldownEndsAt: string | null
  amount: number
  receiver: { fullName: string }
}

function CoolingOffInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const txId = searchParams.get('txId') ?? ''
  const [tx, setTx] = useState<TxDetail | null>(null)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    fetch('/api/transactions').then(r => r.json()).then((txs: (TxDetail & { id: string })[]) => {
      const found = txs.find(t => t.id === txId)
      if (found) setTx(found)
    })
  }, [txId])

  useEffect(() => {
    if (!tx?.cooldownEndsAt) return
    const tick = () => {
      const diff = Math.max(0, Math.ceil((new Date(tx.cooldownEndsAt!).getTime() - Date.now()) / 1000))
      setRemaining(diff)
      if (diff === 0) {
        // Auto-complete
        fetch('/api/transactions/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txId }),
        }).then(() => router.push('/transactions?success=1'))
      }
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tx, txId, router])

  async function cancel() {
    await fetch('/api/transactions/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId }),
    })
    router.push('/send')
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const flags = tx ? (() => { try { return JSON.parse(tx.riskFlags) } catch { return [] } })() : []

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ zIndex: 1, position: 'relative' }}>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-4">⏰</div>
          <h1 className="font-serif text-2xl mb-2">Cooling-Off Period</h1>
          <p className="text-sm" style={{ color: '#8892a4' }}>
            Your transfer is on hold. It will complete automatically when the timer expires.
          </p>
        </div>

        {/* Countdown */}
        <div className="card p-6 text-center">
          <p className="text-xs mb-2 uppercase tracking-wide" style={{ color: '#8892a4' }}>Time remaining</p>
          <p className="font-mono text-5xl font-semibold" style={{ color: '#c9a84c' }}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </p>
          {tx && (
            <p className="text-sm mt-3" style={{ color: '#8892a4' }}>
              €{tx.amount.toLocaleString('de-DE', { minimumFractionDigits: 2 })} → {tx.receiver?.fullName}
            </p>
          )}
        </div>

        {/* Risk card */}
        {tx && flags.length > 0 && (
          <RiskCard score={tx.riskScore} flags={flags} action={tx.riskAction} />
        )}

        <button onClick={cancel} className="btn-ghost w-full">
          Cancel Transfer
        </button>
      </div>
    </div>
  )
}

export default function CoolingOffPage() {
  return <Suspense><CoolingOffInner /></Suspense>
}
