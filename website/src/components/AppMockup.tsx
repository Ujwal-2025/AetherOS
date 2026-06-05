import { useInView } from '../hooks/useInView'
import { useWindowWidth } from '../hooks/useWindowWidth'

const MINI_CIRC = 2 * Math.PI * 48

function MiniRing({ progress }: { progress: number }) {
  const fill = progress * MINI_CIRC
  return (
    <svg width="108" height="108" viewBox="0 0 108 108" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="miniGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ddb7ff" />
          <stop offset="100%" stopColor="#adc6ff" />
        </linearGradient>
      </defs>
      <circle cx="54" cy="54" r="48" stroke="#1e1e1e" strokeWidth="5" fill="none" />
      <circle cx="54" cy="54" r="48" stroke="url(#miniGrad)" strokeWidth="5" fill="none"
        strokeLinecap="round"
        strokeDasharray={`${fill} ${MINI_CIRC}`}
        strokeDashoffset={MINI_CIRC * 0.25}
        style={{ transform: 'rotate(-90deg)', transformOrigin: '54px 54px' }}
      />
      <text x="54" y="49" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700" fontFamily="Inter,sans-serif">Lvl</text>
      <text x="54" y="65" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="700" fontFamily="Inter,sans-serif">42</text>
    </svg>
  )
}

function QuestRow({ title, category, xp, color }: { title: string; category: string; xp: number; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      background: '#0d0d0d', borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.05)',
      padding: '8px 10px', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#e5e2e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ fontSize: 9, color: '#988d9f', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>{category}</div>
      </div>
      <div style={{
        fontSize: 9, fontWeight: 700, color,
        background: `${color}18`, border: `1px solid ${color}30`,
        borderRadius: 99, padding: '2px 6px', flexShrink: 0,
      }}>⚡{xp}</div>
    </div>
  )
}

export function AppMockup() {
  const { ref: leftRef,  isVisible: leftVis  } = useInView()
  const { ref: rightRef, isVisible: rightVis } = useInView()
  const screenWidth = useWindowWidth()
  const phoneScale  = screenWidth < 480 ? 0.78 : screenWidth < 640 ? 0.88 : 1

  return (
    <section id="mockup" className="section">
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 64, flexWrap: 'wrap' }}>
        {/* Copy */}
        <div
          ref={leftRef as React.RefObject<HTMLDivElement>}
          className={`reveal-left${leftVis ? ' visible' : ''}`}
          style={{ flex: '1 1 280px' }}
        >
          <div className="eyebrow">App Preview</div>
          <h2 className="section-title">See every quest.<br />Track every win.</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24 }}>
            {[
              { icon: '⚡', text: 'Real-time XP tracking — every action rewarded' },
              { icon: '📋', text: 'Daily quest board across 4 life categories' },
              { icon: '⏱', text: 'Focus timer: Deep, Flow, Sprint, and Custom modes' },
            ].map(({ icon, text }) => (
              <div key={text} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: 'var(--primary-faint)', border: '1px solid rgba(183,109,255,0.20)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>{icon}</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.65, paddingTop: 8 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Phone mockup */}
        <div
          ref={rightRef as React.RefObject<HTMLDivElement>}
          className={`reveal-right${rightVis ? ' visible' : ''}`}
          style={{ flex: '1 1 280px', display: 'flex', justifyContent: 'center' }}
        >
          <div style={{ transform: `scale(${phoneScale})`, transformOrigin: 'top center' }}>
            <div style={{
              width: 280, height: 580, borderRadius: 44,
              border: '1.5px solid rgba(255,255,255,0.12)',
              background: '#050505', overflow: 'hidden',
              transform: 'rotate(-2deg)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(183,109,255,0.10)',
              position: 'relative', flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 200, pointerEvents: 'none',
                background: 'linear-gradient(180deg, rgba(183,109,255,0.08) 0%, transparent 100%)',
              }} />

              {/* Status bar */}
              <div style={{ padding: '12px 16px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#988d9f' }}>9:41</span>
                <div style={{ width: 64, height: 12, background: '#1a1a1a', borderRadius: 8 }} />
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: '#4d4354' }} />)}
                </div>
              </div>

              {/* Header */}
              <div style={{
                padding: '6px 14px 10px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#2a2a2a', border: '1px solid #4d4354', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <circle cx="6" cy="4" r="2.5" stroke="#ddb7ff" strokeWidth="1.2" />
                      <path d="M1 11c0-2.76 2.24-5 5-5s5 2.24 5 5" stroke="#ddb7ff" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 3, color: 'rgba(221,183,255,0.9)' }}>AETHER OS</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(183,109,255,0.10)', borderRadius: 99, padding: '3px 8px', border: '1px solid rgba(221,183,255,0.25)' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1.5 }}>E-RANK</span>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '10px 10px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{
                  background: 'linear-gradient(160deg, #1a1025, #0a0a0a)',
                  border: '1px solid rgba(221,183,255,0.15)', borderRadius: 14,
                  padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <MiniRing progress={0.68} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: '#adc6ff', textTransform: 'uppercase', marginBottom: 2 }}>STREAK</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>14 <span style={{ fontSize: 9, color: '#988d9f' }}>DAYS</span></div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: 2, color: '#adc6ff', textTransform: 'uppercase', marginBottom: 2 }}>RANK</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>68%</div>
                      </div>
                    </div>
                    <div style={{ height: 4, background: '#1a1a1a', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: '68%', height: '100%', background: 'linear-gradient(90deg, #b76dff, #adc6ff)', borderRadius: 99 }} />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: '#988d9f', textTransform: 'uppercase', marginBottom: 2 }}>ACTIVE QUESTS</div>
                  <QuestRow title="Ship the feature" category="Work"   xp={50} color="#ddb7ff" />
                  <QuestRow title="30-min workout"   category="Health" xp={40} color="#adc6ff" />
                </div>

                <div style={{
                  background: '#0e0e0e', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)',
                  padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: '#e5e2e1' }}>Daily Completion</div>
                    <div style={{ fontSize: 9, color: '#988d9f', marginTop: 2 }}>2 of 4 tasks</div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#adc6ff' }}>50%</div>
                </div>
              </div>

              {/* Tab bar */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(13,13,13,0.95)', borderTop: '1px solid rgba(255,255,255,0.05)',
                display: 'flex', justifyContent: 'space-around', padding: '10px 0 16px',
              }}>
                {[{ icon: '⊞', active: true }, { icon: '≡', active: false }, { icon: '◎', active: false }, { icon: '★', active: false }, { icon: '◉', active: false }]
                  .map(({ icon, active }, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                      <span style={{ fontSize: 16, color: active ? 'var(--primary)' : '#4d4354' }}>{icon}</span>
                      {active && <div style={{ width: 4, height: 2, borderRadius: 2, background: 'var(--primary)' }} />}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
