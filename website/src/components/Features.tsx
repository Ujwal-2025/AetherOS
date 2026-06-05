import { useInView } from '../hooks/useInView'

const FEATURES = [
  {
    icon: '⚡',
    title: 'XP & Rank System',
    desc: 'Every completed task earns XP. Accumulate enough and you rank up — from E all the way to SSS. The higher you climb, the rarer the title.',
    color: '#b76dff',
    delay: 0,
  },
  {
    icon: '📋',
    title: 'Daily Quest Board',
    desc: 'Tasks across Work, Health, Learning, and Personal — all unified in one place. Your day, structured like a dungeon.',
    color: '#adc6ff',
    delay: 100,
  },
  {
    icon: '⏱',
    title: 'Focus Mode',
    desc: 'Deep Work (90m) · Flow State (60m) · Sprint (25m) — or set any custom duration. Every minute counts toward your XP.',
    color: '#10B981',
    delay: 200,
  },
  {
    icon: '🔥',
    title: 'Streak Engine',
    desc: 'Miss a single day and your streak resets. After 9 PM with nothing done, AetherOS will warn you. Consistency is the only cheat code.',
    color: '#f59e0b',
    delay: 300,
  },
]

export function Features() {
  const { ref, isVisible } = useInView()

  return (
    <section className="section" style={{ background: 'var(--bg-primary)' }}>
      <div className="container">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`reveal${isVisible ? ' visible' : ''}`}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Core Systems</div>
          <h2 className="section-title">Built to keep you<br />coming back</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Every feature is designed around one principle: make progress visible, make rewards immediate.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {FEATURES.map(({ icon, title, desc, color, delay }) => (
            <FeatureCard key={title} icon={icon} title={title} desc={desc} color={color} delay={delay} />
          ))}
        </div>
      </div>
    </section>
  )
}

function FeatureCard({ icon, title, desc, color, delay }: { icon: string; title: string; desc: string; color: string; delay: number }) {
  const { ref, isVisible } = useInView()

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal${isVisible ? ' visible' : ''}`}
      style={{
        transitionDelay: `${delay}ms`,
        background: 'var(--bg-surface)',
        border: `1px solid ${color}20`,
        borderRadius: 20,
        padding: '28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        position: 'relative',
        overflow: 'hidden',
        transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget
        el.style.borderColor = `${color}50`
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = `0 12px 40px ${color}15`
      }}
      onMouseLeave={e => {
        const el = e.currentTarget
        el.style.borderColor = `${color}20`
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}15`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 }}>{desc}</p>
      </div>
    </div>
  )
}
