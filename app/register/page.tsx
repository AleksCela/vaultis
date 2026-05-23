'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', email: '', password: '', pin: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{4}$/.test(form.pin)) { setError('PIN must be exactly 4 digits'); return }
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ zIndex: 1, position: 'relative' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl" style={{ color: '#c9a84c' }}>⬡</span>
            <span className="font-serif text-2xl" style={{ color: '#c9a84c' }}>Vaultis</span>
          </Link>
          <p className="mt-3 text-sm" style={{ color: '#8892a4' }}>Open your account in seconds</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {[
            { key: 'fullName', label: 'Full Name', type: 'text', placeholder: 'Ardit Hoxha', autocomplete: 'name' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com', autocomplete: 'email' },
            { key: 'password', label: 'Password', type: 'password', placeholder: '8+ characters', autocomplete: 'new-password' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: '#8892a4' }}>{f.label}</label>
              <input
                type={f.type}
                className="input-field"
                placeholder={f.placeholder}
                value={(form as Record<string, string>)[f.key]}
                onChange={e => set(f.key, e.target.value)}
                required
                autoComplete={f.autocomplete}
              />
            </div>
          ))}

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8892a4' }}>
              4-Digit PIN
              <span className="ml-1 font-normal" style={{ color: '#4a5568' }}>(used for transfer verification)</span>
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              className="input-field font-mono tracking-[0.5em]"
              placeholder="••••"
              value={form.pin}
              onChange={e => set('pin', e.target.value.replace(/\D/g, '').slice(0, 4))}
              required
              autoComplete="off"
            />
          </div>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-gold w-full">
            {loading ? 'Creating account…' : 'Open Account'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm" style={{ color: '#8892a4' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#c9a84c' }} className="hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
