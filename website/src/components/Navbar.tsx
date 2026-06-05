import { useEffect, useRef, useState } from 'react'
import { useWindowWidth } from '../hooks/useWindowWidth'

const NAV_LINKS = [
  { label: 'App Preview', href: '#mockup' },
  { label: 'Live Demo',   href: '#demo' },
  { label: 'Ranks',       href: '#rankladder' },
  { label: 'Join Waitlist', href: '#waitlist' },
]

export function Navbar() {
  const [scrolled, setScrolled]   = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const width                     = useWindowWidth()
  const isMobile                  = width <= 768
  const menuRef                   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Close menu on route/hash change
  function handleLinkClick() {
    setMenuOpen(false)
  }

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      ref={menuRef}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        background: scrolled ? 'rgba(5,5,5,0.88)' : 'transparent',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Top bar */}
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--primary-faint)',
            border: '1px solid rgba(183,109,255,0.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" stroke="var(--primary)" strokeWidth="1.5" fill="none" />
              <circle cx="8" cy="8" r="2" fill="var(--primary)" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: 4, color: 'var(--primary)', textTransform: 'uppercase' }}>
            AETHER OS
          </span>
        </a>

        {/* Desktop nav */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {NAV_LINKS.slice(0, -1).map(link => (
              <a key={link.href} href={link.href} style={{ fontSize: 13, color: 'var(--text-muted)', transition: 'color 0.2s', fontWeight: 500 }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                {link.label}
              </a>
            ))}
            <a href="#waitlist" className="btn btn-ghost" style={{ padding: '10px 20px', fontSize: 13 }}>
              Join Waitlist
            </a>
          </div>
        )}

        {/* Mobile hamburger */}
        {isMobile && (
          <button
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(o => !o)}
            style={{
              width: 40, height: 40, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 5,
              background: 'transparent', border: 'none', cursor: 'pointer', padding: 8,
            }}
          >
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: 'block', width: 22, height: 2, borderRadius: 2,
                background: 'var(--text-secondary)',
                transition: 'transform 0.25s ease, opacity 0.25s ease',
                transform: menuOpen
                  ? i === 0 ? 'translateY(7px) rotate(45deg)'
                  : i === 2 ? 'translateY(-7px) rotate(-45deg)'
                  : 'scaleX(0)'
                  : 'none',
                opacity: menuOpen && i === 1 ? 0 : 1,
              }} />
            ))}
          </button>
        )}
      </div>

      {/* Mobile slide-down menu */}
      {isMobile && (
        <div style={{
          overflow: 'hidden',
          maxHeight: menuOpen ? 280 : 0,
          opacity: menuOpen ? 1 : 0,
          transition: 'max-height 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.25s ease',
          background: 'rgba(5,5,5,0.95)',
          borderBottom: menuOpen ? '1px solid rgba(255,255,255,0.07)' : 'none',
        }}>
          <div style={{ padding: '12px 24px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {NAV_LINKS.map(link => (
              <a
                key={link.href}
                href={link.href}
                onClick={handleLinkClick}
                style={{
                  padding: '13px 16px', borderRadius: 10, fontSize: 15, fontWeight: 500,
                  color: 'var(--text-secondary)', textDecoration: 'none',
                  transition: 'background 0.15s, color 0.15s',
                  display: 'block',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-faint)'; e.currentTarget.style.color = 'var(--primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
