'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function PinStepUpInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const txId = searchParams.get('txId') ?? ''
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length !== 4) { setError('Enter your 4-digit PIN'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/transactions/pin-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId, pin }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    router.push('/transactions?success=1')
  }

  async function cancel() {
    await fetch('/api/transactions/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txId }),
    })
    router.push('/send')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ zIndex: 1, position: 'relative' }}>
      <div className="w-full max-w-sm space-y-5">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="text-4xl mb-1">🔒</div>
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono mb-3"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
            >
              STEP-UP REQUIRED · PIN
            </div>
            <h1 className="font-serif text-2xl mb-1">Enter Your PIN</h1>
            <p className="text-sm" style={{ color: '#8892a4' }}>
              Our fraud engine flagged this transfer as elevated-risk. A PIN step-up is required before it can proceed.
            </p>
          </div>
        </div>

        {/* Why this is happening */}
        <div className="card p-4 space-y-2 text-xs" style={{ color: '#8892a4' }}>
          <p className="font-semibold uppercase tracking-wider text-xs" style={{ color: '#c9a84c' }}>Why PIN Is Required</p>
          <div className="flex items-start gap-2">
            <span className="text-amber-400 shrink-0">⚠</span>
            <p>This transfer scored 31–55 on our 9-signal risk engine, triggering a mandatory PIN step-up under our fraud prevention policy.</p>
          </div>
          <div className="flex items-start gap-2">
            <span style={{ color: '#c9a84c' }} className="shrink-0">⚖️</span>
            <p><strong style={{ color: '#f0f0f0' }}>EU PSD2 SCA</strong> requires re-authentication for anomalous transactions. PIN = "something you know" in the SCA framework.</p>
          </div>
          <div className="flex items-start gap-2">
            <span style={{ color: '#22c55e' }} className="shrink-0">🛡</span>
            <p>Your PIN is stored as a <strong style={{ color: '#f0f0f0' }}>bcrypt hash</strong> — we verify the hash, never the raw value. It cannot be recovered or read by anyone.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8892a4' }}>4-Digit PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              className="input-field font-mono tracking-[0.5em] text-center text-xl"
              placeholder="••••"
              value={pin}
              onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              autoFocus
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || pin.length !== 4} className="btn-gold w-full">
            {loading ? 'Verifying…' : 'Verify & Complete Transfer'}
          </button>
          <button type="button" onClick={cancel} className="btn-ghost w-full">
            Cancel Transfer
          </button>
        </form>

        <p className="text-center text-xs" style={{ color: '#4a5568' }}>
          GDPR Art. 6(1)(f) · bcrypt hashed · PSD2 SCA compliant
        </p>
      </div>
    </div>
  )
}

export default function PinStepUpPage() {
  return <Suspense><PinStepUpInner /></Suspense>
}
