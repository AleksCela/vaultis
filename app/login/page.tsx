'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12" style={{ zIndex: 1, position: 'relative' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl" style={{ color: '#c9a84c' }}>⬡</span>
            <span className="font-serif text-2xl" style={{ color: '#c9a84c' }}>Vaultis</span>
          </Link>
          <p className="mt-3 text-sm" style={{ color: '#8892a4' }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8892a4' }}>Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#8892a4' }}>Password</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-gold w-full">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center mt-4 text-sm" style={{ color: '#8892a4' }}>
          No account?{' '}
          <Link href="/register" style={{ color: '#c9a84c' }} className="hover:underline">
            Open one for free
          </Link>
        </p>
      </div>
    </div>
  )
}
