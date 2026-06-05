import { useState } from 'react'
import { useInView } from '../hooks/useInView'

export function Waitlist() {
  const { ref, isVisible } = useInView()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const formId = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_FORMSPREE_ID

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || state === 'loading' || state === 'done') return
    setState('loading')
    try {
      const res = await fetch(`https://formspree.io/f/${formId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setState('done')
    } catch {
      setState('error')
    }
  }

  return (
    <section
      id="waitlist"
      className="section"
      style={{
        background: 'linear-gradient(180deg, var(--bg-primary) 0%, #0a0515 50%, var(--bg-primary) 100%)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Big ambient glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 900, height: 500, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(183,109,255,0.12) 0%, transparent 60%)',
      }} />

      <div className="container" style={{ position: 'relative', textAlign: 'center' }}>
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`reveal${isVisible ? ' visible' : ''}`}
        >
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Early Access</div>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 700,
            letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 16,
            background: 'linear-gradient(135deg, #fff 20%, var(--primary) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            textShadow: 'none',
          }}>
            JOIN THE HUNT
          </h2>
          <p style={{ fontSize: 17, color: 'var(--text-muted)', marginBottom: 40, lineHeight: 1.65 }}>
            Be the first to rank up. Early hunters get exclusive E-Rank → SSS tracking from day one.
          </p>

          {state === 'done' ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 12,
              background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.40)',
              borderRadius: 16, padding: '20px 32px',
              animation: 'scale-bounce 0.4s ease-out',
            }}>
              <span style={{ fontSize: 24 }}>✓</span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#10B981' }}>You're in.</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 2 }}>We'll summon you soon, Hunter.</div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 480, margin: '0 auto' }}>
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  flex: '1 1 200px', padding: '14px 20px',
                  background: 'var(--bg-surface)', border: '1px solid var(--border-medium)',
                  borderRadius: 9999, color: 'var(--text-primary)',
                  fontSize: 15, outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(183,109,255,0.50)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-medium)' }}
              />
              <button
                type="submit"
                disabled={state === 'loading'}
                className="btn btn-primary"
                style={{ flexShrink: 0, opacity: state === 'loading' ? 0.7 : 1 }}
              >
                {state === 'loading' ? (
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid transparent', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite' }} />
                ) : 'Claim Your Spot'}
              </button>
            </form>
          )}

          {state === 'error' && (
            <p style={{ fontSize: 13, color: 'var(--danger)', marginTop: 12 }}>
              Something went wrong. Try again in a moment.
            </p>
          )}

          <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 20 }}>
            No spam. No daily emails. Just a ping when we launch.
          </p>
        </div>
      </div>
    </section>
  )
}
