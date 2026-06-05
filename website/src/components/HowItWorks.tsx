import { useInView } from '../hooks/useInView'
import { useWindowWidth } from '../hooks/useWindowWidth'

const STEPS = [
  { n: '01', icon: '✦', title: 'Create Quests',      desc: 'Add tasks across Work, Health, Learning, and Personal. Set priority, XP reward, and due date.',       color: '#b76dff' },
  { n: '02', icon: '⚡', title: 'Focus & Complete',   desc: 'Start a timed session — Deep, Flow, Sprint, or Custom. Check off quests and build your combo.',         color: '#adc6ff' },
  { n: '03', icon: '🏆', title: 'Rank Up',            desc: 'XP accumulates. Achievements unlock. You climb from E-Rank to SSS — one day at a time.',               color: '#10B981' },
]

export function HowItWorks() {
  const { ref, isVisible } = useInView()
  const width              = useWindowWidth()
  const isMobile           = width < 640

  return (
    <section className="section">
      <div className="container">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`reveal${isVisible ? ' visible' : ''}`}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <div className="eyebrow" style={{ justifyContent: 'center' }}>How It Works</div>
          <h2 className="section-title">Three steps.<br />Infinite progress.</h2>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'flex-start',
          gap: isMobile ? 0 : 0,
          justifyContent: 'center',
        }}>
          {STEPS.map((step, i) => (
            <StepCard key={step.n} step={step} index={i} last={i === STEPS.length - 1} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StepCard({ step, index, last, isMobile }: { step: typeof STEPS[0]; index: number; last: boolean; isMobile: boolean }) {
  const { ref, isVisible } = useInView()

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center' }}>
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={`reveal${isVisible ? ' visible' : ''}`}
        style={{
          transitionDelay: `${index * 150}ms`,
          transition: `opacity 0.65s cubic-bezier(0.16,1,0.3,1) ${index * 150}ms, transform 0.65s cubic-bezier(0.16,1,0.3,1) ${index * 150}ms`,
          width: isMobile ? '100%' : 280,
          padding: '28px 24px',
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          alignItems: isMobile ? 'flex-start' : 'center',
          textAlign: isMobile ? 'left' : 'center',
          gap: isMobile ? 16 : 16,
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderRadius: 20,
        }}
      >
        <div style={{
          width: 52, height: 52, borderRadius: '50%', flexShrink: 0,
          background: `${step.color}12`, border: `1.5px solid ${step.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, fontWeight: 700, color: step.color,
        }}>
          {step.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 3, color: step.color, textTransform: 'uppercase', marginBottom: 4 }}>Step {step.n}</div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>{step.title}</h3>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 }}>{step.desc}</p>
        </div>
      </div>

      {/* Connector */}
      {!last && (
        isMobile ? (
          /* Vertical dashed connector for mobile */
          <div style={{ width: 2, height: 28, marginLeft: 37, backgroundImage: 'repeating-linear-gradient(180deg, rgba(183,109,255,0.4) 0, rgba(183,109,255,0.4) 6px, transparent 6px, transparent 12px)' }} />
        ) : (
          /* Horizontal dashed connector for desktop */
          <div style={{ width: 48, height: 2, margin: '0 4px', flexShrink: 0, backgroundImage: 'repeating-linear-gradient(90deg, rgba(183,109,255,0.4) 0, rgba(183,109,255,0.4) 6px, transparent 6px, transparent 12px)' }} />
        )
      )}
    </div>
  )
}
