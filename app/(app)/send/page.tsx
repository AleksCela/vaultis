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

  // Fingerprint + geolocation consent
  useEffect(() => {
    const consentGiven = sessionStorage.getItem('vaultis_consent')
    if (!consentGiven) {
      setShowConsent(true)
    } else {
      initDevice()
    }
  }, [])

  async function initDevice() {
    // Hash fingerprint client-side
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

    // Cache country in sessionStorage
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
    // Device treated as unknown (higher risk), user is informed
  }

  // IBAN lookup
  async function lookupIban(value: string) {
    const clean = value.replace(/\s/g, '').toUpperCase()
    if (clean.length < 10) { setReceiver(null); setIbanError(''); return }
    const res = await fetch('/api/transactions/initiate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverIban: clean, amount: 0.01, deviceHash, deviceCountry, _lookupOnly: true }),
    })
    // We use a dedicated lookup endpoint instead
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
      body: JSON.stringify({
        receiverIban: clean,
        amount: amountNum,
        description,
        deviceHash,
        deviceCountry,
      }),
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
    <div className="px-4 pt-8 space-y-6 max-w-lg mx-auto">
      {/* Consent modal */}
      {showConsent && (
        <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full rounded-t-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto" style={{ background: '#111827', border: '1px solid rgba(201,168,76,0.3)', borderBottom: 'none' }}>
            {/* Header */}
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🇪🇺</span>
              <div>
                <h3 className="font-semibold text-base">GDPR Privacy Notice — Fraud Prevention</h3>
                <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>
                  Required before processing your transfer · Art. 6(1)(f) GDPR
                </p>
              </div>
            </div>

            {/* What we collect */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#c9a84c' }}>What We Collect</p>
              <div className="space-y-2">
                <div className="flex items-start gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}>
                  <span className="text-base shrink-0">🔒</span>
                  <div>
                    <p className="text-sm font-medium">Device Fingerprint → SHA-256 Hash Only</p>
                    <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>
                      Your device ID is immediately hashed client-side using SHA-256 — a one-way, irreversible operation. The raw ID is never sent or stored. We store only the hash.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg px-3 py-2.5" style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}>
                  <span className="text-base shrink-0">📍</span>
                  <div>
                    <p className="text-sm font-medium">Location → Country Code Only</p>
                    <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>
                      Your GPS coordinates are used solely to resolve your country (e.g. "AL", "DE"). Coordinates are never stored or forwarded. Only the 2-letter country code is retained.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Why it matters */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#c9a84c' }}>Why This Protects You</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '📱', label: 'Recognized device', impact: '−20 risk pts' },
                  { icon: '📍', label: 'Matched location', impact: '−15 risk pts' },
                ].map(item => (
                  <div key={item.label} className="rounded-lg px-3 py-2 text-center" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <span className="text-base">{item.icon}</span>
                    <p className="text-xs mt-1" style={{ color: '#8892a4' }}>{item.label}</p>
                    <p className="font-mono text-xs font-semibold mt-0.5" style={{ color: '#22c55e' }}>{item.impact}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs" style={{ color: '#8892a4' }}>
                Device and location data reduce your transaction risk score, enabling faster approvals and fewer step-up challenges.
              </p>
            </div>

            {/* If you decline */}
            <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <p className="text-xs font-semibold mb-1" style={{ color: '#f59e0b' }}>⚠ If You Decline</p>
              <p className="text-xs" style={{ color: '#8892a4' }}>
                Your device will be treated as unrecognized (+20 risk pts) and your location as unknown (+15 pts). Transfers are more likely to require PIN or biometric verification.
              </p>
            </div>

            {/* GDPR rights */}
            <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)', color: '#8892a4' }}>
              <span className="font-semibold" style={{ color: '#c9a84c' }}>Your GDPR Rights: </span>
              Withdraw consent anytime · Delete device data via Profile → My Devices (Art. 17 Right to Erasure) ·
              Data retained max 90 days (Art. 5 data minimization) · Legal basis: Art. 6(1)(f) legitimate interest
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={acceptConsent} className="btn-gold flex-1 py-3">Accept & Continue</button>
              <button onClick={declineConsent} className="btn-ghost flex-1 py-3">Decline</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <h1 className="font-serif text-2xl">Send Money</h1>
        {deviceCountry && (
          <span className="badge badge-green text-xs">{deviceCountry}</span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* IBAN */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#8892a4' }}>Recipient IBAN</label>
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
            <div className="mt-2 px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <span className="text-green-400">✓</span>
              <span className="text-sm font-medium">{receiver.fullName}</span>
            </div>
          )}
          {ibanError && <p className="mt-1 text-xs" style={{ color: '#ef4444' }}>{ibanError}</p>}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#8892a4' }}>Amount (EUR)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm" style={{ color: '#8892a4' }}>€</span>
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

        {/* Description */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#8892a4' }}>Description (optional)</label>
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
          <div className="rounded-lg px-3 py-3 space-y-1" style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>⚠ Unrecognized Device</p>
            <p className="text-xs" style={{ color: '#8892a4' }}>
              This device is not in your trusted list (+20 risk pts). Your transfer may require additional PIN or biometric verification.
              Register your device via Profile to reduce friction on future transfers.
            </p>
          </div>
        )}

        {error && (
          <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-gold w-full py-4 text-base">
          {loading ? 'Analyzing transfer…' : '↗ Send Transfer'}
        </button>
      </form>
    </div>
  )
}
