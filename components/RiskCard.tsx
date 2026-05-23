'use client'

interface RiskFlag {
  code: string
  label: string
  weight: number
}

interface RiskCardProps {
  score: number
  flags: RiskFlag[]
  action: string
}

const ACTION_LABELS: Record<string, string> = {
  ALLOW: 'Transfer allowed',
  STEP_UP_PIN: 'PIN verification required',
  STEP_UP_BIOMETRIC: 'Biometric verification required',
  COOLING_OFF: '30-minute cooling-off period',
  ADMIN_QUEUE: 'Manual review by our team',
}

function getRiskLevel(score: number) {
  if (score <= 30) return { label: 'LOW', color: '#22c55e' }
  if (score <= 55) return { label: 'MEDIUM', color: '#f59e0b' }
  if (score <= 75) return { label: 'HIGH', color: '#f97316' }
  return { label: 'CRITICAL', color: '#ef4444' }
}

export default function RiskCard({ score, flags, action }: RiskCardProps) {
  const risk = getRiskLevel(score)

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-[--text-muted]">RISK SCORE</span>
        <span
          className="badge font-mono"
          style={{
            background: `${risk.color}22`,
            color: risk.color,
            border: `1px solid ${risk.color}55`,
          }}
        >
          ● {risk.label}
        </span>
      </div>

      <div className="flex items-end gap-2">
        <span className="font-mono text-3xl font-semibold" style={{ color: risk.color }}>
          {score}
        </span>
        <span className="font-mono text-sm text-[--text-muted] mb-1">/ 100</span>
      </div>

      {flags.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs text-[--text-muted] font-medium uppercase tracking-wide">
            Why this transfer was flagged:
          </p>
          {flags.map(flag => (
            <div key={flag.code} className="flex items-center justify-between gap-3 py-1">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 text-sm">⚠</span>
                <span className="text-sm text-[--text]">{flag.label}</span>
              </div>
              <span className="font-mono text-xs text-amber-400 shrink-0">+{flag.weight}</span>
            </div>
          ))}
        </div>
      )}

      <div
        className="rounded-lg px-3 py-2 text-sm"
        style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)' }}
      >
        <span className="text-[--text-muted]">Action: </span>
        <span className="text-[--gold] font-medium">
          {ACTION_LABELS[action] || action}
        </span>
      </div>

      <div className="pt-1 border-t" style={{ borderColor: 'rgba(201,168,76,0.1)' }}>
        <p className="text-xs" style={{ color: '#4a5568' }}>
          Risk assessed under GDPR Art. 6(1)(f) — Legitimate interest in fraud prevention &amp; PSD2 SCA compliance.
          No automated decision-making for score ≥ 90 (human review required).
        </p>
      </div>
    </div>
  )
}
