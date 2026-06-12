// Derived directly from the AetherOS design mockups
// Primary = light lavender (#ddb7ff) used as foreground on dark
// Primary Container = mid-violet (#b76dff) used for glows/fills
// Secondary = electric blue (#adc6ff) used as accent

export const colors = {
  // ─── Backgrounds ─────────────────────────────────────────────
  bg: {
    primary:  '#050505',       // True AMOLED black
    surface:  '#131313',       // Card/panel base
    elevated: '#1b1b1c',       // Slightly raised surfaces
    overlay:  '#202020',       // Surface container
    high:     '#2a2a2a',       // Surface container high
    highest:  '#353535',       // Surface container highest
  },

  // ─── Borders ─────────────────────────────────────────────────
  border: {
    subtle:  'rgba(255,255,255,0.03)',
    default: 'rgba(255,255,255,0.05)',
    medium:  'rgba(255,255,255,0.08)',
    strong:  'rgba(255,255,255,0.10)',
    outline: '#4d4354',
  },

  // ─── Primary — Lavender Violet ────────────────────────────────
  primary: {
    default:   '#ddb7ff',       // Light lavender — icons, text, active states
    container: '#b76dff',       // Mid-violet — fills, glows
    deep:      '#842bd2',       // Deep violet — inverse/emphasis
    faint:     'rgba(183,109,255,0.10)',
    glow:      'rgba(183,109,255,0.40)',
    glowStrong:'rgba(183,109,255,0.80)',
  },

  // ─── Secondary — Electric Blue ────────────────────────────────
  secondary: {
    default:    '#adc6ff',       // Light blue — secondary actions/data
    container:  '#0566d9',       // Deep blue fill
    faint:      'rgba(173,198,255,0.10)',
    glow:       'rgba(173,198,255,0.40)',
    glowStrong: 'rgba(173,198,255,0.80)',
  },

  // ─── Status ───────────────────────────────────────────────────
  success: {
    default: '#10B981',
    faint:   'rgba(16,185,129,0.10)',
    glow:    'rgba(16,185,129,0.40)',
  },
  warning: {
    default: '#f59e0b',
    faint:   'rgba(245,158,11,0.10)',
    glow:    'rgba(245,158,11,0.60)',
  },
  danger: {
    default:   '#ffb4ab',
    container: '#93000a',
    faint:     'rgba(147,0,10,0.20)',
  },

  // ─── Text ─────────────────────────────────────────────────────
  text: {
    primary:   '#e5e2e1',
    secondary: '#cfc2d6',
    muted:     '#988d9f',
    faint:     '#4d4354',
  },

  // ─── Pure ─────────────────────────────────────────────────────
  white:       '#FFFFFF',
  black:       '#000000',
  transparent: 'transparent',
} as const;

export type Colors = typeof colors;
