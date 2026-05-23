'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function BiometricStepUpInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const txId = searchParams.get('txId') ?? ''
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleBiometric() {
    setStatus('loading')
    setError('')
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser')
      const optRes = await fetch('/api/webauthn/auth/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txId }),
      })
      if (!optRes.ok) {
        const d = await optRes.json()
        throw new Error(d.error)
      }
      const options = await optRes.json()
      const authResp = await startAuthentication({ optionsJSON: options })
      const verRes = await fetch('/api/webauthn/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...authResp, txId }),
      })
      if (!verRes.ok) {
        const d = await verRes.json()
        throw new Error(d.error)
      }
      router.push('/transactions?success=1')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Biometric verification failed'
      setError(msg)
      setStatus('error')
    }
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
          <div className="text-5xl mb-1">
            {status === 'loading' ? '⏳' : status === 'error' ? '❌' : '🔐'}
          </div>
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono mb-3"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}
            >
              STEP-UP REQUIRED · BIOMETRIC
            </div>
            <h1 className="font-serif text-2xl mb-1">Biometric Verification</h1>
            <p className="text-sm" style={{ color: '#8892a4' }}>
              Our fraud engine flagged this transfer as high-risk. EU PSD2 Strong Customer Authentication requires biometric confirmation.
            </p>
          </div>
        </div>

        {/* Why this is happening */}
        <div className="card p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#c9a84c' }}>Why Biometric Is Required</p>
          <div className="space-y-2 text-xs" style={{ color: '#8892a4' }}>
            <div className="flex items-start gap-2">
              <span className="text-amber-400 shrink-0">⚠</span>
              <p>Your transfer risk score exceeded the biometric threshold (56–75 pts) based on one or more signals: device, location, amount, or velocity.</p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: '#c9a84c' }} className="shrink-0">⚖️</span>
              <p>Under <strong style={{ color: '#f0f0f0' }}>EU PSD2 Directive (SCA)</strong>, high-value or anomalous transfers require Strong Customer Authentication — something you <em>are</em> (biometric) or something you <em>know</em> (PIN).</p>
            </div>
            <div className="flex items-start gap-2">
              <span style={{ color: '#22c55e' }} className="shrink-0">🛡</span>
              <p>Biometric data never leaves your device. We verify via <strong style={{ color: '#f0f0f0' }}>WebAuthn (W3C standard)</strong> — no raw fingerprint or face data is stored or transmitted.</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="text-sm px-3 py-2.5 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleBiometric}
            disabled={status === 'loading'}
            className="btn-gold w-full py-4 text-base"
          >
            {status === 'loading' ? 'Waiting for biometric…' : 'Verify with Face ID / Fingerprint'}
          </button>
          <button onClick={cancel} className="btn-ghost w-full">
            Cancel Transfer
          </button>
        </div>

        <p className="text-center text-xs" style={{ color: '#4a5568' }}>
          GDPR Art. 6(1)(f) · WebAuthn W3C · No biometric data stored server-side
        </p>
      </div>
    </div>
  )
}

export default function BiometricStepUpPage() {
  return <Suspense><BiometricStepUpInner /></Suspense>
}
