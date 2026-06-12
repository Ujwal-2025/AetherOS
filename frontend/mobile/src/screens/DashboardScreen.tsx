import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, FadeInDown,
} from 'react-native-reanimated';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { CircularProgress } from '../components/shared/CircularProgress';
import { QuestCard } from '../components/shared/QuestCard';
import { RankUpOverlay } from '../components/shared/RankUpOverlay';
import { DayCompleteOverlay } from '../components/shared/DayCompleteOverlay';
import { XPFlyOut } from '../components/shared/XPFlyOut';
import { CreateTaskModal } from '../components/shared/CreateTaskModal';
import { useCategoryStore } from '../store/useCategoryStore';
import { useUserStore } from '../store/useUserStore';
import { useTaskStore } from '../store/useTaskStore';
import { useFocusStore } from '../store/useFocusStore';
import { useAchievementStore } from '../store/useAchievementStore';
import { useStatsStore } from '../store/useStatsStore';
import { useWeeklyBossStore } from '../store/useWeeklyBossStore';
import { haptics } from '../utils/haptics';
import { modeFromDuration } from '../utils/focus';
import { ArenaTabParamList, Task, TaskPriority } from '../types';

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_ORDER: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
const PRIORITY_COLOR: Record<TaskPriority, string> = {
  critical: colors.danger.default,
  high:     '#f97316',
  medium:   colors.secondary.default,
  low:      colors.text.muted,
};
const PRIORITY_LABEL: Record<TaskPriority, string> = {
  critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─── Animated category ring ───────────────────────────────────────────────────

function HomeRing({ label, value, color, icon, streak, pulsing }: {
  label: string; value: number; color: string;
  icon: keyof typeof Ionicons.glyphMap; streak: number; pulsing: boolean;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (pulsing) {
      scale.value = withSequence(
        withTiming(1.20, { duration: 150 }),
        withTiming(0.92, { duration: 100 }),
        withTiming(1.10, { duration: 100 }),
        withTiming(1.0,  { duration: 120 }),
      );
    }
  }, [pulsing]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[ringStyles.wrapper, animStyle]}>
      <CircularProgress size={68} progress={value} strokeWidth={5} color={color} trackColor="#1c1c1c">
        <View style={{ alignItems: 'center', gap: 1 }}>
          <Ionicons name={icon} size={13} color={value > 0 ? color : colors.text.faint} />
          <AText style={{ color: value > 0 ? colors.white : colors.text.faint, fontSize: 11, fontFamily: fontFamily.bold }}>
            {Math.round(value * 100)}%
          </AText>
        </View>
      </CircularProgress>
      <AText style={[ringStyles.label, { color: value > 0 ? colors.white : colors.text.muted }]} numberOfLines={1}>
        {label}
      </AText>
      {streak > 1 && (
        <View style={[ringStyles.streak, { borderColor: color + '40', backgroundColor: color + '12' }]}>
          <Ionicons name="flame" size={8} color={color} />
          <AText style={{ color, fontSize: 8, fontFamily: fontFamily.bold }}>{streak}d</AText>
        </View>
      )}
    </Animated.View>
  );
}

const ringStyles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing[2] },
  label:   { fontFamily: fontFamily.medium, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' },
  streak:  { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 99, borderWidth: 1 },
});

// ─── Priority section header ──────────────────────────────────────────────────

