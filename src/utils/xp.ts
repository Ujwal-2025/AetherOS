import { Rank, RankThreshold, TaskPriority } from '../types';
import { colors } from '../theme';

// ─── Rank Thresholds ──────────────────────────────────────────────────────────

export const RANK_THRESHOLDS: RankThreshold[] = [
  { rank: 'E',   minXP: 0,       label: 'E-Rank',   color: '#71717A' },
  { rank: 'D',   minXP: 1000,    label: 'D-Rank',   color: '#60A5FA' },
  { rank: 'C',   minXP: 5000,    label: 'C-Rank',   color: '#34D399' },
  { rank: 'B',   minXP: 15000,   label: 'B-Rank',   color: '#FBBF24' },
  { rank: 'A',   minXP: 35000,   label: 'A-Rank',   color: '#F97316' },
  { rank: 'S',   minXP: 70000,   label: 'S-Rank',   color: colors.primary.default },
  { rank: 'SS',  minXP: 120000,  label: 'SS-Rank',  color: colors.secondary.default },
  { rank: 'SSS', minXP: 200000,  label: 'SSS-Rank', color: '#FFFFFF' },
];

// ─── XP Rewards per Priority ─────────────────────────────────────────────────

export const XP_BY_PRIORITY: Record<TaskPriority, number> = {
  low:      50,
  medium:   150,
  high:     300,
  critical: 600,
};

// ─── Core Functions ───────────────────────────────────────────────────────────

export function getRankFromXP(totalXP: number): Rank {
  const threshold = [...RANK_THRESHOLDS]
    .reverse()
    .find((t) => totalXP >= t.minXP);
  return threshold?.rank ?? 'E';
}

export function getRankThreshold(rank: Rank): RankThreshold {
  return RANK_THRESHOLDS.find((t) => t.rank === rank) ?? RANK_THRESHOLDS[0];
}

export function getNextRankThreshold(rank: Rank): RankThreshold | null {
  const index = RANK_THRESHOLDS.findIndex((t) => t.rank === rank);
  return RANK_THRESHOLDS[index + 1] ?? null;
}

/** Returns progress 0–1 within the current rank range */
export function getRankProgress(totalXP: number): number {
  const rank    = getRankFromXP(totalXP);
  const current = getRankThreshold(rank);
  const next    = getNextRankThreshold(rank);
  if (!next) return 1;
  const range  = next.minXP - current.minXP;
  const earned = totalXP - current.minXP;
  return Math.min(earned / range, 1);
}

export function getXPToNextRank(totalXP: number): number {
  const rank = getRankFromXP(totalXP);
  const next = getNextRankThreshold(rank);
  if (!next) return 0;
  return Math.max(next.minXP - totalXP, 0);
}

export function formatXP(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(1)}M`;
  if (xp >= 1_000)     return `${(xp / 1_000).toFixed(1)}K`;
  return xp.toString();
}

/** Streak multiplier: every 7-day streak gives +10% XP, capped at +50% */
export function getStreakMultiplier(streak: number): number {
  const bonus = Math.min(Math.floor(streak / 7) * 0.1, 0.5);
  return 1 + bonus;
}

export function calcTaskXP(priority: TaskPriority, streak: number): number {
  const base       = XP_BY_PRIORITY[priority];
  const multiplier = getStreakMultiplier(streak);
  return Math.round(base * multiplier);
}
