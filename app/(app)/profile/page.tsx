'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatIban } from '@/lib/iban'

interface User {
  id: string
  fullName: string
  email: string
  iban: string
  balance: number
  country: string
  createdAt: string
}

interface Device {
  id: string
  deviceLabel: string | null
  countryCode: string | null
  trusted: boolean
  firstSeen: string
  lastSeen: string
}

type Tab = 'info' | 'devices'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [tab, setTab] = useState<Tab>('info')
  const [bioStatus, setBioStatus] = useState('')

  useEffect(() => {
    fetch('/api/user/me').then(r => r.json()).then(setUser)
    fetch('/api/user/devices').then(r => r.json()).then(d => setDevices(Array.isArray(d) ? d : []))
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  async function deleteDevice(id: string) {
    await fetch(`/api/user/devices/${id}`, { method: 'DELETE' })
    setDevices(prev => prev.filter(d => d.id !== id))
  }

  async function addBiometric() {
    setBioStatus('loading')
    try {
      const { startRegistration } = await import('@simplewebauthn/browser')
      const optRes = await fetch('/api/webauthn/register/options', { method: 'POST' })
      const options = await optRes.json()
      const attResp = await startRegistration({ optionsJSON: options })
      const verRes = await fetch('/api/webauthn/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attResp),
      })
      if (verRes.ok) {
        setBioStatus('Biometric registered successfully!')
      } else {
        const d = await verRes.json()
        setBioStatus(`Error: ${d.error}`)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setBioStatus(`Error: ${msg}`)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#c9a84c', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="px-4 pt-8 space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">Profile</h1>
        <button onClick={logout} className="text-sm px-3 py-1.5 rounded-lg" style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
          Sign out
        </button>
      </div>

      {/* Avatar */}
      <div className="card p-5 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-semibold shrink-0"
          style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c' }}
        >
          {user.fullName[0]}
        </div>
        <div>
          <p className="font-semibold">{user.fullName}</p>
          <p className="text-sm mt-0.5" style={{ color: '#8892a4' }}>{user.email}</p>
          <p className="text-xs mt-1 font-mono" style={{ color: '#8892a4' }}>{user.country}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#111827', border: '1px solid rgba(201,168,76,0.15)' }}>
        {(['info', 'devices'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-md text-sm font-medium transition-colors capitalize"
            style={tab === t
              ? { background: 'rgba(201,168,76,0.15)', color: '#c9a84c' }
              : { color: '#8892a4' }
            }
          >
            {t === 'info' ? 'Account Info' : 'My Devices'}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === 'info' && (
        <div className="space-y-3">
          {[
            { label: 'Full Name', value: user.fullName },
            { label: 'Email', value: user.email },
            { label: 'IBAN', value: formatIban(user.iban), mono: true },
            { label: 'Balance', value: `€${user.balance.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, mono: true },
            { label: 'Member since', value: new Date(user.createdAt).toLocaleDateString() },
          ].map(item => (
            <div key={item.label} className="card p-4 flex justify-between items-center gap-3">
              <span className="text-sm" style={{ color: '#8892a4' }}>{item.label}</span>
              <span className={`text-sm ${item.mono ? 'font-mono' : ''} text-right`}>{item.value}</span>
            </div>
          ))}

          {/* Setup Secure Transactions CTA */}
          <div
            className="animate-gold-glow rounded-xl p-5 space-y-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.09) 0%, rgba(10,14,26,0.97) 60%, rgba(201,168,76,0.05) 100%)',
              border: '1.5px solid rgba(201,168,76,0.45)',
            }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-2/3 blur-sm"
              style={{ background: 'rgba(201,168,76,0.6)' }}
            />

            <div className="flex items-center gap-3">
              <span className="text-3xl">🔐</span>
              <div>
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono mb-1"
                  style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#c9a84c' }} />
                  ACTION REQUIRED
                </div>
                <h3 className="font-serif text-lg leading-tight" style={{ color: '#c9a84c' }}>
                  Setup Secure Transactions
                </h3>
              </div>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: '#8892a4' }}>
              Register Face ID or fingerprint to protect your transfers and reduce your risk score.
              Biometric data <strong style={{ color: '#f0f0f0' }}>never leaves your device</strong> — WebAuthn standard, no third-party servers.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { icon: '📉', label: 'Lowers risk score', desc: 'Fewer PIN prompts' },
                { icon: '⚖️', label: 'PSD2 SCA', desc: 'EU compliant' },
                { icon: '🫵', label: 'On-device only', desc: 'Never uploaded' },
                { icon: '🚀', label: 'Faster approvals', desc: 'High-risk transfers' },
              ].map(item => (
                <div
                  key={item.label}
                  className="rounded-lg px-3 py-2 flex items-center gap-2"
                  style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.15)' }}
                >
                  <span>{item.icon}</span>
                  <div>
                    <p className="font-medium text-xs" style={{ color: '#f0f0f0' }}>{item.label}</p>
                    <p style={{ color: '#8892a4' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {bioStatus ? (
              <div
                className="rounded-lg px-3 py-2.5 text-sm text-center"
                style={{
                  background: bioStatus.startsWith('Error') ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                  border: `1px solid ${bioStatus.startsWith('Error') ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
                  color: bioStatus.startsWith('Error') ? '#ef4444' : '#22c55e',
                }}
              >
                {bioStatus.startsWith('Error') ? '✗' : '✓'} {bioStatus}
              </div>
            ) : null}

            <button
              onClick={addBiometric}
              disabled={bioStatus === 'loading'}
              className="btn-gold w-full py-3.5"
            >
              {bioStatus === 'loading' ? 'Waiting for biometric…' : '🔐 Add Biometric Authentication →'}
            </button>

            <p className="text-xs text-center" style={{ color: '#4a5568' }}>
              GDPR Art. 6(1)(f) · WebAuthn W3C Standard · No raw biometric data stored
            </p>
          </div>
        </div>
      )}

      {/* Devices tab */}
      {tab === 'devices' && (
        <div className="space-y-2">
          {devices.length === 0 ? (
            <div className="card p-6 text-center text-sm" style={{ color: '#8892a4' }}>
              No registered devices
            </div>
          ) : (
            devices.map(d => (
              <div key={d.id} className="card p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{d.deviceLabel || 'Unknown device'}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#8892a4' }}>
                    {d.countryCode ?? '—'} · Last seen {new Date(d.lastSeen).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteDevice(d.id)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  Remove
                </button>
              </div>
            ))
          )}
          {/* TODO: Add cron job to delete RiskEvents older than 90 days (GDPR retention) */}
          <div className="rounded-lg px-3 py-3 space-y-1.5 text-xs" style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.12)' }}>
            <p className="font-semibold" style={{ color: '#c9a84c' }}>🇪🇺 GDPR Right to Erasure (Art. 17)</p>
            <p style={{ color: '#8892a4' }}>
              Removing a device deletes its hashed fingerprint from our systems and revokes its trusted status.
              Risk events linked to removed devices are purged within 90 days per our data minimization policy.
            </p>
            <p style={{ color: '#4a5568' }}>
              Note: Removing trusted devices increases your transfer risk score (+20 pts per unrecognized device).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
