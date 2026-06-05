import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { CircularProgress } from '../components/shared/CircularProgress';
import { XPBar } from '../components/shared/XPBar';
import { QuestCard } from '../components/shared/QuestCard';
import { RankUpOverlay } from '../components/shared/RankUpOverlay';
import { DailyChallengeCard } from '../components/shared/DailyChallengeCard';
import { DailyCompletionSheet } from '../components/shared/DailyCompletionSheet';
import { MetricDetailSheet } from '../components/shared/MetricDetailSheet';
import { DayCompleteOverlay } from '../components/shared/DayCompleteOverlay';
import { WeeklyBossCard } from '../components/shared/WeeklyBossCard';
import { useUserStore } from '../store/useUserStore';
import { useTaskStore } from '../store/useTaskStore';
import { useFocusStore } from '../store/useFocusStore';
import { useAchievementStore } from '../store/useAchievementStore';
import { useStatsStore } from '../store/useStatsStore';
import { useWeeklyBossStore } from '../store/useWeeklyBossStore';
import { useRef } from 'react';
import { getRankThreshold, getNextRankThreshold } from '../utils/xp';
import { haptics } from '../utils/haptics';
import { MainTabParamList, FocusMode, Task, TaskCategory } from '../types';

// Derive focus mode from a task's estimated duration
function modeFromDuration(minutes?: number): FocusMode {
  if (!minutes || minutes <= 25) return 'sprint';
  if (minutes <= 60)             return 'flow';
  return 'deep';
}

// ─── Metric config — each card maps 1:1 to a TaskCategory ────────────────────
type MetricConfig = {
  label:     string;
  category:  TaskCategory;
  color:     string;
  icon:      keyof typeof Ionicons.glyphMap;
  highlight: boolean;
};

const METRIC_CONFIG: MetricConfig[] = [
  { label: 'Work',     category: 'work',     color: colors.primary.default,   icon: 'code-slash-outline', highlight: false },
  { label: 'Health',   category: 'health',   color: colors.secondary.default, icon: 'fitness-outline',    highlight: true  },
  { label: 'Learning', category: 'learning', color: colors.success.default,   icon: 'book-outline',       highlight: false },
  { label: 'Personal', category: 'personal', color: colors.warning.default,   icon: 'person-outline',     highlight: false },
];

