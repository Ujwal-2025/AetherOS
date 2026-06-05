import { useEffect, useState } from 'react'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
      background: scrolled ? 'rgba(5,5,5,0.85)' : 'transparent',
      transition: 'background 0.3s ease, border-color 0.3s ease',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--primary-faint)',
            border: '1px solid rgba(183,109,255,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" stroke="var(--primary)" strokeWidth="1.5" fill="none" />
              <circle cx="8" cy="8" r="2" fill="var(--primary)" />
            </svg>
          </div>
          <span style={{
            fontWeight: 700, fontSize: 14, letterSpacing: 4,
            color: 'var(--primary)', textTransform: 'uppercase',
          }}>
            AETHER OS
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a
            href="#waitlist"
            className="btn btn-ghost"
            style={{ padding: '10px 20px', fontSize: 13 }}
          >
            Join Waitlist
          </a>
        </div>
      </div>
    </nav>
  )
}
