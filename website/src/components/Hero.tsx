import { useEffect, useState } from 'react'
import { useWindowWidth } from '../hooks/useWindowWidth'

const FULL_CIRC = 2 * Math.PI * 110

export function Hero() {
  const [xpWidth,      setXpWidth]      = useState(0)
  const [ringProgress, setRingProgress] = useState(0)
  const width                           = useWindowWidth()
  const isMobile                        = width <= 640

  const ringSize   = isMobile ? Math.min(width * 0.62, 220) : 240
  const ringRadius = ringSize * (110 / 240)
  const circ       = 2 * Math.PI * ringRadius
  const dashArray  = ringProgress * circ

  useEffect(() => {
    const t = setTimeout(() => { setXpWidth(68); setRingProgress(0.68) }, 300)
    return () => clearTimeout(t)
  }, [])

  return (
    <section style={{
      minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      paddingTop: 80, paddingBottom: 40,
    }}>
      {/* Ambient glows */}
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
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: isMobile ? 28 : 40 }}>
          {/* Pulse rings */}
          {[ringSize + 26, ringSize + 52].map((size, i) => (
            <div key={i} style={{
              position: 'absolute', width: size, height: size,
              borderRadius: '50%', border: '1px solid rgba(183,109,255,0.22)',
              animation: `pulse-ring ${2.5 + i * 0.8}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }} />
          ))}

          <svg width={ringSize} height={ringSize} viewBox={`0 0 ${ringSize} ${ringSize}`} fill="none" role="img" aria-label="Rank progress ring showing level 42 at 68%">
            <defs>
              <linearGradient id="heroRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ddb7ff" />
                <stop offset="100%" stopColor="#adc6ff" />
              </linearGradient>
            </defs>
            <circle cx={ringSize / 2} cy={ringSize / 2} r={ringRadius} stroke="#1e1e1e" strokeWidth="8" fill="none" />
            <circle
              cx={ringSize / 2} cy={ringSize / 2} r={ringRadius}
              stroke="url(#heroRingGrad)" strokeWidth="8" fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dashArray} ${circ}`}
              strokeDashoffset={circ * 0.25}
              style={{ transform: `rotate(-90deg)`, transformOrigin: `${ringSize / 2}px ${ringSize / 2}px`, transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }}
            />
          </svg>

          {/* Center text */}
          <div style={{
            position: 'absolute', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <span style={{ fontSize: isMobile ? 9 : 11, fontWeight: 700, letterSpacing: 3, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Level</span>
            <span style={{ fontSize: isMobile ? 40 : 52, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>42</span>
            <span style={{ fontSize: isMobile ? 8 : 10, fontWeight: 600, letterSpacing: 2, color: 'var(--primary)', textTransform: 'uppercase' }}>E-RANK</span>
          </div>
        </div>

        <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: 12 }}>Solo Leveling · Productivity</div>
        <h1 style={{
          fontSize: 'clamp(28px, 6vw, 56px)', fontWeight: 700,
          letterSpacing: '-1px', lineHeight: 1.1, marginBottom: 16,
          background: 'linear-gradient(135deg, #fff 0%, var(--primary) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          LEVEL UP<br />YOUR LIFE
        </h1>
        <p style={{ fontSize: isMobile ? 15 : 18, color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.65 }}>
          Complete daily quests. Earn XP. Rank up from E to SSS.<br />
          One quest at a time.
        </p>

        {/* XP Bar */}
        <div style={{ maxWidth: 400, margin: '0 auto 32px', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1.5, color: 'var(--text-muted)', textTransform: 'uppercase' }}>E-Rank Progress</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>{xpWidth}%</span>
          </div>
          <div style={{ height: 8, background: '#1a1a1a', borderRadius: 9999, overflow: 'hidden', border: '1px solid var(--border-default)' }}>
            <div style={{
              height: '100%', width: `${xpWidth}%`,
              background: 'linear-gradient(90deg, var(--primary-container), var(--secondary))',
              borderRadius: 9999,
              transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
              boxShadow: '0 0 12px var(--primary-glow)',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)',
                width: 12, height: 12, borderRadius: '50%',
                background: 'var(--secondary)', boxShadow: '0 0 8px var(--secondary-glow)',
              }} />
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#waitlist" className="btn btn-primary">Join the Waitlist →</a>
          <a href="#mockup" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 20px', fontSize: 15, fontWeight: 500, color: 'var(--text-muted)',
            transition: 'color 0.2s', textDecoration: 'none',
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
