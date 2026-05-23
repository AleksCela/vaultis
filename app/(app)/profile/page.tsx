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
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--blue)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="px-4 pt-8 pb-2 space-y-5 max-w-lg mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Profile</h1>
        <button
          onClick={logout}
          className="text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ color: 'var(--red)', border: '1px solid var(--red-dim)', background: 'var(--red-dim)' }}
        >
          Sign out
        </button>
      </div>

      {/* User card */}
      <div className="card p-5 flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
          style={{ background: 'var(--blue)', color: '#fff', boxShadow: '0 4px 12px var(--blue-dim)' }}
        >
          {user.fullName[0]}
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>{user.fullName}</p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
          <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-faint)' }}>{user.country}</p>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        {(['info', 'devices'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
            style={tab === t
              ? { background: 'var(--surface)', color: 'var(--blue)', boxShadow: 'var(--shadow-sm)' }
              : { color: 'var(--text-muted)' }
            }
          >
            {t === 'info' ? 'Account Info' : 'My Devices'}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {tab === 'info' && (
        <div className="space-y-3">
          <div className="card overflow-hidden">
            {[
              { label: 'Full Name', value: user.fullName },
              { label: 'Email', value: user.email },
              { label: 'IBAN', value: formatIban(user.iban), mono: true },
              { label: 'Balance', value: `€${user.balance.toLocaleString('de-DE', { minimumFractionDigits: 2 })}`, mono: true },
              { label: 'Member since', value: new Date(user.createdAt).toLocaleDateString() },
            ].map((item, i) => (
              <div
                key={item.label}
                className="px-4 py-3.5 flex justify-between items-center gap-3"
                style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}
              >
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                <span className={`text-sm text-right font-medium ${item.mono ? 'font-mono' : ''}`} style={{ color: 'var(--text)' }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Biometric CTA */}
          <div
            className="animate-gold-glow card p-5 space-y-4"
            style={{ borderWidth: '1.5px' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--blue-dim)' }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ color: 'var(--blue)' }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <div>
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono mb-1"
                  style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: 'var(--blue)' }} />
                  ACTION REQUIRED
                </div>
                <h3 className="font-semibold leading-tight" style={{ color: 'var(--text)' }}>
                  Setup Secure Transactions
                </h3>
              </div>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Register Face ID or fingerprint to protect your transfers and reduce your risk score.
              Biometric data <strong style={{ color: 'var(--text)' }}>never leaves your device</strong> — WebAuthn standard.
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
                  className="rounded-xl px-3 py-2 flex items-center gap-2"
                  style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue-dim2)' }}
                >
                  <span>{item.icon}</span>
                  <div>
                    <p className="font-semibold text-xs" style={{ color: 'var(--text)' }}>{item.label}</p>
                    <p style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {bioStatus && (
              <div
                className="rounded-xl px-3 py-2.5 text-sm text-center font-medium"
                style={{
                  background: bioStatus.startsWith('Error') ? 'var(--red-dim)' : 'var(--green-dim)',
                  border: `1px solid ${bioStatus.startsWith('Error') ? 'rgba(220,38,38,0.25)' : 'rgba(5,150,105,0.25)'}`,
                  color: bioStatus.startsWith('Error') ? 'var(--red)' : 'var(--green)',
                }}
              >
                {bioStatus.startsWith('Error') ? '✗' : '✓'} {bioStatus}
              </div>
            )}

            <button
              onClick={addBiometric}
              disabled={bioStatus === 'loading'}
              className="btn-gold w-full"
            >
              {bioStatus === 'loading' ? 'Waiting for biometric…' : 'Add Biometric Authentication'}
            </button>

            <p className="text-xs text-center" style={{ color: 'var(--text-faint)' }}>
              GDPR Art. 6(1)(f) · WebAuthn W3C Standard · No raw biometric data stored
            </p>
          </div>
        </div>
      )}

      {/* Devices tab */}
      {tab === 'devices' && (
        <div className="space-y-3">
          {devices.length === 0 ? (
            <div className="card p-8 text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>No registered devices</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Devices appear here after you accept fingerprinting on Send</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              {devices.map((d, i) => (
                <div
                  key={d.id}
                  className="px-4 py-3.5 flex items-center justify-between gap-3"
                  style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{d.deviceLabel || 'Unknown device'}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {d.countryCode ?? '—'} · Last seen {new Date(d.lastSeen).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteDevice(d.id)}
                    className="text-xs px-2.5 py-1.5 rounded-lg font-semibold"
                    style={{ color: 'var(--red)', background: 'var(--red-dim)', border: '1px solid rgba(220,38,38,0.2)' }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className="rounded-xl px-4 py-3.5 space-y-1.5 text-xs"
            style={{ background: 'var(--blue-dim)', border: '1px solid var(--blue-dim2)' }}
          >
            <p className="font-semibold" style={{ color: 'var(--blue)' }}>🇪🇺 GDPR Right to Erasure (Art. 17)</p>
            <p style={{ color: 'var(--text-muted)' }}>
              Removing a device deletes its hashed fingerprint from our systems and revokes its trusted status.
              Risk events linked to removed devices are purged within 90 days per our data minimization policy.
            </p>
            <p style={{ color: 'var(--text-faint)' }}>
              Note: Removing trusted devices increases your transfer risk score (+20 pts per unrecognized device).
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
