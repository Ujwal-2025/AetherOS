// ─── Rank System ──────────────────────────────────────────────────────────────

export type Rank = 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface RankThreshold {
  rank:  Rank;
  minXP: number;
  label: string;
  color: string;
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskPriority  = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus    = 'pending' | 'in_progress' | 'completed' | 'failed';
export type TaskCategory  = string;
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id:                string;
  title:             string;
  description?:      string;
  priority:          TaskPriority;
  status:            TaskStatus;
  category:          TaskCategory;
  xpReward:          number;
  dueDate?:          number; // epoch ms
  recurrence:        RecurrenceType;
  estimatedMinutes?: number;
  completedAt?:      number;
  createdAt:         number;
  tags?:             string[];
}

// ─── Focus Session ────────────────────────────────────────────────────────────

export type FocusMode = 'deep' | 'flow' | 'sprint' | 'custom';

export interface FocusSession {
  id:              string;
  taskId?:         string;
  mode:            FocusMode;
  durationMinutes: number;
  completedAt:     number;
  xpEarned:        number;
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export interface UserProfile {
  uid:               string;
  displayName:       string;
  totalXP:           number;
  rank:              Rank;
  currentStreak:     number;
  longestStreak:     number;
  lastActiveDate:    string; // YYYY-MM-DD
  tasksCompleted:    number;
  focusMinutesTotal: number;
  createdAt:         number;
}

// ─── Streak ───────────────────────────────────────────────────────────────────

export interface StreakData {
  current:        number;
  longest:        number;
  lastActiveDate: string;
  isActiveToday:  boolean;
}

// ─── Recovery Protocol ────────────────────────────────────────────────────────

export type RecoveryTrigger = 'missed_day' | 'low_completion' | 'manual';

export interface RecoveryProtocol {
  id:             string;
  triggeredAt:    number;
  trigger:        RecoveryTrigger;
  completedSteps: string[];
  isComplete:     boolean;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface DayStats {
  date:           string; // YYYY-MM-DD
  tasksCompleted: number;
  xpEarned:       number;
  focusMinutes:   number;
  streakDay:      number;
}

export interface WeeklySummary {
  weekStart:      string;
  tasksCompleted: number;
  totalXP:        number;
  focusMinutes:   number;
  avgDailyXP:     number;
  bestDay:        string;
  rankProgress:   number; // 0–1
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Main:       undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Tasks:     undefined;
  Focus:     undefined;
  Rewards:   undefined;
  Profile:   undefined;
};
