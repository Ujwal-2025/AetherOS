import { useInView } from '../hooks/useInView'

const RANKS = [
  { rank: 'E',   label: 'E-Rank',   color: '#71717A', minXP: 0,      rarity: 'Common',    glow: false },
  { rank: 'D',   label: 'D-Rank',   color: '#60A5FA', minXP: 1000,   rarity: 'Uncommon',  glow: false },
  { rank: 'C',   label: 'C-Rank',   color: '#34D399', minXP: 5000,   rarity: 'Rare',      glow: false },
  { rank: 'B',   label: 'B-Rank',   color: '#FBBF24', minXP: 15000,  rarity: 'Epic',      glow: false },
  { rank: 'A',   label: 'A-Rank',   color: '#F97316', minXP: 35000,  rarity: 'Legendary', glow: false },
  { rank: 'S',   label: 'S-Rank',   color: '#ddb7ff', minXP: 70000,  rarity: 'Mythic',    glow: true  },
  { rank: 'SS',  label: 'SS-Rank',  color: '#adc6ff', minXP: 120000, rarity: 'Ancient',   glow: true  },
  { rank: 'SSS', label: 'SSS-Rank', color: '#FFFFFF', minXP: 200000, rarity: '0.1% of hunters', glow: true },
]

function formatXP(xp: number) {
  if (xp >= 1000) return `${(xp / 1000).toFixed(0)}K`
  return xp.toString()
}

export function RankLadder() {
  const { ref, isVisible } = useInView()

  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, var(--bg-primary) 0%, #06040d 50%, var(--bg-primary) 100%)' }}>
      <div className="container">
        <div
          ref={ref as React.RefObject<HTMLDivElement>}
          className={`reveal${isVisible ? ' visible' : ''}`}
          style={{ textAlign: 'center', marginBottom: 56 }}
        >
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Rank System</div>
          <h2 className="section-title">Where will you stop?</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Every completed quest moves you forward. The higher ranks are earned, not given.
          </p>
        </div>

        {/* Rank pills — scrollable on mobile */}
        <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, minWidth: 600 }}>
            {RANKS.map((r, i) => (
              <div key={r.rank} style={{ display: 'flex', alignItems: 'center' }}>
                <RankPill rank={r} index={i} />
                {i < RANKS.length - 1 && (
                  <div style={{
                    width: 20, height: 1,
                    backgroundImage: `linear-gradient(90deg, ${r.color}40, ${RANKS[i+1].color}40)`,
                    flexShrink: 0,
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* XP milestones */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap', marginTop: 40 }}>
          {RANKS.filter(r => r.glow).map(r => (
            <div key={r.rank} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: r.color, marginBottom: 4 }}>{r.rank}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1 }}>{formatXP(r.minXP)} XP</div>
              <div style={{ fontSize: 10, color: r.color, letterSpacing: 1, marginTop: 2, textTransform: 'uppercase' }}>{r.rarity}</div>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', fontSize: 15, color: 'var(--text-faint)', fontStyle: 'italic', marginTop: 40 }}>
          "SSS-Rank. 0.1% of hunters ever reach it."
        </p>
      </div>
    </section>
  )
}

function RankPill({ rank, index }: { rank: typeof RANKS[0]; index: number }) {
  const { ref, isVisible } = useInView()

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={`reveal${isVisible ? ' visible' : ''}`}
      style={{
        transitionDelay: `${index * 60}ms`,
        transition: `opacity 0.5s ease ${index * 60}ms, transform 0.5s ease ${index * 60}ms`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '14px 12px',
        background: rank.glow ? `${rank.color}08` : 'transparent',
        border: `1px solid ${rank.color}${rank.glow ? '40' : '20'}`,
        borderRadius: 12, minWidth: 64,
        animation: rank.glow ? 'rank-glow 2s ease-in-out infinite' : 'none',
      }}
    >
      <div style={{
        width: 10, height: 10, borderRadius: '50%',
        background: rank.color,
        boxShadow: rank.glow ? `0 0 10px ${rank.color}` : 'none',
      }} />
      <span style={{
        fontSize: rank.rank.length > 1 ? 14 : 18,
        fontWeight: 700,
        color: rank.color,
        letterSpacing: rank.rank.length > 1 ? 0 : 1,
        textShadow: rank.glow ? `0 0 16px ${rank.color}80` : 'none',
      }}>{rank.rank}</span>
      <span style={{ fontSize: 9, color: 'var(--text-faint)', letterSpacing: 0.5 }}>{formatXP(rank.minXP)} XP</span>
    </div>
  )
}
