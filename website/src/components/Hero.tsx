import { useEffect, useState } from 'react'

const CIRC = 2 * Math.PI * 110

export function Hero() {
  const [xpWidth, setXpWidth] = useState(0)
  const [ringProgress, setRingProgress] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => {
      setXpWidth(68)
      setRingProgress(0.68)
    }, 300)
    return () => clearTimeout(t)
  }, [])

  const dashArray = ringProgress * CIRC
  const dashOffset = CIRC - dashArray

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      paddingTop: 80,
    }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 800, height: 500, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center top, rgba(183,109,255,0.14) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center bottom, rgba(173,198,255,0.06) 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 24px', maxWidth: 720, width: '100%' }}>
        {/* Rank ring */}
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
          {/* Pulse rings */}
          {[260, 290].map((size, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: size, height: size,
              borderRadius: '50%',
              border: '1px solid rgba(183,109,255,0.25)',
              animation: `pulse-ring ${2.5 + i * 0.8}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }} />
          ))}

          <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
            <defs>
              <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ddb7ff" />
                <stop offset="100%" stopColor="#adc6ff" />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle cx="120" cy="120" r="110" stroke="#1e1e1e" strokeWidth="8" fill="none" />
            {/* Fill */}
            <circle
              cx="120" cy="120" r="110"
              stroke="url(#ringGrad)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dashArray} ${CIRC}`}
              strokeDashoffset={CIRC * 0.25}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '120px 120px', transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }}
            />
          </svg>

          {/* Center text */}
          <div style={{
            position: 'absolute', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Level</span>
            <span style={{ fontSize: 52, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>42</span>
            <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 2, color: 'var(--primary)', textTransform: 'uppercase' }}>E-RANK</span>
          </div>
        </div>

        {/* Headline */}
        <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 16 }}>Solo Leveling · Productivity</div>
        <h1 style={{
          fontSize: 'clamp(32px, 6vw, 56px)',
          fontWeight: 700,
          letterSpacing: '-1px',
          lineHeight: 1.1,
          marginBottom: 20,
          background: 'linear-gradient(135deg, #fff 0%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          LEVEL UP<br />YOUR LIFE
        </h1>
        <p style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 40, lineHeight: 1.65 }}>
          Complete daily quests. Earn XP. Rank up from E to SSS.<br />
          One quest at a time.
        </p>

        {/* XP Bar */}
        <div style={{ maxWidth: 400, margin: '0 auto 40px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>E-Rank Progress</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>{xpWidth}%</span>
          </div>
          <div style={{ height: 8, background: '#1a1a1a', borderRadius: 9999, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
            <div style={{
              height: '100%',
              width: `${xpWidth}%`,
              background: 'linear-gradient(90deg, var(--primary-container), var(--secondary))',
              borderRadius: 9999,
              transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
              boxShadow: '0 0 12px var(--primary-glow)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)',
                width: 12, height: 12, borderRadius: '50%',
                background: 'var(--secondary)',
                boxShadow: '0 0 8px var(--secondary-glow)',
              }} />
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#waitlist" className="btn btn-primary">
            Join the Waitlist →
          </a>
          <a href="#mockup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 20px', fontSize: 15, fontWeight: 500,
            color: 'var(--text-muted)',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            See it in action ↓
          </a>
        </div>
      </div>
    </section>
  )
}