function PriorityHeader({ priority }: { priority: TaskPriority }) {
  return (
    <View style={styles.priorityHeader}>
      <View style={[styles.priorityBar, { backgroundColor: PRIORITY_COLOR[priority] }]} />
      <AText style={[styles.priorityLabel, { color: PRIORITY_COLOR[priority] }]}>
        {PRIORITY_LABEL[priority]}
      </AText>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export function DashboardScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<ArenaTabParamList>>();

  const { profile, rank, pendingRankUp, clearRankUp, comboMultiplier, comboCount,
          addXP, incrementTasksCompleted, incrementCombo } = useUserStore();
  const { todaysTasks, completedToday, xpEarnedToday, completeTask } = useTaskStore();
  const { setPendingTask } = useFocusStore();
  const { checkAchievements } = useAchievementStore();
  const { recordActivity, categoryStreaks, recordCategoryActivity, deepWorkSessions } = useStatsStore();
  const { logTaskCompletion: bossTick } = useWeeklyBossStore();
  const { categories } = useCategoryStore();

  const [flyOutXP,       setFlyOutXP]       = useState<number | null>(null);
  const [showCreateTask, setShowCreateTask]  = useState(false);
  const [showDayComplete, setShowDayComplete] = useState(false);
  const [pulsingCategory, setPulsingCategory] = useState<string | null>(null);
  const hasCelebrated = useRef(false);
  const pulseTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const todayActive    = todaysTasks().filter((t) => t.status !== 'completed');
  const completedCount = completedToday().length;
  const totalToday     = todaysTasks().length;
  const completionRate = totalToday > 0 ? completedCount / totalToday : 0;
  const todayXP        = xpEarnedToday();

  const hour         = new Date().getHours();
  const streakAtRisk = hour >= 21 && completedCount === 0 && profile.currentStreak > 0;
  const dangerOpacity = useSharedValue(1);

  useEffect(() => {
    if (streakAtRisk) {
      haptics.warning();
      dangerOpacity.value = withRepeat(
        withSequence(withTiming(0.3, { duration: 600 }), withTiming(1.0, { duration: 600 })),
        -1, true,
      );
    } else {
      dangerOpacity.value = 1;
    }
  }, [streakAtRisk]);

  const streakDangerStyle = useAnimatedStyle(() => ({ opacity: dangerOpacity.value }));

  useEffect(() => {
    if (completionRate === 1 && totalToday > 0 && !hasCelebrated.current) {
      hasCelebrated.current = true;
      setShowDayComplete(true);
    }
    if (completionRate < 1) hasCelebrated.current = false;
  }, [completionRate, totalToday]);

  function handleCompleteTask(taskId: string) {
    haptics.success();
    const task     = todayActive.find((t) => t.id === taskId);
    const baseXp   = completeTask(taskId, profile.currentStreak);
    const bossBonus = bossTick();
    const earned   = Math.round(baseXp * comboMultiplier) + bossBonus;
    addXP(earned);
    incrementTasksCompleted();
    incrementCombo();
    setFlyOutXP(earned);

    if (task) {
      recordCategoryActivity(task.category);
      if (pulseTimer.current) clearTimeout(pulseTimer.current);
      setPulsingCategory(task.category);
      pulseTimer.current = setTimeout(() => setPulsingCategory(null), 1500);
    }
    recordActivity({ xpEarned: earned, tasksCompleted: 1, streakDay: profile.currentStreak });
    checkAchievements({
      totalTasks:     profile.tasksCompleted + 1,
      currentStreak:  profile.currentStreak,
      longestStreak:  profile.longestStreak,
      rank,
      focusMinutes:   profile.focusMinutesTotal,
      todayTasks:     completedToday().length + 1,
      completionHour: new Date().getHours(),
      deepWorkSessions,
    });
  }

  function handleStartTask(task: Task) {
    haptics.light();
    const mode = modeFromDuration(task.estimatedMinutes ?? 25);
    setPendingTask(task.id, task.title, mode);
    navigation.navigate('Focus');
  }

  // Build priority groups capped at 5 total
  let capCount = 0;
  const groups: Partial<Record<TaskPriority, Task[]>> = {};
  for (const priority of PRIORITY_ORDER) {
    if (capCount >= 5) break;
    const grp  = todayActive.filter((t) => t.priority === priority);
    const take = grp.slice(0, 5 - capCount);
    if (take.length > 0) { groups[priority] = take; capCount += take.length; }
  }
  const hasMore    = todayActive.length > 5;
  const flyOutColor = comboMultiplier > 1.0 ? '#fbbf24' : colors.primary.default;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['rgba(183,109,255,0.05)', 'transparent']}
        style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.35 }}
      />

      {/* ── Compact header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <AText style={styles.avatarLetter}>
              {profile.displayName.charAt(0).toUpperCase()}
            </AText>
          </View>
          <View>
            <AText style={styles.greeting}>{getGreeting()}</AText>
            <AText style={styles.userName}>{profile.displayName}</AText>
          </View>
        </View>
        <View style={styles.headerRight}>
          {profile.currentStreak > 0 && (
            <Animated.View style={[styles.streakPill, streakAtRisk && streakDangerStyle]}>
              <Ionicons name="flame" size={12} color={streakAtRisk ? colors.danger.default : '#fbbf24'} />
              <AText style={[styles.streakText, { color: streakAtRisk ? colors.danger.default : '#fbbf24' }]}>
                {profile.currentStreak}d
              </AText>
            </Animated.View>
          )}
          {todayXP > 0 && (
            <View style={styles.xpPill}>
              <Ionicons name="flash" size={12} color={colors.primary.default} />
              <AText style={styles.xpText}>+{todayXP}</AText>
            </View>
          )}
          <Pressable style={styles.addBtn} onPress={() => { haptics.light(); setShowCreateTask(true); }}>
            <Ionicons name="add" size={20} color={colors.primary.default} />
          </Pressable>
        </View>
      </View>

      {/* ── Banners ── */}
      {streakAtRisk && (
        <View style={styles.dangerBanner}>
          <Ionicons name="warning" size={14} color={colors.danger.default} />
          <AText style={styles.dangerText}>Streak at risk — complete a quest before midnight</AText>
        </View>
      )}
      {comboMultiplier > 1.0 && (
        <View style={styles.comboBanner}>
          <AText style={styles.comboText}>🔥 ×{comboMultiplier.toFixed(1)} COMBO · {comboCount} in a row</AText>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Progress rings ── */}
        <Animated.View entering={FadeInDown.delay(0).duration(400)}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AText style={styles.sectionLabel}>TODAY'S PROGRESS</AText>
              <AText style={styles.sectionSub}>{completedCount}/{totalToday} done</AText>
            </View>
            <View style={styles.ringsRow}>
              {categories.map((cat) => {
                const catTasks = todaysTasks().filter((t) => t.category === cat.id);
                const catDone  = catTasks.filter((t) => t.status === 'completed').length;
                const catRate  = catTasks.length > 0 ? catDone / catTasks.length : 0;
                return (
                  <HomeRing
                    key={cat.id}
                    label={cat.name}
                    value={catRate}
                    color={cat.color}
                    icon={cat.icon as keyof typeof Ionicons.glyphMap}
                    streak={categoryStreaks[cat.id] ?? 0}
                    pulsing={pulsingCategory === cat.id}
                  />
                );
              })}
            </View>
          </View>
        </Animated.View>

        {/* ── Today's quests ── */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AText style={styles.sectionLabel}>TODAY'S QUESTS</AText>
              <AText style={styles.sectionSub}>{todayActive.length} active</AText>
            </View>

            {todayActive.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle-outline" size={40} color={colors.success.default} />
                <AText variant="body" color="muted" style={{ textAlign: 'center' }}>
                  All quests complete. You crushed it today.
                </AText>
              </View>
            ) : (
              <View style={styles.questList}>
                {PRIORITY_ORDER.map((priority) => {
                  const grp = groups[priority];
                  if (!grp || grp.length === 0) return null;
                  return (
                    <View key={priority} style={styles.priorityGroup}>
                      <PriorityHeader priority={priority} />
                      {grp.map((task) => (
                        <QuestCard
                          key={task.id}
                          task={task}
                          onStart={() => handleStartTask(task)}
                          onComplete={() => handleCompleteTask(task.id)}
                        />
                      ))}
                    </View>
                  );
                })}

                {hasMore && (
                  <Pressable
                    style={styles.seeAllBtn}
                    onPress={() => navigation.navigate('Tasks', { initialFilter: 'today' })}
                  >
                    <AText style={styles.seeAllText}>
                      See all {todayActive.length} tasks
                    </AText>
                    <Ionicons name="arrow-forward" size={14} color={colors.primary.default} />
                  </Pressable>
                )}
              </View>
            )}
          </View>
        </Animated.View>

        <View style={{ height: spacing[16] }} />
      </ScrollView>

      <XPFlyOut xp={flyOutXP ?? 0} color={flyOutColor} visible={flyOutXP !== null} onHide={() => setFlyOutXP(null)} />
      <DayCompleteOverlay visible={showDayComplete} xpEarned={todayXP} streak={profile.currentStreak} onDismiss={() => setShowDayComplete(false)} />
      <RankUpOverlay rank={pendingRankUp ?? 'E'} visible={pendingRankUp !== null} onDismiss={clearRankUp} />
      <CreateTaskModal visible={showCreateTask} onClose={() => setShowCreateTask(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: colors.bg.primary },
  header:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  headerRight:    { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  avatar:         { width: 36, height: 36, borderRadius: radius.full, backgroundColor: colors.primary.faint, borderWidth: 1, borderColor: colors.primary.default + '40', alignItems: 'center', justifyContent: 'center' },
  avatarLetter:   { fontFamily: fontFamily.bold, fontSize: 15, color: colors.primary.default },
  greeting:       { fontFamily: fontFamily.regular, fontSize: 10, color: colors.text.faint, letterSpacing: 0.5 },
  userName:       { fontFamily: fontFamily.bold, fontSize: 15, color: colors.white, letterSpacing: 0.2 },
  streakPill:     { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: radius.full, backgroundColor: 'rgba(251,191,36,0.12)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.30)' },
  streakText:     { fontFamily: fontFamily.bold, fontSize: 12 },
  xpPill:         { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: spacing[3], paddingVertical: 4, borderRadius: radius.full, backgroundColor: colors.primary.faint, borderWidth: 1, borderColor: colors.primary.default + '30' },
  xpText:         { fontFamily: fontFamily.bold, fontSize: 12, color: colors.primary.default },
  addBtn:         { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.primary.faint, borderWidth: 1, borderColor: colors.primary.default + '40', alignItems: 'center', justifyContent: 'center' },
  dangerBanner:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2], backgroundColor: colors.danger.container + '99', borderBottomWidth: 1, borderBottomColor: colors.danger.default + '30', paddingHorizontal: spacing[5], paddingVertical: spacing[2] },
  dangerText:     { fontFamily: fontFamily.semiBold, fontSize: 12, color: colors.danger.default, flex: 1 },
  comboBanner:    { alignSelf: 'center', paddingHorizontal: spacing[5], paddingVertical: 5, marginTop: spacing[2], borderRadius: radius.full, backgroundColor: 'rgba(251,191,36,0.10)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.30)' },
  comboText:      { fontFamily: fontFamily.bold, fontSize: 12, color: '#fbbf24', letterSpacing: 0.5 },
  scroll:         { flex: 1 },
  scrollContent:  { paddingHorizontal: spacing[5], paddingTop: spacing[6], gap: spacing[6] },
  section:        { gap: spacing[4] },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel:   { fontFamily: fontFamily.bold, fontSize: 11, color: colors.text.muted, letterSpacing: 2 },
  sectionSub:     { fontFamily: fontFamily.medium, fontSize: 12, color: colors.text.faint },
  ringsRow:       { flexDirection: 'row', justifyContent: 'space-around' },
  questList:      { gap: spacing[5] },
  priorityGroup:  { gap: spacing[3] },
  priorityHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  priorityBar:    { width: 3, height: 13, borderRadius: 2 },
  priorityLabel:  { fontFamily: fontFamily.bold, fontSize: 10, letterSpacing: 2 },
  seeAllBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingVertical: spacing[3], borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary.default + '30', backgroundColor: colors.primary.faint },
  seeAllText:     { fontFamily: fontFamily.semiBold, fontSize: 14, color: colors.primary.default },
  emptyState:     { alignItems: 'center', paddingVertical: spacing[12], gap: spacing[3] },
});