export function DashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { profile, rank, rankProgress, pendingRankUp, clearRankUp, comboMultiplier, comboCount,
          addXP, incrementTasksCompleted, incrementCombo, streakShields } = useUserStore();
  const { todaysTasks, completedToday, completionRateToday, xpEarnedToday, completeTask } = useTaskStore();
  const { setPendingTask } = useFocusStore();
  const { checkAchievements, getUnlocked } = useAchievementStore();
  const { recordActivity, deepWorkSessions, recordCategoryActivity, categoryStreaks } = useStatsStore();
  const { logTaskCompletion: bossTick } = useWeeklyBossStore();

  const [showCompletionDetail, setShowCompletionDetail] = useState(false);
  const [selectedMetric,       setSelectedMetric]       = useState<MetricConfig | null>(null);
  const [showDayComplete,      setShowDayComplete]      = useState(false);
  const hasCelebrated = useRef(false);

  const rankInfo       = getRankThreshold(rank);
  const nextRank       = getNextRankThreshold(rank);
  const activeTasks    = todaysTasks().filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completedCount = completedToday().length;
  const totalToday     = todaysTasks().length;
  const completionRate = completionRateToday();

  useEffect(() => {
    if (completionRate === 1 && totalToday > 0 && !hasCelebrated.current) {
      hasCelebrated.current = true;
      setShowDayComplete(true);
    }
    if (completionRate < 1) hasCelebrated.current = false;
  }, [completionRate, totalToday]);
  const todayXP        = xpEarnedToday();
  const nextRankXP     = nextRank ? nextRank.minXP : profile.totalXP;
  const level          = Math.floor(profile.totalXP / 1000) + 1;
  const medalCount     = getUnlocked().length;

  // Streak danger zone — after 9 PM with zero tasks done
  const hour         = new Date().getHours();
  const streakAtRisk = hour >= 21 && completedCount === 0 && profile.currentStreak > 0;
  const dangerOpacity = useSharedValue(1);

  useEffect(() => {
    if (streakAtRisk) {
      haptics.warning();
      dangerOpacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 600 }), withTiming(1.0, { duration: 600 })), -1, true);
    } else {
      dangerOpacity.value = 1;
    }
  }, [streakAtRisk]);

  const streakDangerStyle = useAnimatedStyle(() => ({ opacity: dangerOpacity.value }));

  // Tap quest card → derive mode from its duration, start immediately
  function handleStartTask(task: Task) {
    haptics.light();
    const mode = modeFromDuration(task.estimatedMinutes);
    setPendingTask(task.id, task.title, mode);
    navigation.navigate('Focus');
  }

  // Checkmark button → complete the task in-place
  function handleCompleteTask(taskId: string) {
    haptics.success();
    const task    = activeTasks.find((t) => t.id === taskId);
    const baseXp  = completeTask(taskId, profile.currentStreak);
    const earned  = Math.round(baseXp * comboMultiplier);
    addXP(earned);
    incrementTasksCompleted();
    incrementCombo();
    if (task) recordCategoryActivity(task.category);
    bossTick();
    recordActivity({ xpEarned: earned, tasksCompleted: 1, streakDay: profile.currentStreak });
    checkAchievements({
      totalTasks:       profile.tasksCompleted + 1,
      currentStreak:    profile.currentStreak,
      longestStreak:    profile.longestStreak,
      rank,
      focusMinutes:     profile.focusMinutesTotal,
      todayTasks:       completedToday().length + 1,
      completionHour:   new Date().getHours(),
      deepWorkSessions,
    });
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['rgba(183,109,255,0.06)', 'transparent']} style={[styles.ambientTop, { pointerEvents: 'none' }]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}><Ionicons name="person" size={16} color={colors.primary.default} /></View>
          <AText variant="subheading" weight="bold" style={styles.logo}>AETHER OS</AText>
        </View>
        <View style={styles.rankPill}>
          <Ionicons name="ribbon" size={12} color={colors.primary.default} />
          <AText variant="label" weight="bold" uppercase style={{ color: colors.primary.default, letterSpacing: 1.5 }}>{rankInfo.label}</AText>
        </View>
      </View>

      {/* Streak Danger Banner */}
      {streakAtRisk && (
        <View style={styles.dangerBanner}>
          <Ionicons name="warning" size={14} color={colors.danger.default} />
          <AText style={styles.dangerText}>⚠  STREAK AT RISK — complete a quest before midnight</AText>
        </View>
      )}

      {/* Combo Banner */}
      {comboMultiplier > 1.0 && (
        <View style={styles.comboBanner}>
          <AText style={styles.comboText}>🔥  ×{comboMultiplier.toFixed(1)} COMBO  ·  {comboCount} in a row</AText>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.heroCard, streakAtRisk && { borderColor: colors.danger.default + '40' }]}>
          <LinearGradient colors={['#1a1025', '#0a0a0a']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
          <View style={[styles.heroGlowBlob, { pointerEvents: 'none' }]} />
          <View style={styles.heroContent}>
            <View style={styles.levelRingWrapper}>
              <View style={[styles.pulseRing, styles.pulseRingOuter]} />
              <View style={[styles.pulseRing, styles.pulseRingInner]} />
              <CircularProgress size={192} progress={rankProgress} strokeWidth={6} gradientColors={[colors.primary.default, colors.secondary.default]} trackColor="#2a2a2a">
                <View style={styles.levelCenter}>
                  <AText variant="label" color="muted" uppercase style={{ letterSpacing: 2 }}>Level</AText>
                  <AText variant="display" weight="bold" style={styles.levelNumber}>{level}</AText>
                </View>
              </CircularProgress>
            </View>
            <View style={styles.statsPanel}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <AText variant="label" style={{ color: streakAtRisk ? colors.danger.default : colors.secondary.default, letterSpacing: 2, fontSize: 9 }} uppercase>Streak</AText>
                  <View style={styles.statValueRow}>
                    <Animated.Text style={[styles.statNumberLarge, { color: streakAtRisk ? colors.danger.default : colors.white }, streakAtRisk && streakDangerStyle]}>
                      {profile.currentStreak}
                    </Animated.Text>
                    <AText variant="caption" color="muted"> DAYS</AText>
                  </View>
                  {streakAtRisk && <AText style={styles.streakRiskLabel}>AT RISK</AText>}
                  {streakShields > 0 && (
                    <View style={styles.shieldBadge}>
                      <Ionicons name="shield-checkmark" size={10} color={colors.secondary.default} />
                      <AText style={styles.shieldText}>{streakShields} SHIELD{streakShields > 1 ? 'S' : ''}</AText>
                    </View>
                  )}
                </View>
                <View style={styles.statDivider} />
                <View style={[styles.statItem, { alignItems: 'flex-end' }]}>
                  <AText variant="label" style={{ color: colors.secondary.default, letterSpacing: 2, fontSize: 9 }} uppercase>{rankInfo.label}</AText>
                  <View style={styles.statValueRow}>
                    <AText variant="heading" weight="bold" style={styles.statNumber}>{Math.round(rankProgress * 100)}%</AText>
                  </View>
                </View>
              </View>
              <XPBar currentXP={profile.totalXP} nextRankXP={nextRankXP} progress={rankProgress} />
            </View>
          </View>
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}><Ionicons name="flash" size={22} color={colors.primary.default} /><View><AText variant="subheading" weight="bold" style={styles.badgeNumber}>{activeTasks.length}</AText><AText variant="label" color="muted" style={{ fontSize: 9, letterSpacing: 1 }}>ACTIVE</AText></View></View>
            <View style={styles.heroBadge}><Ionicons name="ribbon" size={22} color={colors.text.muted} /><View><AText variant="subheading" weight="bold" style={styles.badgeNumber}>{medalCount}</AText><AText variant="label" color="muted" style={{ fontSize: 9, letterSpacing: 1 }}>MEDALS</AText></View></View>
          </View>
        </View>

        {/* Daily Completion Card — tap to open detail sheet */}
        <Pressable
          style={styles.completionCard}
          onPress={() => { haptics.light(); setShowCompletionDetail(true); }}
        >
          <View style={styles.completionTop}>
            <View style={styles.completionLeft}>
              <View style={styles.completionIcon}><Ionicons name="calendar-outline" size={22} color={colors.primary.default} /></View>
              <View>
                <AText variant="body" weight="semiBold" style={styles.completionTitle}>Daily Completion</AText>
                <AText variant="caption" color="muted" style={{ marginTop: 2 }}>{completedCount} of {totalToday} tasks completed</AText>
              </View>
            </View>
            <CircularProgress size={72} progress={completionRate} strokeWidth={6} color={colors.secondary.default} trackColor="#222222">
              <AText variant="body" weight="bold" style={{ color: colors.white }}>{Math.round(completionRate * 100)}%</AText>
            </CircularProgress>
          </View>
          <View style={styles.completionBarTrack}>
            <LinearGradient colors={[colors.primary.container, colors.secondary.default]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.completionBarFill, { width: `${Math.max(completionRate * 100, 2)}%` as any }]} />
          </View>
          <View style={styles.completionStats}>
            <View style={styles.completionStat}><AText variant="label" color="muted" uppercase style={{ letterSpacing: 1.5, fontSize: 9 }}>Completed</AText><AText variant="subheading" weight="bold">{completedCount}</AText></View>
            <View style={[styles.completionStat, styles.completionStatBordered]}><AText variant="label" color="muted" uppercase style={{ letterSpacing: 1.5, fontSize: 9 }}>Total</AText><AText variant="subheading" weight="bold">{totalToday}</AText></View>
            <View style={styles.completionStat}><AText variant="label" color="muted" uppercase style={{ letterSpacing: 1.5, fontSize: 9 }}>XP Today</AText><AText variant="subheading" weight="bold" style={{ color: colors.primary.default }}>+{todayXP}</AText></View>
          </View>
        </Pressable>

        {/* Daily Challenge */}
        <DailyChallengeCard />

        {/* Weekly Boss */}
        <WeeklyBossCard />

        {/* Active Quests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}><Ionicons name="radio-button-on" size={18} color={colors.primary.default} /><AText variant="caption" weight="bold" uppercase style={styles.sectionLabel}>Active Quests</AText></View>
            <Pressable><AText variant="caption" style={{ color: colors.primary.default, letterSpacing: 1 }}>View All</AText></Pressable>
          </View>
          <View style={styles.questList}>
            {activeTasks.slice(0, 3).map((task) => (
              <QuestCard
                key={task.id}
                task={task}
                onStart={() => handleStartTask(task)}
                onComplete={() => handleCompleteTask(task.id)}
              />
            ))}
            {activeTasks.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle-outline" size={32} color={colors.success.default} />
                <AText variant="body" color="muted" style={{ textAlign: 'center' }}>All quests complete for today.</AText>
              </View>
            )}
          </View>
        </View>

        {/* System Metrics */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitle}><Ionicons name="analytics-outline" size={18} color={colors.secondary.default} /><AText variant="caption" weight="bold" uppercase style={styles.sectionLabel}>System Metrics</AText></View>
          </View>
          <View style={styles.metricsGrid}>
            {METRIC_CONFIG.map((m) => {
              const catTasks  = todaysTasks().filter((t) => t.category === m.category);
              const catDone   = catTasks.filter((t) => t.status === 'completed').length;
              const catRate   = catTasks.length > 0 ? catDone / catTasks.length : 0;
              return (
                <MetricRing
                  key={m.category}
                  label={m.label}
                  value={catRate}
                  color={m.color}
                  icon={m.icon}
                  highlight={m.highlight}
                  streak={categoryStreaks[m.category] ?? 0}
                  onPress={() => { haptics.light(); setSelectedMetric(m); }}
                />
              );
            })}
          </View>
        </View>

        <View style={{ height: spacing[12] }} />
      </ScrollView>

      <DayCompleteOverlay visible={showDayComplete} xpEarned={todayXP} streak={profile.currentStreak} onDismiss={() => setShowDayComplete(false)} />
      <RankUpOverlay rank={pendingRankUp ?? 'E'} visible={pendingRankUp !== null} onDismiss={clearRankUp} />
      <DailyCompletionSheet visible={showCompletionDetail} onClose={() => setShowCompletionDetail(false)} />
      {selectedMetric && (
        <MetricDetailSheet
          visible={!!selectedMetric}
          onClose={() => setSelectedMetric(null)}
          category={selectedMetric.category}
          label={selectedMetric.label}
          color={selectedMetric.color}
          icon={selectedMetric.icon}
        />
      )}
    </SafeAreaView>
  );
}

