import { useState, useRef } from 'react'
import { useInView } from '../hooks/useInView'
import { useWindowWidth } from '../hooks/useWindowWidth'

const TASKS = [
  { id: 'work',     label: 'Ship the feature',  category: 'Work',     xp: 50,  color: '#b76dff' },
  { id: 'health',   label: '30-min workout',     category: 'Health',   xp: 40,  color: '#adc6ff' },
  { id: 'learning', label: 'Read 20 pages',      category: 'Learning', xp: 30,  color: '#10B981' },
  { id: 'personal', label: 'Plan tomorrow',      category: 'Personal', xp: 20,  color: '#f59e0b' },
]

const TIMER_MODES = [
  { id: 'deep',   label: 'Deep',   minutes: 90   },
  { id: 'flow',   label: 'Flow',   minutes: 60   },
  { id: 'sprint', label: 'Sprint', minutes: 25   },
  { id: 'custom', label: 'Custom', minutes: null },
]

type XPFloat = { id: number; x: number; amount: number }

const pieR    = 80
const pieCirc = 2 * Math.PI * pieR
const sliceLen = pieCirc / 4

export function LiveDemo() {
  const { ref, isVisible }          = useInView(0.1)
  const [done, setDone]             = useState<Set<string>>(new Set())
  const [xpTotal, setXpTotal]       = useState(0)
  const [comboCount, setComboCount] = useState(0)
  const [floats, setFloats]         = useState<XPFloat[]>([])
  const [celebrating, setCelebrating] = useState(false)
  const [selectedTimer, setSelectedTimer] = useState('sprint')
  const [customMinutes, setCustomMinutes] = useState('')
  const [xpBump, setXpBump]         = useState(false)
  const floatCounter                = useRef(0)
  const screenWidth                 = useWindowWidth()
  const isMobile                    = screenWidth < 640

  function handleComplete(task: typeof TASKS[0]) {
    if (done.has(task.id)) return
    const next = new Set(done)
    next.add(task.id)
    setDone(next)
    setXpTotal(p => p + task.xp)
    setComboCount(p => p + 1)
    setXpBump(true)
    setTimeout(() => setXpBump(false), 600)

    const id  = ++floatCounter.current
    const x   = 20 + Math.random() * 60
    setFloats(f => [...f, { id, x, amount: task.xp }])
    setTimeout(() => setFloats(f => f.filter(i => i.id !== id)), 1000)

    if (next.size === TASKS.length) {
      setTimeout(() => setCelebrating(true), 300)
      setTimeout(() => setCelebrating(false), 2500)
    }
  }

  function handleReset() {
    setDone(new Set())
    setXpTotal(0)
    setComboCount(0)
    setFloats([])
    setCelebrating(false)
    setXpBump(false)
  }

  const comboMultiplier = comboCount >= 4 ? 2.5 : comboCount >= 3 ? 2.0 : comboCount >= 2 ? 1.5 : 1.0

  const timerMins    = selectedTimer === 'custom'
    ? (parseInt(customMinutes) || 0)
    : TIMER_MODES.find(m => m.id === selectedTimer)?.minutes ?? 25
  const timerDisplay = `${String(timerMins).padStart(2, '0')}:00`

  return (
    <section id="demo" className="section" style={{ background: 'linear-gradient(180deg, var(--bg-primary) 0%, #0a0815 50%, var(--bg-primary) 100%)' }}>
      <div className="container">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`reveal${isVisible ? ' visible' : ''}`}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Interactive Demo</div>
          <h2 className="section-title">Experience it first</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Complete the quests below. Watch your progress stack up.
          </p>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 32, alignItems: 'flex-start', justifyContent: 'center',
        }}>
          {/* Pie Chart */}
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, width: isMobile ? '100%' : 280 }}>
            <div style={{ position: 'relative' }}>
              {celebrating && (
                <div style={{
                  position: 'absolute', inset: -20, borderRadius: '50%',
                  animation: 'glow-burst 0.8s ease-out forwards', pointerEvents: 'none',
                }} />
              )}
              <svg width="200" height="200" viewBox="0 0 200 200"
                style={{ overflow: 'visible' }}
                role="img"
                aria-label={`Category completion chart: ${done.size} of 4 tasks complete`}
              >
                {TASKS.map((t, i) => (
                  <circle key={`track-${t.id}`}
                    cx="100" cy="100" r={pieR} fill="none"
                    stroke={`${t.color}20`} strokeWidth="18"
                    strokeDasharray={`${sliceLen - 4} ${pieCirc - sliceLen + 4}`}
                    strokeDashoffset={-(i * sliceLen) + pieCirc * 0.25}
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '100px 100px' }}
                  />
                ))}
                {TASKS.map((t, i) => {
                  const filled = done.has(t.id)
                  return (
                    <circle key={`fill-${t.id}`}
                      cx="100" cy="100" r={pieR} fill="none"
                      stroke={t.color} strokeWidth="18" strokeLinecap="round"
                      strokeDasharray={`${filled ? sliceLen - 4 : 0} ${pieCirc}`}
                      strokeDashoffset={-(i * sliceLen) + pieCirc * 0.25}
                      style={{
                        transform: 'rotate(-90deg)', transformOrigin: '100px 100px',
                        transition: 'stroke-dasharray 0.5s cubic-bezier(0.16,1,0.3,1)',
                        filter: filled ? `drop-shadow(0 0 8px ${t.color}80)` : 'none',
                      }}
                    />
                  )
                })}
                <text x="100" y="94"  textAnchor="middle" fill="#988d9f" fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif" letterSpacing="2">DONE</text>
                <text x="100" y="116" textAnchor="middle" fill="#fff"     fontSize="28" fontWeight="700" fontFamily="Inter,sans-serif">{done.size}/4</text>
              </svg>

              {floats.map(f => (
                <div key={f.id} style={{
                  position: 'absolute', left: `${f.x}%`, top: '40%',
                  fontSize: 13, fontWeight: 700, color: '#ddb7ff',
                  pointerEvents: 'none',
                  animation: 'float-xp 0.9s ease-out forwards',
                  whiteSpace: 'nowrap',
                }}>
                  +{f.amount} XP
                </div>
              ))}
            </div>

            {/* Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', width: '100%', maxWidth: 220 }}>
              {TASKS.map(t => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: done.has(t.id) ? t.color : `${t.color}30`, flexShrink: 0, transition: 'background 0.3s' }} />
                  <span style={{ fontSize: 12, color: done.has(t.id) ? 'var(--text-secondary)' : 'var(--text-faint)', transition: 'color 0.3s' }}>{t.category}</span>
                </div>
              ))}
            </div>

            {celebrating && (
              <div style={{
                background: 'rgba(183,109,255,0.12)', border: '1px solid rgba(183,109,255,0.40)',
                borderRadius: 99, padding: '8px 20px', textAlign: 'center',
                animation: 'scale-bounce 0.4s ease-out',
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)' }}>🏆 All quests complete! +{xpTotal} XP</span>
              </div>
            )}
          </div>

          {/* Tasks + Timer */}
          <div style={{ flex: '1 1 320px', maxWidth: 480, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* XP + Combo */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: 14, padding: '14px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span
                  aria-live="polite"
                  style={{
                    fontSize: 22, fontWeight: 700,
                    color: xpTotal > 0 ? 'var(--primary)' : 'var(--text-faint)',
                    animation: xpBump ? 'xp-counter-bump 0.5s ease-out' : 'none',
                    transition: 'color 0.3s',
                  }}
                >+{xpTotal}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>XP earned</span>
              </div>
              {comboCount >= 2 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)',
                  borderRadius: 99, padding: '5px 12px',
                  animation: 'combo-pop 0.4s ease-out',
                }}>
                  <span style={{ fontSize: 13 }}>🔥</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>
                    ×{comboMultiplier.toFixed(1)} COMBO · {comboCount} in a row
                  </span>
                </div>
              )}
            </div>

            {/* Task rows */}
            {TASKS.map(task => (
              <TaskRow key={task.id} task={task} done={done.has(task.id)} onComplete={() => handleComplete(task)} />
            ))}

            {/* Reset button — appears after all tasks done */}
            {done.size === TASKS.length && (
              <button
                onClick={handleReset}
                aria-label="Reset demo and try again"
                style={{
                  padding: '11px 20px', borderRadius: 99,
                  border: '1px solid var(--border-medium)',
                  background: 'transparent', color: 'var(--text-muted)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s', animation: 'slide-in-up 0.3s ease-out',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(183,109,255,0.40)'; e.currentTarget.style.color = 'var(--primary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-medium)'; e.currentTarget.style.color = 'var(--text-muted)' }}
              >
                ↺ Reset demo
              </button>
            )}

            {/* Timer */}
            <div style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
              borderRadius: 14, padding: '16px',
              display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Focus Timer</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TIMER_MODES.map(mode => (
                  <div key={mode.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <button
                      onClick={() => setSelectedTimer(mode.id)}
                      aria-pressed={selectedTimer === mode.id}
                      aria-label={`Select ${mode.label} timer${mode.minutes ? ` (${mode.minutes} minutes)` : ''}`}
                      style={{
                        padding: '8px 14px', borderRadius: 99,
                        fontSize: 12, fontWeight: 600,
                        border: selectedTimer === mode.id ? '1px solid rgba(183,109,255,0.60)' : '1px solid var(--border-medium)',
                        background: selectedTimer === mode.id ? 'var(--primary-faint)' : 'transparent',
                        color: selectedTimer === mode.id ? 'var(--primary)' : 'var(--text-muted)',
                        transition: 'all 0.2s', cursor: 'pointer',
                      }}
                    >
                      {mode.label}{mode.minutes ? ` · ${mode.minutes}m` : ''}
                    </button>
                    {mode.id === 'custom' && selectedTimer === 'custom' && (
                      <input
                        type="number" min={1} max={480} placeholder="min"
                        value={customMinutes}
                        onChange={e => setCustomMinutes(e.target.value)}
                        aria-label="Custom timer duration in minutes"
                        style={{
                          width: 64, padding: '5px 8px',
                          background: 'var(--bg-elevated)', border: '1px solid rgba(183,109,255,0.40)',
                          borderRadius: 8, color: 'var(--primary)',
                          fontSize: 13, fontWeight: 600, textAlign: 'center', outline: 'none',
                          animation: 'scale-in 0.2s ease-out',
                        }}
                        autoFocus
                      />
                    )}
                  </div>
                ))}
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 16px',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid rgba(183,109,255,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 14 }}>⏱</span>
                </div>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: 2, fontVariantNumeric: 'tabular-nums' }}>
                  {timerMins > 0 ? timerDisplay : '--:--'}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function TaskRow({ task, done, onComplete }: { task: typeof TASKS[0]; done: boolean; onComplete: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'var(--bg-surface)', border: `1px solid ${done ? task.color + '30' : 'var(--border-default)'}`,
      borderRadius: 12, padding: '12px 14px',
      transition: 'all 0.3s ease', opacity: done ? 0.6 : 1,
    }}>
      <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: task.color, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: done ? 'line-through' : 'none', transition: 'text-decoration 0.2s' }}>{task.label}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, letterSpacing: 1, textTransform: 'uppercase' }}>{task.category}</div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: task.color, background: `${task.color}15`, border: `1px solid ${task.color}30`, borderRadius: 99, padding: '3px 8px', flexShrink: 0 }}>
        ⚡ {task.xp} XP
      </div>
      <button
        onClick={onComplete}
        disabled={done}
        aria-label={done ? `${task.label} completed` : `Complete ${task.label}`}
        style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          border: done ? `2px solid ${task.color}` : '2px solid var(--border-strong)',
          background: done ? `${task.color}20` : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: done ? 'default' : 'pointer',
          transition: 'all 0.25s ease', fontSize: 14,
        }}
        onMouseEnter={e => { if (!done) e.currentTarget.style.borderColor = task.color }}
        onMouseLeave={e => { if (!done) e.currentTarget.style.borderColor = 'var(--border-strong)' }}
      >
        {done && <span style={{ color: task.color }}>✓</span>}
      </button>
    </div>
  )
}
