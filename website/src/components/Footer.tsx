export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'var(--primary-faint)', border: '1px solid rgba(183,109,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <polygon points="6,0.5 11.5,3.5 11.5,8.5 6,11.5 0.5,8.5 0.5,3.5" stroke="var(--primary)" strokeWidth="1.2" fill="none" />
            <circle cx="6" cy="6" r="1.5" fill="var(--primary)" />
          </svg>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 4, color: 'rgba(221,183,255,0.7)', textTransform: 'uppercase' }}>
          AETHER OS
        </span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic', marginBottom: 8 }}>
        "Built for hunters. Not for the weak."
      </p>
      <p style={{ fontSize: 11, color: 'var(--text-faint)' }}>© 2026 AetherOS. All rights reserved.</p>
    </footer>
  )
}
