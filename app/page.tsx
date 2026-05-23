import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="relative min-h-screen flex flex-col" style={{ zIndex: 1 }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <span className="text-2xl" style={{ color: '#c9a84c' }}>⬡</span>
          <span className="font-serif text-xl tracking-wide" style={{ color: '#c9a84c' }}>Vaultis</span>
        </div>
        <div className="hidden gap-3 sm:flex">
          <Link href="/login" className="btn-ghost text-sm px-4 py-2">Sign In</Link>
          <Link href="/register" className="btn-gold text-sm px-4 py-2">Open Account</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs mb-8"
          style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#c9a84c] animate-pulse inline-block" />
          AI-Powered Fraud Detection — Live
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl leading-tight mb-6 max-w-2xl">
          Security that thinks.
          <br />
          <span style={{ color: '#c9a84c' }}>Banking that flows.</span>
        </h1>

        <p className="text-base sm:text-lg max-w-md mb-10 leading-relaxed" style={{ color: '#8892a4' }}>
          Private digital banking with real-time fraud intelligence. Every transfer analyzed in milliseconds, not days.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs sm:max-w-none sm:w-auto">
          <Link href="/register" className="btn-gold px-8 py-3.5 text-base">
            Open Account — Free
          </Link>
          <Link href="/login" className="btn-ghost px-8 py-3.5 text-base">
            Sign In
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-6 pb-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto w-full">
        {[
          {
            icon: '🧠',
            title: 'AI Fraud Detection',
            desc: '9 real-time risk signals evaluated before every transfer. Velocity, device recognition, location, and behavioral analysis.',
          },
          {
            icon: '🔐',
            title: 'Biometric Auth',
            desc: 'Face ID & fingerprint step-up for high-risk transfers. WebAuthn-native — biometric data never leaves your device.',
          },
          {
            icon: '⚡',
            title: 'Real-Time Protection',
            desc: 'Instant risk scoring, 30-minute cooling-off periods, and human review queue — layered defense at every level.',
          },
        ].map(f => (
          <div key={f.title} className="card card-hover p-5">
            <div className="text-2xl mb-3">{f.icon}</div>
            <h3 className="font-semibold mb-2">{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#8892a4' }}>{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── SETUP SECURE TRANSACTIONS ── */}
      <section className="px-6 pb-16 max-w-3xl mx-auto w-full">
        <div className="animate-gold-glow rounded-2xl p-8 text-center space-y-6 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(10,14,26,0.97) 50%, rgba(201,168,76,0.07) 100%)',
            border: '1.5px solid rgba(201,168,76,0.55)',
          }}
        >
          {/* Top glow line */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 h-px w-3/4 blur-sm"
            style={{ background: 'rgba(201,168,76,0.7)' }}
          />

          <div className="text-5xl select-none">🔐</div>

          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-4"
              style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', color: '#c9a84c' }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse inline-block" style={{ background: '#c9a84c' }} />
              RECOMMENDED SETUP
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl mb-3" style={{ color: '#c9a84c' }}>
              Setup Secure Transactions
            </h2>
            <p className="text-base max-w-xl mx-auto leading-relaxed" style={{ color: '#8892a4' }}>
              Register biometric authentication — Face ID or fingerprint — before your first transfer. It unlocks
              the highest protection tier and reduces verification friction for every transaction after.
            </p>
          </div>

          {/* Benefit cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            {[
              {
                icon: '🫵',
                title: 'Prove It\'s Really You',
                desc: 'WebAuthn passkeys — your biometric never leaves your device. No passwords, no phishing vectors, no third-party servers.',
              },
              {
                icon: '📉',
                title: 'Lower Your Risk Score',
                desc: 'Registered biometrics reduce your transfer risk profile. Smoother approvals, fewer PIN prompts, faster transactions.',
              },
              {
                icon: '⚖️',
                title: 'EU PSD2 Compliant',
                desc: 'Strong Customer Authentication (SCA) as mandated by the EU Payment Services Directive 2 for high-value transfers.',
              },
            ].map(b => (
              <div
                key={b.title}
                className="rounded-xl p-4 text-left"
                style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.18)' }}
              >
                <div className="text-xl mb-2">{b.icon}</div>
                <h4 className="font-semibold text-sm mb-1.5">{b.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: '#8892a4' }}>{b.desc}</p>
              </div>
            ))}
          </div>

          {/* How it works steps */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs" style={{ color: '#8892a4' }}>
            {['Create your account', 'Go to Profile', 'Tap "Add Biometric"', 'Scan Face ID or Fingerprint'].map((step, i) => (
              <div key={step} className="flex items-center gap-2">
                {i > 0 && <span className="hidden sm:block" style={{ color: '#4a5568' }}>→</span>}
                <span
                  className="px-3 py-1 rounded-full font-mono"
                  style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', color: '#c9a84c' }}
                >
                  {i + 1}. {step}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link href="/register" className="btn-gold px-8 py-3.5 text-base">
              Create Account & Setup Biometrics →
            </Link>
            <Link href="/login" className="btn-ghost px-8 py-3.5 text-base">
              Already registered? Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* 9 Risk Signals Section */}
      <section className="px-6 pb-16 max-w-3xl mx-auto w-full">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono mb-4"
            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#f59e0b' }}
          >
            FRAUD ENGINE v1
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl mb-3">9 Signals. Every Transfer. Zero Guesswork.</h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: '#8892a4' }}>
            Our risk engine evaluates every transaction against nine independent signals in real time before allowing it to proceed.
            Score 0–100. Action determined automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {[
            { icon: '📱', label: 'Device Recognition', weight: 20, desc: 'Unrecognized devices trigger additional checks. Register your device to lower risk.' },
            { icon: '🌍', label: 'Jurisdiction Check', weight: 30, desc: 'Transfers to sanctioned or high-risk countries (RU, KP, IR, BY…) require mandatory review.' },
            { icon: '📍', label: 'Location Mismatch', weight: 15, desc: 'Your current country vs. recipient country mismatch signals potential account compromise.' },
            { icon: '📊', label: 'Behavioral Analysis', weight: 15, desc: 'Transfers more than 2× your historical average are flagged as anomalous.' },
            { icon: '💸', label: 'Balance Drain', weight: 20, desc: 'Transfers exceeding 80% of your balance indicate potential account takeover.' },
            { icon: '👤', label: 'New Beneficiary', weight: 10, desc: 'First-time transfers to a recipient carry extra scrutiny until a trust pattern forms.' },
            { icon: '⚡', label: 'Velocity Check', weight: 25, desc: '3+ transfers in 10 minutes — a hallmark of automated fraud. Triggers immediate step-up.' },
            { icon: '🕐', label: 'Time Pattern', weight: 10, desc: 'Transfers outside your normal activity hours are flagged as behavioral anomalies.' },
            { icon: '💰', label: 'Round Amount Pattern', weight: 10, desc: 'Large round numbers (€1,000 / €5,000) are a well-documented fraud pattern in AML typologies.' },
          ].map(signal => (
            <div key={signal.label} className="card p-4 flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5">{signal.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold">{signal.label}</span>
                  <span className="font-mono text-xs shrink-0" style={{ color: '#f59e0b' }}>+{signal.weight} pts</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#8892a4' }}>{signal.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Score thresholds */}
        <div className="card p-4">
          <p className="text-xs font-mono uppercase tracking-wider mb-3" style={{ color: '#8892a4' }}>Risk Score → Action</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { range: '0 – 30', action: 'Auto-approved', color: '#22c55e' },
              { range: '31 – 55', action: 'PIN required', color: '#f59e0b' },
              { range: '56 – 75', action: 'Biometric', color: '#f97316' },
              { range: '76 – 89', action: '30-min hold', color: '#ef4444' },
              { range: '90 – 100', action: 'Admin review', color: '#dc2626' },
            ].map(t => (
              <div
                key={t.range}
                className="rounded-lg p-3 text-center"
                style={{ background: `${t.color}12`, border: `1px solid ${t.color}40` }}
              >
                <p className="font-mono text-xs font-semibold" style={{ color: t.color }}>{t.range}</p>
                <p className="text-xs mt-1" style={{ color: '#8892a4' }}>{t.action}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* GDPR Transparency Section */}
      <section className="px-6 pb-16 max-w-3xl mx-auto w-full">
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#0f1520', border: '1px solid rgba(201,168,76,0.2)' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🇪🇺</span>
            <div>
              <h2 className="font-serif text-xl">GDPR & Privacy Transparency</h2>
              <p className="text-xs mt-1" style={{ color: '#8892a4' }}>
                Regulation (EU) 2016/679 (GDPR) · Payment Services Directive 2 (PSD2) · Anti-Money Laundering Directive (AMLD)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                icon: '⚖️',
                title: 'Legal Basis',
                content: 'Art. 6(1)(f) GDPR — Legitimate interest in fraud prevention. Processing is necessary to comply with PSD2 Strong Customer Authentication (SCA) requirements and protect account holders from financial crime.',
              },
              {
                icon: '🗂️',
                title: 'What We Collect',
                content: 'SHA-256 hash of your device fingerprint (one-way, irreversible — never the raw ID). Country code only from geolocation (e.g. "AL", "DE") — never GPS coordinates, addresses, or IP addresses.',
              },
              {
                icon: '🗑️',
                title: 'Data Retention',
                content: 'Risk events auto-deleted after 90 days (GDPR data minimization). Device sessions deleted on your request. Completed transactions retained 5 years per AML Directive obligations.',
              },
              {
                icon: '🛡️',
                title: 'Your GDPR Rights',
                content: 'Right of access, erasure (Profile → My Devices), restriction, and portability. No fully automated decisions — all score ≥ 90 cases reviewed by a human. Right to object to processing.',
              },
            ].map(item => (
              <div key={item.title} className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-1.5" style={{ color: '#c9a84c' }}>
                  <span>{item.icon}</span>{item.title}
                </h4>
                <p className="text-xs leading-relaxed" style={{ color: '#8892a4' }}>{item.content}</p>
              </div>
            ))}
          </div>

          <div
            className="rounded-lg px-4 py-3 text-xs space-y-1"
            style={{ background: 'rgba(201,168,76,0.04)', border: '1px solid rgba(201,168,76,0.15)' }}
          >
            <p className="font-semibold text-xs" style={{ color: '#c9a84c' }}>No Third-Party Data Sharing</p>
            <p style={{ color: '#8892a4' }}>
              All data is processed locally. No personal data is shared with advertisers, analytics platforms, or profiling services.
              Geolocation resolved via api.country.is — country code only, no coordinates forwarded or stored.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['GDPR Art. 6(1)(f)', 'PSD2 SCA', 'AML Directive', 'WebAuthn W3C', 'SHA-256 Hashing', 'No Raw Biometrics'].map(tag => (
              <span
                key={tag}
                className="font-mono text-xs px-2 py-1 rounded"
                style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', color: '#8892a4' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-10 px-6 space-y-1" style={{ color: '#8892a4' }}>
        <p className="text-xs">Vaultis © 2026 — CIT Hackathon Demo · Not a real bank</p>
        <p className="text-xs" style={{ color: '#4a5568' }}>
          GDPR Art. 6(1)(f) · PSD2 SCA · AML/CFT · WebAuthn W3C Spec
        </p>
      </footer>
    </main>
  )
}
