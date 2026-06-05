import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { QuestCard } from '../components/shared/QuestCard';
import { FilterTabs } from '../components/shared/FilterTabs';
import { CreateTaskModal } from '../components/shared/CreateTaskModal';
import { XPFlyOut } from '../components/shared/XPFlyOut';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useTaskStore } from '../store/useTaskStore';
import { useUserStore } from '../store/useUserStore';
import { useAchievementStore } from '../store/useAchievementStore';
import { useStatsStore } from '../store/useStatsStore';
import { useWeeklyBossStore } from '../store/useWeeklyBossStore';
import { useFocusStore } from '../store/useFocusStore';
import { haptics } from '../utils/haptics';
import { Task, MainTabParamList, FocusMode } from '../types';

function modeFromDuration(minutes?: number): FocusMode {
  if (!minutes || minutes <= 25) return 'sprint';
  if (minutes <= 60)             return 'flow';
  return 'deep';
}

type FilterKey = 'all' | 'today' | 'completed';

export function TasksScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [filter,     setFilter]    = useState<FilterKey>('today');
  const [showCreate, setShowCreate] = useState(false);
  const [flyOutXP,   setFlyOutXP]  = useState<number | null>(null);

  const { tasks, todaysTasks, completedToday, completeTask, deleteTask } = useTaskStore();
  const { profile, rank, addXP, incrementTasksCompleted, comboMultiplier, incrementCombo } = useUserStore();
  const { checkAchievements } = useAchievementStore();
  const { recordActivity, deepWorkSessions, recordCategoryActivity } = useStatsStore();
  const { logTaskCompletion: bossTick } = useWeeklyBossStore();
  const { setPendingTask } = useFocusStore();

  const allActive     = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const todayList     = todaysTasks();
  const completedList = completedToday();

  const filtered: Task[] = filter === 'all' ? allActive : filter === 'today' ? todayList : completedList;

  const tabs = [
    { key: 'today',     label: 'Today', count: todayList.filter(t => t.status !== 'completed').length },
    { key: 'all',       label: 'All',   count: allActive.length },
    { key: 'completed', label: 'Done',  count: completedList.length },
  ];

  function handleComplete(taskId: string) {
    haptics.success();
    const task   = tasks.find((t) => t.id === taskId);
    const baseXp = completeTask(taskId, profile.currentStreak);
    const earned = Math.round(baseXp * comboMultiplier);
    addXP(earned);
    incrementTasksCompleted();
    incrementCombo();
    setFlyOutXP(earned);

    const newTotalTasks  = profile.tasksCompleted + 1;
    const todayCompleted = completedToday().length + 1;
    if (task) recordCategoryActivity(task.category);
    bossTick();
    recordActivity({ xpEarned: earned, tasksCompleted: 1, streakDay: profile.currentStreak });
    checkAchievements({ totalTasks: newTotalTasks, currentStreak: profile.currentStreak, longestStreak: profile.longestStreak, rank, focusMinutes: profile.focusMinutesTotal, todayTasks: todayCompleted, completionHour: new Date().getHours(), deepWorkSessions });
  }

  function handleStartTask(task: Task) {
    haptics.light();
    const mode = modeFromDuration(task.estimatedMinutes);
    setPendingTask(task.id, task.title, mode);
    navigation.navigate('Focus');
  }

  const flyOutColor = comboMultiplier > 1.0 ? '#fbbf24' : colors.primary.default;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <AText variant="heading" weight="bold" style={styles.title}>Quests</AText>
          <AText variant="caption" color="muted" style={{ marginTop: 2 }}>{allActive.length} pending · {completedList.length} done today</AText>
        </View>
      </View>

      {comboMultiplier > 1.0 && (
        <View style={styles.comboBanner}>
          <AText style={styles.comboText}>🔥 ×{comboMultiplier.toFixed(1)} COMBO</AText>
          <AText variant="caption" style={{ color: '#fbbf24AA', marginLeft: 4 }}>XP boost active</AText>
        </View>
      )}

      <FilterTabs tabs={tabs} activeKey={filter} onSelect={(k) => setFilter(k as FilterKey)} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <EmptyState filter={filter} onAdd={() => setShowCreate(true)} />
        ) : (
          filtered.map((task) => (
            <QuestCard
                key={task.id}
                task={task}
                onStart={task.status !== 'completed' ? () => handleStartTask(task) : undefined}
                onComplete={task.status !== 'completed' ? () => handleComplete(task.id) : undefined}
              />
          ))
        )}
        <View style={{ height: spacing[16] }} />
      </ScrollView>

      <XPFlyOut xp={flyOutXP ?? 0} color={flyOutColor} visible={flyOutXP !== null} onHide={() => setFlyOutXP(null)} />

      <Pressable style={styles.fab} onPress={() => { haptics.light(); setShowCreate(true); }}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      <CreateTaskModal visible={showCreate} onClose={() => setShowCreate(false)} />
    </SafeAreaView>
  );
}

function EmptyState({ filter, onAdd }: { filter: FilterKey; onAdd: () => void }) {
  const messages: Record<FilterKey, { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }> = {
    today:     { icon: 'sunny-outline',                 title: 'No quests today',   sub: 'Add tasks to start earning XP' },
    all:       { icon: 'checkmark-done-circle-outline', title: 'All caught up',      sub: 'No pending tasks right now' },
    completed: { icon: 'trophy-outline',                title: 'Nothing done yet',   sub: 'Complete tasks to see them here' },
  };
  const msg = messages[filter];
  return (
    <View style={styles.emptyState}>
      <Ionicons name={msg.icon} size={40} color={colors.text.faint} />
      <AText variant="subheading" weight="semiBold" color="muted" style={{ textAlign: 'center' }}>{msg.title}</AText>
      <AText variant="body" color="muted" style={{ textAlign: 'center' }}>{msg.sub}</AText>
      {filter !== 'completed' && (
        <Pressable style={styles.emptyAddBtn} onPress={onAdd}>
          <Ionicons name="add-circle-outline" size={16} color={colors.primary.default} />
          <AText variant="caption" weight="semiBold" style={{ color: colors.primary.default }}>Add a quest</AText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[3] },
  title: { color: colors.text.primary, fontSize: 26 },
  addBtn: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.primary.faint, borderWidth: 1, borderColor: colors.primary.default + '40', alignItems: 'center', justifyContent: 'center' },
  comboBanner: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[2], marginBottom: spacing[2], borderRadius: radius.full, backgroundColor: 'rgba(251,191,36,0.12)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.30)' },
  comboText: { fontFamily: fontFamily.bold, fontSize: 13, color: '#fbbf24', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[5], paddingTop: spacing[4], gap: spacing[3] },
  emptyState: { alignItems: 'center', paddingTop: spacing[20], gap: spacing[3] },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[2], paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary.default + '40', backgroundColor: colors.primary.faint },
  fab: { position: 'absolute', bottom: spacing[8], right: spacing[5], width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.primary.container, alignItems: 'center', justifyContent: 'center', elevation: 8 },
});
