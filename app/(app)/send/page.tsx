'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface ReceiverPreview {
  fullName: string
  iban: string
}

export default function SendPage() {
  const router = useRouter()
  const [iban, setIban] = useState('')
  const [receiver, setReceiver] = useState<ReceiverPreview | null>(null)
  const [ibanError, setIbanError] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deviceHash, setDeviceHash] = useState<string | null>(null)
  const [deviceCountry, setDeviceCountry] = useState<string | null>(null)
  const [showConsent, setShowConsent] = useState(false)
  const consentChecked = useRef(false)

  useEffect(() => {
    const consentGiven = sessionStorage.getItem('vaultis_consent')
    if (!consentGiven) {
      setShowConsent(true)
    } else {
      initDevice()
    }
  }, [])

  async function initDevice() {
    try {
      const FP = await import('@fingerprintjs/fingerprintjs')
      const fp = await FP.load()
      const result = await fp.get()
      const encoder = new TextEncoder()
      const data = encoder.encode(result.visitorId)
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      setDeviceHash(hash)
    } catch {
      // Device hash not available — treated as unknown device (higher risk)
    }

    const cached = sessionStorage.getItem('vaultis_country')
    if (cached) {
      setDeviceCountry(cached)
      return
    }
    try {
      await new Promise<void>((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async pos => {
            try {
              const res = await fetch(`https://api.country.is/${pos.coords.latitude},${pos.coords.longitude}`)
              const json = await res.json()
              if (json.country) {
                sessionStorage.setItem('vaultis_country', json.country)
                setDeviceCountry(json.country)
              }
            } catch { /* ignore */ }
            resolve()
          },
          () => resolve(),
          { timeout: 5000 }
        )
      })
    } catch { /* ignore */ }
  }

  function acceptConsent() {
    sessionStorage.setItem('vaultis_consent', '1')
    setShowConsent(false)
    initDevice()
  }

  function declineConsent() {
    sessionStorage.setItem('vaultis_consent', 'declined')
    setShowConsent(false)
  }

  async function handleIbanBlur() {
    const clean = iban.replace(/\s/g, '').toUpperCase()
    if (clean.length < 6) return
    setIbanError('')
    setReceiver(null)
    try {
      const res = await fetch(`/api/user/lookup?iban=${encodeURIComponent(clean)}`)
      if (res.ok) {
        const data = await res.json()
        setReceiver(data)
      } else {
        setIbanError('IBAN not found')
      }
    } catch {
      setIbanError('Could not look up IBAN')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const clean = iban.replace(/\s/g, '').toUpperCase()
    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum <= 0) { setError('Enter a valid amount'); return }

    setLoading(true)
    setError('')

    const res = await fetch('/api/transactions/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverIban: clean, amount: amountNum, description, deviceHash, deviceCountry }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error); return }

    const { txId, action } = data

    if (action === 'ALLOW') {
      router.push('/transactions?success=1')
    } else if (action === 'STEP_UP_PIN') {
      router.push(`/step-up/pin?txId=${txId}`)
    } else if (action === 'STEP_UP_BIOMETRIC') {
      router.push(`/step-up/biometric?txId=${txId}`)
    } else if (action === 'COOLING_OFF') {
      router.push(`/step-up/cooling-off?txId=${txId}`)
    } else {
      router.push(`/step-up/blocked?txId=${txId}`)
    }
  }

  return (
    <div className="px-4 pt-8 pb-2 space-y-6 max-w-lg mx-auto">

      {/* Consent modal */}
      {showConsent && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) declineConsent() }}
        >
          <div
            className="w-full max-w-lg overflow-y-auto"
            style={{
              background: 'var(--surface)',
              borderRadius: '20px 20px 0 0',
              maxHeight: '88vh',
              paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
            </div>

            <div className="px-5 pt-3 pb-2">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--blue-dim)' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: 'var(--blue)' }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-base leading-tight" style={{ color: 'var(--text)' }}>Privacy Notice</h3>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Fraud prevention · GDPR Art. 6(1)(f)</p>
                </div>
              </div>

              {/* Collected data */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>What we collect</p>
                {[
                  { icon: '🔒', label: 'Device fingerprint', detail: 'SHA-256 hash only — raw ID never stored' },
                  { icon: '📍', label: 'Your location', detail: 'Country code only (e.g. "DE") — no coordinates stored' },
                ].map(item => (
                  <div
                    key={item.icon}
                    className="flex items-center gap-3 rounded-xl px-3 py-3"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                  >
                    <span className="text-lg shrink-0 leading-none">{item.icon}</span>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Risk benefit */}
              <div className="rounded-xl px-3 py-3 mb-4" style={{ background: 'var(--green-dim)', border: '1px solid rgba(5,150,105,0.2)' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--green)' }}>Why this helps you</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--green)' }}>−20 pts</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>known device</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold" style={{ color: 'var(--green)' }}>−15 pts</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>matched location</span>
                  </div>
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>Lower risk score = fewer verification prompts on transfers.</p>
              </div>

              {/* Decline warning */}
              <div className="rounded-xl px-3 py-2.5 mb-4" style={{ background: 'var(--amber-dim)', border: '1px solid rgba(217,119,6,0.2)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  <span className="font-semibold" style={{ color: 'var(--amber)' }}>If you decline: </span>
                  transfers will be treated as higher risk and may require extra PIN steps.
                </p>
              </div>

              {/* GDPR footer */}
              <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
                Withdraw anytime via Profile → My Devices · Data retained max 90 days (Art. 5)
              </p>

              {/* Action buttons */}
              <div className="flex flex-col gap-2">
                <button onClick={acceptConsent} className="btn-gold w-full">Accept &amp; Continue</button>
                <button
                  onClick={declineConsent}
                  className="w-full py-3 text-sm font-medium rounded-xl"
                  style={{ color: 'var(--text-muted)', background: 'transparent' }}
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Send Money</h1>
        {deviceCountry && (
          <span className="badge badge-blue">{deviceCountry}</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Recipient IBAN</label>
          <input
            type="text"
            className="input-field font-mono"
            placeholder="AL00 0000 0000 0000 0000"
            value={iban}
            onChange={e => setIban(e.target.value.toUpperCase())}
            onBlur={handleIbanBlur}
            required
          />
          {receiver && (
            <div className="mt-2 px-3 py-2.5 rounded-xl flex items-center gap-2" style={{ background: 'var(--green-dim)', border: '1px solid rgba(5,150,105,0.25)' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: 'var(--green)', flexShrink: 0 }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{receiver.fullName}</span>
            </div>
          )}
          {ibanError && <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--red)' }}>{ibanError}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Amount (EUR)</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>€</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              className="input-field font-mono pl-8"
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Description <span style={{ color: 'var(--text-faint)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
          <input
            type="text"
            className="input-field"
            placeholder="Rent, invoice #123…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            maxLength={200}
          />
        </div>

        {!deviceHash && !showConsent && (
          <div className="rounded-xl px-3.5 py-3 space-y-1" style={{ background: 'var(--amber-dim)', border: '1px solid rgba(217,119,6,0.25)' }}>
            <p className="text-xs font-semibold" style={{ color: 'var(--amber)' }}>⚠ Unrecognized Device</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              This device is not in your trusted list (+20 risk pts). Your transfer may require additional verification.
            </p>
          </div>
        )}

        {error && (
          <div className="text-sm px-3.5 py-2.5 rounded-xl flex items-center gap-2" style={{ background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(220,38,38,0.2)' }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-gold w-full">
          {loading ? 'Analyzing transfer…' : 'Send Transfer'}
        </button>
      </form>
    </div>
  )
}