function MetricRing({ label, value, color, icon, highlight = false, streak = 0, onPress }: {
  label: string; value: number; color: string;
  icon: keyof typeof Ionicons.glyphMap; highlight?: boolean; streak?: number; onPress?: () => void;
}) {
  return (
    <Pressable
      style={[styles.metricCard, highlight && { borderColor: color + '30' }]}
      onPress={onPress}
    >
      {highlight && <View style={[styles.metricGlow, { backgroundColor: color + '15' }]} />}
      <CircularProgress size={80} progress={value} strokeWidth={6} color={color} trackColor="#1a1a1a">
        <View style={{ alignItems: 'center' }}>
          <AText variant="caption" weight="bold" style={{ color: colors.white, fontSize: 13 }}>
            {Math.round(value * 100)}%
          </AText>
          <Ionicons name={icon} size={12} color={colors.text.muted} style={{ marginTop: 2 }} />
        </View>
      </CircularProgress>
      <AText variant="label" uppercase style={{ color: highlight ? colors.white : colors.text.muted, letterSpacing: 2, fontSize: 9, fontFamily: highlight ? fontFamily.bold : fontFamily.medium }}>
        {label}
      </AText>
      {streak > 1 && (
        <View style={[styles.catStreakBadge, { borderColor: color + '40', backgroundColor: color + '12' }]}>
          <Ionicons name="flame" size={9} color={color} />
          <AText style={[styles.catStreakText, { color }]}>{streak}d</AText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg.primary },
  ambientTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 300, zIndex: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[4], zIndex: 10, borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  avatar: { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.bg.high, borderWidth: 1, borderColor: colors.border.outline, alignItems: 'center', justifyContent: 'center' },
  logo: { color: colors.primary.default + 'E6', letterSpacing: 4, fontSize: 16 },
  rankPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full, backgroundColor: colors.primary.faint, borderWidth: 1, borderColor: colors.primary.default + '40' },
  dangerBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.danger.container + 'AA', borderBottomWidth: 1, borderBottomColor: colors.danger.default + '30', paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
  dangerText: { fontFamily: fontFamily.semiBold, fontSize: 12, color: colors.danger.default, letterSpacing: 0.5, flex: 1 },
  comboBanner: { alignSelf: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[2], marginTop: spacing[2], borderRadius: radius.full, backgroundColor: 'rgba(251,191,36,0.10)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.30)' },
  comboText: { fontFamily: fontFamily.bold, fontSize: 12, color: '#fbbf24', letterSpacing: 1 },
  scroll: { flex: 1, zIndex: 5 },
  scrollContent: { paddingHorizontal: spacing[5], paddingTop: spacing[5], gap: spacing[5] },
  heroCard: { borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.primary.default + '30', padding: spacing[6], gap: spacing[6] },
  heroGlowBlob: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.primary.container + '18', borderRadius: 24 },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: spacing[6] },
  levelRingWrapper: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  pulseRing: { position: 'absolute', borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary.default + '30' },
  pulseRingOuter: { width: 216, height: 216, opacity: 0.4 },
  pulseRingInner: { width: 230, height: 230, opacity: 0.2 },
  levelCenter: { alignItems: 'center', gap: 2 },
  levelNumber: { fontSize: 52, lineHeight: 56, color: colors.white },
  statsPanel: { flex: 1, gap: spacing[5] },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  statItem: { gap: 2 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
  statNumber: { color: colors.white, fontSize: 22 },
  statNumberLarge: { fontFamily: fontFamily.bold, fontSize: 22 },
  statDivider: { width: 1, backgroundColor: colors.border.medium, alignSelf: 'stretch' },
  streakRiskLabel: { fontFamily: fontFamily.bold, fontSize: 9, letterSpacing: 2, color: colors.danger.default },
  heroBadges: { flexDirection: 'row', justifyContent: 'center', gap: spacing[4] },
  heroBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[3], backgroundColor: 'rgba(17,17,17,0.8)', borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle, paddingHorizontal: spacing[5], paddingVertical: spacing[3], maxWidth: 160 },
  badgeNumber: { color: colors.white, lineHeight: 22 },
  completionCard: { backgroundColor: '#0e0e0e', borderRadius: 24, borderWidth: 1, borderColor: colors.border.subtle, padding: spacing[6], gap: spacing[5] },
  completionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  completionLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], flex: 1 },
  completionIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary.faint, borderWidth: 1, borderColor: colors.primary.default + '30', alignItems: 'center', justifyContent: 'center' },
  completionTitle: { color: colors.white, letterSpacing: 0.3 },
  completionBarTrack: { height: 10, backgroundColor: '#1a1a1a', borderRadius: radius.full, overflow: 'hidden', borderWidth: 1, borderColor: colors.border.subtle },
  completionBarFill: { height: '100%', borderRadius: radius.full },
  completionStats: { flexDirection: 'row', paddingTop: spacing[4], borderTopWidth: 1, borderTopColor: colors.border.subtle },
  completionStat: { flex: 1, alignItems: 'center', gap: 4 },
  completionStatBordered: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border.subtle },
  section: { gap: spacing[4] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  sectionLabel: { color: colors.white, letterSpacing: 2, fontSize: 11 },
  questList: { gap: spacing[3] },
  emptyState: { alignItems: 'center', paddingVertical: spacing[8], gap: spacing[3] },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  metricCard: { flex: 1, minWidth: '45%', backgroundColor: '#0a0a0a', borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing[5], paddingHorizontal: spacing[3], gap: spacing[3], overflow: 'hidden' },
  metricGlow: { position: 'absolute', width: 80, height: 80, borderRadius: radius.full, top: '50%', left: '50%', marginTop: -40, marginLeft: -40, opacity: 0.6 },
  shieldBadge:    { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  shieldText:     { fontFamily: fontFamily.bold, fontSize: 9, letterSpacing: 1, color: colors.secondary.default },
  catStreakBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 99, borderWidth: 1 },
  catStreakText:  { fontFamily: fontFamily.bold, fontSize: 8, letterSpacing: 0.5 },
});
