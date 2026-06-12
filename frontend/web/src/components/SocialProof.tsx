import { useInView } from '../hooks/useInView'
import { useWindowWidth } from '../hooks/useWindowWidth'

const TESTIMONIALS = [
  {
    quote: "I've tried 10 productivity apps. AetherOS is the first one I haven't deleted after a week. The combo system made me addicted to getting things done.",
    name: 'Marcus T.',
    rank: 'A-Rank',
    rankColor: '#F97316',
    detail: '47-day streak',
  },
  {
    quote: "The rank-up animation gave me actual chills. I hit S-Rank at 1am and sat there just staring at the screen. No app has ever done that to me.",
    name: 'Priya S.',
    rank: 'S-Rank',
    rankColor: '#ddb7ff',
    detail: '2,340 quests done',
  },
  {
    quote: "Focus mode with XP rewards changed how I work. 3 hours of Deep Work used to feel impossible. Now I'm annoyed when I have to stop.",
    name: 'Jordan K.',
    rank: 'B-Rank',
    rankColor: '#FBBF24',
    detail: '82 focus hours',
  },
]

const STATS = [
  { value: '1,247', label: 'Hunters Joined' },
  { value: '38K+', label: 'Quests Completed' },
  { value: 'SS',   label: 'Top Rank Reached' },
]

export function SocialProof() {
  const { ref, isVisible } = useInView()
  const width    = useWindowWidth()
  const isMobile = width < 640

  return (
    <section className="section" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 800, height: 400, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(173,198,255,0.06) 0%, transparent 65%)',
      }} />

      <div className="container" style={{ position: 'relative' }}>
        {/* Heading */}
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`reveal${isVisible ? ' visible' : ''}`}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Early Hunters</div>
          <h2 className="section-title">The hunt has already begun.</h2>
        </div>

        {/* Stats row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr 1fr' : 'repeat(3, 1fr)',
          gap: isMobile ? 12 : 24,
          marginBottom: 64,
        }}>
          {STATS.map((s, i) => (
            <div
              key={s.label}
              className={`reveal${isVisible ? ' visible' : ''}`}
              style={{
                transitionDelay: `${i * 80}ms`,
                textAlign: 'center',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 20,
                padding: isMobile ? '20px 12px' : '28px 20px',
              }}
            >
              <div style={{
                fontSize: isMobile ? 28 : 40,
                fontWeight: 800,
                letterSpacing: '-1px',
                background: 'linear-gradient(135deg, #fff 20%, var(--primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 6,
              }}>{s.value}</div>
              <div style={{ fontSize: isMobile ? 10 : 12, color: 'var(--text-faint)', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 20,
        }}>
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              className={`reveal${isVisible ? ' visible' : ''}`}
              style={{
                transitionDelay: `${i * 120}ms`,
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 20,
                padding: '28px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {/* Quote marks */}
              <div style={{ fontSize: 40, lineHeight: 1, color: 'var(--primary)', opacity: 0.4, fontFamily: 'Georgia, serif', marginBottom: -8 }}>"</div>

              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, flex: 1 }}>{t.quote}</p>

              {/* Author */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{t.detail}</div>
                </div>
                <div style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: 1.5,
                  color: t.rankColor,
                  background: `${t.rankColor}18`,
                  border: `1px solid ${t.rankColor}40`,
                  borderRadius: 99,
                  padding: '4px 10px',
                }}>
                  {t.rank}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
