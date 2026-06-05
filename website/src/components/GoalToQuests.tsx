import { useState, useRef } from 'react'
import { useInView } from '../hooks/useInView'

type Quest = {
  title: string
  description: string
  category: 'health' | 'work' | 'learning' | 'personal'
  priority: 'low' | 'medium' | 'high' | 'critical'
  xpReward: number
}

const CATEGORY_COLORS: Record<Quest['category'], string> = {
  work:     '#b76dff',
  health:   '#adc6ff',
  learning: '#10B981',
  personal: '#f59e0b',
}
const CATEGORY_ICONS: Record<Quest['category'], string> = {
  work: '💼', health: '🏃', learning: '📚', personal: '🌟',
}
const PRIORITY_COLORS: Record<Quest['priority'], string> = {
  low: '#988d9f', medium: '#adc6ff', high: '#b76dff', critical: '#ffb4ab',
}

export function GoalToQuests() {
  const { ref, isVisible } = useInView()
  const [goal, setGoal] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [quests, setQuests] = useState<Quest[]>([])
  const [errorCountdown, setErrorCountdown] = useState(0)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function handleGenerate() {
    if (!goal.trim() || state === 'loading') return
    setState('loading')
    setQuests([])
    try {
      const res = await fetch('/api/generate-quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim().slice(0, 300) }),
      })
      if (!res.ok) throw new Error('rate_limit')
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error('parse')
      setQuests(data.slice(0, 5))
      setState('done')
    } catch {
      setState('error')
      setErrorCountdown(60)
      countdownRef.current = setInterval(() => {
        setErrorCountdown(n => {
          if (n <= 1) {
            clearInterval(countdownRef.current!)
            setState('idle')
            return 0
          }
          return n - 1
        })
      }, 1000)
    }
  }

  return (
    <section className="section" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700, height: 400, pointerEvents: 'none',
        background: 'radial-gradient(ellipse, rgba(183,109,255,0.08) 0%, transparent 65%)',
      }} />

      <div className="container" style={{ position: 'relative' }}>
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`reveal${isVisible ? ' visible' : ''}`}
          style={{ textAlign: 'center', marginBottom: 48 }}
        >
          <div className="eyebrow" style={{ justifyContent: 'center' }}>AI Quest Generator</div>
          <h2 className="section-title">Tell AetherOS<br />your goal</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Describe what you want to achieve. AetherOS will build your quest board.
          </p>
        </div>

        {/* Input */}
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <textarea
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="I want to get fit in 3 months and improve my coding skills…"
            disabled={state === 'loading'}
            rows={3}
            style={{
              width: '100%', padding: '16px 20px',
              background: 'var(--bg-surface)', border: '1px solid var(--border-medium)',
              borderRadius: 16, color: 'var(--text-primary)',
              fontSize: 15, lineHeight: 1.65, resize: 'vertical',
              outline: 'none', transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = 'rgba(183,109,255,0.50)' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--border-medium)' }}
          />

          <button
            onClick={handleGenerate}
            disabled={!goal.trim() || state === 'loading' || state === 'error'}
            className={state === 'loading' || state === 'error' ? '' : 'btn btn-primary'}
            style={{
              alignSelf: 'center',
              padding: '14px 32px', borderRadius: 9999,
              fontSize: 15, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: (!goal.trim() || state === 'error') ? 0.5 : 1,
              cursor: (!goal.trim() || state === 'loading' || state === 'error') ? 'not-allowed' : 'pointer',
              background: state === 'loading' ? 'var(--bg-elevated)' : undefined,
              color: state === 'loading' ? 'var(--text-muted)' : undefined,
              border: state === 'loading' ? '1px solid var(--border-medium)' : undefined,
            }}
          >
            {state === 'loading' ? (
              <>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid transparent', borderTopColor: 'var(--primary)', animation: 'spin 0.7s linear infinite' }} />
                Summoning quests…
              </>
            ) : 'Generate Quests →'}
          </button>

          {/* Error banner */}
          {state === 'error' && (
            <div style={{
              background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.35)',
              borderRadius: 12, padding: '12px 16px', textAlign: 'center',
              animation: 'slide-in-up 0.3s ease-out',
            }}>
              <span style={{ fontSize: 14, color: '#f59e0b' }}>
                AetherOS is resting… retrying in {errorCountdown}s
              </span>
            </div>
          )}
        </div>

        {/* Loading skeletons */}
        {state === 'loading' && (
          <div style={{ maxWidth: 640, margin: '32px auto 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 80, borderRadius: 14,
                background: 'linear-gradient(90deg, var(--bg-surface) 25%, var(--bg-elevated) 50%, var(--bg-surface) 75%)',
                backgroundSize: '600px 100%',
                animation: `shimmer 1.4s ease-in-out infinite`,
                animationDelay: `${i * 0.15}s`,
              }} />
            ))}
          </div>
        )}

        {/* Quest cards */}
        {state === 'done' && quests.length > 0 && (
          <div style={{ maxWidth: 640, margin: '32px auto 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {quests.map((q, i) => (
              <QuestCard key={i} quest={q} index={i} />
            ))}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 16, fontStyle: 'italic' }}>
                "These are your quests. Now go earn them."
              </p>
              <a href="#waitlist" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                Join Waitlist to Start →
              </a>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function QuestCard({ quest, index }: { quest: Quest; index: number }) {
  const color = CATEGORY_COLORS[quest.category]
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 0,
      background: 'var(--bg-surface)', border: `1px solid ${color}25`,
      borderRadius: 14, overflow: 'hidden',
      animation: `slide-in-up 0.4s cubic-bezier(0.16,1,0.3,1) ${index * 80}ms both`,
    }}>
      <div style={{ width: 4, background: color, flexShrink: 0 }} />
      <div style={{ flex: 1, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, flexShrink: 0,
          background: `${color}15`, border: `1px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
        }}>
          {CATEGORY_ICONS[quest.category]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{quest.title}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {quest.description}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
            color: PRIORITY_COLORS[quest.priority],
            background: `${PRIORITY_COLORS[quest.priority]}18`,
            border: `1px solid ${PRIORITY_COLORS[quest.priority]}30`,
            borderRadius: 99, padding: '2px 8px',
          }}>
            {quest.priority}
          </div>
          <div style={{
            fontSize: 12, fontWeight: 700, color,
            background: `${color}15`, border: `1px solid ${color}30`,
            borderRadius: 99, padding: '3px 8px',
          }}>
            ⚡ {quest.xpReward} XP
          </div>
        </div>
      </div>
    </div>
  )
}
