import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { CircularProgress } from '../components/shared/CircularProgress';
import { GoalInputSheet, GoalPlan } from '../components/shared/GoalInputSheet';
import { GoalPlanPreviewSheet } from '../components/shared/GoalPlanPreviewSheet';
import { useUserStore } from '../store/useUserStore';
import { useTaskStore } from '../store/useTaskStore';
import { useWeeklyBossStore } from '../store/useWeeklyBossStore';
import { useAchievementStore, Achievement, AchievementCategory } from '../store/useAchievementStore';
import { RANK_THRESHOLDS } from '../utils/xp';

// ─── Achievement card ─────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  streak:  '#fbbf24',
  focus:   colors.primary.default,
  rank:    colors.secondary.default,
  tasks:   colors.success.default,
  special: '#f97316',
};

type AchFilterTab = 'all' | AchievementCategory;
const ACH_FILTERS: { key: AchFilterTab; label: string }[] = [
  { key: 'all',     label: 'All'     },
  { key: 'streak',  label: 'Streak'  },
  { key: 'focus',   label: 'Focus'   },
  { key: 'rank',    label: 'Rank'    },
  { key: 'tasks',   label: 'Tasks'   },
  { key: 'special', label: 'Special' },
];

function AchievementCard({ ach }: { ach: Achievement }) {
  const isUnlocked = !!ach.unlockedAt;
  const color      = isUnlocked ? CATEGORY_COLORS[ach.category] ?? colors.primary.default : colors.text.faint;
  const glow       = isUnlocked && Platform.OS === 'web' ? { boxShadow: `0 0 16px 2px ${color}20` } as any : {};
  return (
    <View style={[achStyles.card, isUnlocked && { borderColor: color + '30' }, glow]}>
      {isUnlocked && (
        <LinearGradient colors={[color + '0F', 'transparent']} style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} pointerEvents="none" />
      )}
      <View style={[achStyles.icon, isUnlocked
        ? { backgroundColor: color + '18', borderColor: color + '40' }
        : { backgroundColor: colors.bg.elevated, borderColor: colors.border.subtle }]}>
        <Ionicons name={isUnlocked ? ach.icon : 'lock-closed-outline'} size={isUnlocked ? 26 : 22} color={color} />
      </View>
      <AText style={[achStyles.title, { color: isUnlocked ? colors.white : colors.text.faint }]} numberOfLines={1}>
        {ach.title}
      </AText>
      <AText style={[achStyles.desc, { color: isUnlocked ? colors.text.muted : colors.text.faint + '80' }]} numberOfLines={2}>
        {ach.description}
      </AText>
      <View style={achStyles.footer}>
        <Ionicons name="flash" size={11} color={isUnlocked ? color : colors.text.faint} />
        <AText style={[achStyles.xp, { color: isUnlocked ? color : colors.text.faint }]}>+{ach.xpBonus}</AText>
        {ach.unlockedAt && (
          <AText style={achStyles.date}>
            {new Date(ach.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </AText>
        )}
      </View>
    </View>
  );
}

const achStyles = StyleSheet.create({
  card:   { width: '47%', backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle, padding: spacing[4], gap: spacing[3], overflow: 'hidden', alignItems: 'center' },
  icon:   { width: 60, height: 60, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title:  { fontFamily: fontFamily.semiBold, textAlign: 'center', fontSize: 13, letterSpacing: 0.2 },
  desc:   { fontFamily: fontFamily.regular, textAlign: 'center', fontSize: 11, lineHeight: 15 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xp:     { fontFamily: fontFamily.bold, fontSize: 12, letterSpacing: 0.5 },
  date:   { fontFamily: fontFamily.regular, color: colors.text.faint, fontSize: 10, marginLeft: 6 },
});

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; children: React.ReactNode }) {
  return (
    <View style={secStyles.wrapper}>
      <View style={secStyles.header}>
        <View style={secStyles.iconWrap}><Ionicons name={icon} size={13} color={colors.primary.default} /></View>
        <AText style={secStyles.title}>{title}</AText>
      </View>
      {children}
    </View>
  );
}

const secStyles = StyleSheet.create({
  wrapper:  { gap: spacing[3] },
  header:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  iconWrap: { width: 22, height: 22, borderRadius: radius.full, backgroundColor: colors.primary.faint, borderWidth: 1, borderColor: colors.primary.default + '30', alignItems: 'center', justifyContent: 'center' },
  title:    { fontFamily: fontFamily.bold, fontSize: 11, color: colors.text.muted, letterSpacing: 2, textTransform: 'uppercase' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export function SystemScreen() {
  const { profile, rank } = useUserStore();
  const { todaysTasks, completedToday } = useTaskStore();
  const { boss, logTaskCompletion } = useWeeklyBossStore();
  const { achievements, getUnlocked } = useAchievementStore();

  const [showGoalInput,   setShowGoalInput]   = useState(false);
  const [pendingPlan,     setPendingPlan]     = useState<GoalPlan | null>(null);
  const [pendingDate,     setPendingDate]     = useState('');
  const [showPlanPreview, setShowPlanPreview] = useState(false);
  const [achFilter, setAchFilter] = useState<AchFilterTab>('all');

  function handlePlanReady(plan: GoalPlan, targetDate: string) {
    setPendingPlan(plan);
    setPendingDate(targetDate);
    setShowGoalInput(false);
    setShowPlanPreview(true);
  }

  // ── Rank ring ──────────────────────────────────────────────────────────────
  const currentThreshIdx = RANK_THRESHOLDS.findIndex((r) => r.rank === rank);
  const currentThresh    = RANK_THRESHOLDS[currentThreshIdx];
  const nextThresh       = RANK_THRESHOLDS[currentThreshIdx + 1];
  const rankProgress     = nextThresh
    ? (profile.totalXP - currentThresh.minXP) / (nextThresh.minXP - currentThresh.minXP)
    : 1;
  const xpToNext = nextThresh ? nextThresh.minXP - profile.totalXP : 0;
  const rankColor = currentThresh?.color ?? colors.primary.default;

  // ── Today ──────────────────────────────────────────────────────────────────
  const totalToday  = todaysTasks().length;
  const doneToday   = completedToday().length;
  const completionRate = totalToday > 0 ? doneToday / totalToday : 0;

  // ── Weekly Boss ────────────────────────────────────────────────────────────
  // Progress is the higher of tasks or focus progress (whichever metric applies)
  const taskTarget  = boss.targetTasks   > 0 ? boss.targetTasks   : null;
  const focusTarget = boss.targetMinutes > 0 ? boss.targetMinutes : null;
  const taskRate    = taskTarget  ? Math.min(boss.tasksCompleted     / taskTarget,  1) : 1;
  const focusRate   = focusTarget ? Math.min(boss.focusMinutesLogged / focusTarget, 1) : 1;
  const bossProgress = taskTarget && focusTarget ? (taskRate + focusRate) / 2 : taskTarget ? taskRate : focusRate;
  // Days left in the week (Monday start)
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay(); // Mon=1 … Sun=7
  const daysLeft  = Math.max(0, 8 - dayOfWeek);

  // ── Achievements ──────────────────────────────────────────────────────────
  const unlocked  = getUnlocked();
  const totalAch  = achievements.length;
  const achPct    = totalAch > 0 ? Math.round((unlocked.length / totalAch) * 100) : 0;
  const filteredAch = achievements
    .filter((a) => achFilter === 'all' || a.category === achFilter)
    .sort((a, b) => (b.unlockedAt ? 1 : 0) - (a.unlockedAt ? 1 : 0));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['rgba(183,109,255,0.05)', 'transparent']}
        style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.30 }}
      />

      <View style={styles.header}>
        <AText variant="heading" weight="bold" style={styles.title}>System</AText>
        <AText variant="caption" color="muted">Your stats & tools</AText>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── AI Goal Planner ── */}
        <Section title="AI Goal Planner" icon="sparkles-outline">
          <Pressable style={styles.aiCard} onPress={() => setShowGoalInput(true)}>
            <LinearGradient colors={[colors.primary.default + '18', colors.primary.default + '06']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} pointerEvents="none" />
            <View style={styles.aiIconWrap}>
              <Ionicons name="sparkles" size={22} color={colors.primary.default} />
            </View>
            <View style={{ flex: 1 }}>
              <AText style={styles.aiTitle}>Generate a goal plan</AText>
              <AText style={styles.aiSub}>Describe a goal → get a full AI-generated quest plan</AText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary.default} />
          </Pressable>
        </Section>

        {/* ── Rank & Level ── */}
        <Section title="Rank Progression" icon="ribbon-outline">
          <View style={styles.rankCard}>
            <CircularProgress size={100} progress={rankProgress} strokeWidth={8} color={rankColor} trackColor="#1c1c1c">
              <View style={{ alignItems: 'center', gap: 2 }}>
                <AText style={[styles.rankBadge, { color: rankColor }]}>{rank}</AText>
                <AText style={styles.rankLabel}>RANK</AText>
              </View>
            </CircularProgress>
            <View style={styles.rankMeta}>
              <AText style={styles.rankName}>{currentThresh?.label ?? rank}</AText>
              <AText variant="caption" color="muted">{profile.totalXP.toLocaleString()} XP total</AText>
              {nextThresh && (
                <>
                  <View style={styles.rankProgressBar}>
                    <View style={[styles.rankProgressFill, { width: `${Math.round(rankProgress * 100)}%` as any, backgroundColor: rankColor }]} />
                  </View>
                  <AText variant="caption" color="faint">{xpToNext.toLocaleString()} XP to {nextThresh.rank}</AText>
                </>
              )}
              {!nextThresh && (
                <AText variant="caption" style={{ color: rankColor }}>MAX RANK — LEGEND</AText>
              )}
            </View>
          </View>
        </Section>

        {/* ── Daily Completion ── */}
        <Section title="Today's Completion" icon="checkmark-circle-outline">
          <View style={styles.completionCard}>
            <CircularProgress size={72} progress={completionRate} strokeWidth={6} color={colors.success.default} trackColor="#1c1c1c">
              <AText style={{ fontFamily: fontFamily.bold, fontSize: 14, color: colors.success.default }}>
                {Math.round(completionRate * 100)}%
              </AText>
            </CircularProgress>
            <View style={{ flex: 1, gap: 4 }}>
              <AText style={styles.completionBig}>{doneToday} / {totalToday}</AText>
              <AText variant="caption" color="muted">quests completed today</AText>
              <View style={styles.streakRow}>
                <Ionicons name="flame" size={14} color="#fbbf24" />
                <AText style={styles.streakText}>{profile.currentStreak} day streak</AText>
              </View>
            </View>
          </View>
        </Section>

        {/* ── Weekly Boss ── */}
        <Section title="Weekly Boss" icon="skull-outline">
          <View style={styles.bossCard}>
            <LinearGradient colors={['rgba(239,68,68,0.10)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} pointerEvents="none" />
            <View style={styles.bossTop}>
              <View style={{ flex: 1 }}>
                <AText style={styles.bossName}>{boss.title}</AText>
                <AText variant="caption" color="muted">{boss.description}</AText>
              </View>
              <View style={styles.bossHP}>
                <Ionicons name="time-outline" size={14} color={colors.warning.default} />
                <AText style={styles.bossHPText}>{daysLeft}d left</AText>
              </View>
            </View>
            <View style={styles.bossBar}>
              <View style={[styles.bossFill, { width: `${Math.round(bossProgress * 100)}%` as any }]} />
            </View>
            <View style={styles.bossStats}>
              {taskTarget !== null && (
                <AText variant="caption" color="muted">{boss.tasksCompleted} / {taskTarget} tasks</AText>
              )}
              {focusTarget !== null && (
                <AText variant="caption" color="muted">{Math.round(boss.focusMinutesLogged / 60 * 10) / 10}h / {focusTarget / 60}h focus</AText>
              )}
              <AText variant="caption" style={{ color: colors.warning.default }}>+{boss.bonusXP} XP reward</AText>
            </View>
            {boss.isComplete && (
              <View style={styles.bossDefeated}>
                <Ionicons name="checkmark-circle" size={16} color={colors.success.default} />
                <AText style={{ fontFamily: fontFamily.bold, fontSize: 13, color: colors.success.default }}>BOSS DEFEATED THIS WEEK</AText>
              </View>
            )}
          </View>
        </Section>

        {/* ── Achievements ── */}
        <Section title="Achievements" icon="trophy-outline">
          <View style={styles.achProgress}>
            <View style={styles.achProgressTrack}>
              <LinearGradient colors={[colors.secondary.default, colors.primary.default]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.achProgressFill, { width: `${Math.max(achPct, 2)}%` as any }]} />
            </View>
            <AText variant="caption" style={{ color: colors.secondary.default, minWidth: 36 }}>{achPct}%</AText>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
            {ACH_FILTERS.map((tab) => {
              const isActive = achFilter === tab.key;
              const c = tab.key === 'all' ? colors.primary.default : CATEGORY_COLORS[tab.key];
              return (
                <Pressable key={tab.key} style={[styles.filterChip, isActive && { borderColor: c + '60', backgroundColor: c + '15' }]} onPress={() => setAchFilter(tab.key)}>
                  <AText style={{ fontFamily: fontFamily.medium, fontSize: 12, color: isActive ? c : colors.text.muted, letterSpacing: 0.5 }}>
                    {tab.label}
                  </AText>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.achGrid}>
            {filteredAch.map((ach) => <AchievementCard key={ach.id} ach={ach} />)}
          </View>
        </Section>

        <View style={{ height: spacing[16] }} />
      </ScrollView>

      <GoalInputSheet
        visible={showGoalInput}
        onClose={() => setShowGoalInput(false)}
        onPlanReady={handlePlanReady}
      />
      <GoalPlanPreviewSheet
        visible={showPlanPreview}
        plan={pendingPlan}
        targetDate={pendingDate}
        onClose={() => setShowPlanPreview(false)}
        onConfirm={() => { setShowPlanPreview(false); setPendingPlan(null); }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg.primary },
  header:       { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[3] },
  title:        { fontSize: 26, color: colors.text.primary },
  scroll:       { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[5], paddingTop: spacing[2], gap: spacing[6] },

  // AI card
  aiCard:       { flexDirection: 'row', alignItems: 'center', gap: spacing[4], padding: spacing[4], borderRadius: radius.xl, borderWidth: 1, borderColor: colors.primary.default + '30', backgroundColor: colors.bg.surface, overflow: 'hidden' },
  aiIconWrap:   { width: 46, height: 46, borderRadius: radius.lg, backgroundColor: colors.primary.faint, borderWidth: 1, borderColor: colors.primary.default + '40', alignItems: 'center', justifyContent: 'center' },
  aiTitle:      { fontFamily: fontFamily.bold, fontSize: 15, color: colors.white, marginBottom: 2 },
  aiSub:        { fontFamily: fontFamily.regular, fontSize: 12, color: colors.text.muted, lineHeight: 16 },

  // Rank card
  rankCard:     { flexDirection: 'row', alignItems: 'center', gap: spacing[5], padding: spacing[5], backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle },
  rankBadge:    { fontFamily: fontFamily.bold, fontSize: 22, letterSpacing: 1 },
  rankLabel:    { fontFamily: fontFamily.bold, fontSize: 8, color: colors.text.faint, letterSpacing: 3 },
  rankMeta:     { flex: 1, gap: spacing[2] },
  rankName:     { fontFamily: fontFamily.bold, fontSize: 18, color: colors.white, letterSpacing: 0.5 },
  rankProgressBar: { height: 6, backgroundColor: colors.bg.high, borderRadius: radius.full, overflow: 'hidden' },
  rankProgressFill: { height: '100%', borderRadius: radius.full },

  // Completion card
  completionCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[5], padding: spacing[5], backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle },
  completionBig:  { fontFamily: fontFamily.bold, fontSize: 22, color: colors.white },
  streakRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText:     { fontFamily: fontFamily.semiBold, fontSize: 13, color: '#fbbf24' },

  // Boss card
  bossCard:     { padding: spacing[5], backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.danger.default + '30', gap: spacing[3], overflow: 'hidden' },
  bossTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bossName:     { fontFamily: fontFamily.bold, fontSize: 16, color: colors.white },
  bossHP:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bossHPText:   { fontFamily: fontFamily.bold, fontSize: 12, color: colors.danger.default },
  bossBar:      { height: 8, backgroundColor: colors.bg.high, borderRadius: radius.full, overflow: 'hidden' },
  bossFill:     { height: '100%', backgroundColor: colors.danger.default, borderRadius: radius.full },
  bossStats:    { flexDirection: 'row', gap: spacing[4], flexWrap: 'wrap' },
  bossDefeated: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingTop: spacing[2], borderTopWidth: 1, borderTopColor: colors.success.default + '30' },

  // Achievements
  achProgress:     { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  achProgressTrack: { flex: 1, height: 6, backgroundColor: colors.bg.high, borderRadius: radius.full, overflow: 'hidden' },
  achProgressFill:  { height: '100%', borderRadius: radius.full, minWidth: 4 },
  filterRow:        { gap: spacing[2], paddingBottom: spacing[2] },
  filterChip:       { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default },
  achGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
});
