import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { QuestCard } from '../components/shared/QuestCard';
import { FilterTabs } from '../components/shared/FilterTabs';
import { CreateTaskModal } from '../components/shared/CreateTaskModal';
import { EditTaskModal } from '../components/shared/EditTaskModal';
import { XPFlyOut } from '../components/shared/XPFlyOut';
import { useTaskStore } from '../store/useTaskStore';
import { useUserStore } from '../store/useUserStore';
import { useAchievementStore } from '../store/useAchievementStore';
import { useStatsStore } from '../store/useStatsStore';
import { useWeeklyBossStore } from '../store/useWeeklyBossStore';
import { useFocusStore } from '../store/useFocusStore';
import { haptics } from '../utils/haptics';
import { modeFromDuration } from '../utils/focus';
import { Task, TaskPriority, MainTabParamList } from '../types';

type FilterKey = 'all' | 'today' | 'completed';
type SortKey   = 'priority' | 'category' | 'dueDate';

const PRIORITY_ORDER: TaskPriority[]                  = ['critical', 'high', 'medium', 'low'];
const PRIORITY_COLOR: Record<TaskPriority, string>    = { critical: colors.danger.default, high: '#f97316', medium: colors.secondary.default, low: colors.text.muted };
const PRIORITY_LABEL: Record<TaskPriority, string>    = { critical: 'CRITICAL', high: 'HIGH', medium: 'MEDIUM', low: 'LOW' };

const SORT_OPTIONS: { key: SortKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'priority', label: 'Priority', icon: 'flag-outline' },
  { key: 'category', label: 'Category', icon: 'grid-outline'  },
  { key: 'dueDate',  label: 'Due Date', icon: 'calendar-outline' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sortTasks(list: Task[], sort: SortKey): { label: string; color: string; tasks: Task[] }[] {
  if (sort === 'priority') {
    return PRIORITY_ORDER
      .map((p) => ({ label: PRIORITY_LABEL[p], color: PRIORITY_COLOR[p], tasks: list.filter((t) => t.priority === p) }))
      .filter((g) => g.tasks.length > 0);
  }
  if (sort === 'category') {
    const cats: Record<string, Task[]> = {};
    list.forEach((t) => { (cats[t.category] = cats[t.category] ?? []).push(t); });
    return Object.entries(cats).map(([cat, tasks]) => ({ label: cat, color: colors.primary.default, tasks }));
  }
  // dueDate: tasks with due date first (ascending), then undated
  const withDate    = [...list].filter((t) => t.dueDate).sort((a, b) => (a.dueDate ?? 0) - (b.dueDate ?? 0));
  const withoutDate = list.filter((t) => !t.dueDate);
  const all         = [...withDate, ...withoutDate];
  return [{ label: 'BY DUE DATE', color: colors.secondary.default, tasks: all }];
}

// ─── Section header ───────────────────────────────────────────────────────────

function GroupHeader({ label, color, count }: { label: string; color: string; count: number }) {
  return (
    <View style={ghStyles.row}>
      <View style={[ghStyles.bar, { backgroundColor: color }]} />
      <AText style={[ghStyles.label, { color }]}>{label}</AText>
      <View style={[ghStyles.badge, { backgroundColor: color + '18', borderColor: color + '40' }]}>
        <AText style={[ghStyles.badgeText, { color }]}>{count}</AText>
      </View>
    </View>
  );
}

const ghStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2] },
  bar:       { width: 3, height: 14, borderRadius: 2 },
  label:     { fontFamily: fontFamily.bold, fontSize: 10, letterSpacing: 2, flex: 1 },
  badge:     { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, borderWidth: 1 },
  badgeText: { fontFamily: fontFamily.bold, fontSize: 10 },
});

// ─── Sort picker ──────────────────────────────────────────────────────────────

function SortPicker({ active, onChange }: { active: SortKey; onChange: (k: SortKey) => void }) {
  return (
    <View style={spStyles.row}>
      {SORT_OPTIONS.map((opt) => {
        const isActive = active === opt.key;
        return (
          <Pressable
            key={opt.key}
            style={[spStyles.chip, isActive && spStyles.chipActive]}
            onPress={() => onChange(opt.key)}
          >
            <Ionicons name={opt.icon} size={12} color={isActive ? colors.primary.default : colors.text.muted} />
            <AText style={[spStyles.chipLabel, { color: isActive ? colors.primary.default : colors.text.muted }]}>
              {opt.label}
            </AText>
          </Pressable>
        );
      })}
    </View>
  );
}

const spStyles = StyleSheet.create({
  row:       { flexDirection: 'row', gap: spacing[2], paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
  chip:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default, backgroundColor: 'transparent' },
  chipActive: { borderColor: colors.primary.default + '50', backgroundColor: colors.primary.faint },
  chipLabel: { fontFamily: fontFamily.medium, fontSize: 12, letterSpacing: 0.3 },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export function TasksScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const route      = useRoute<RouteProp<MainTabParamList, 'Tasks'>>();

  const initialFilter = route.params?.initialFilter ?? 'today';
  const [filter,     setFilter]    = useState<FilterKey>(initialFilter);
  const [sort,       setSort]      = useState<SortKey>('priority');
  const [showCreate, setShowCreate] = useState(false);
  const [editTask,   setEditTask]   = useState<Task | null>(null);
  const [flyOutXP,   setFlyOutXP]  = useState<number | null>(null);

  // Update filter if route param changes (e.g. navigated from Dashboard "see all")
  useEffect(() => {
    if (route.params?.initialFilter) setFilter(route.params.initialFilter);
  }, [route.params?.initialFilter]);

  const { tasks, todaysTasks, completedToday, completeTask, deleteTask } = useTaskStore();
  const { profile, rank, addXP, incrementTasksCompleted, comboMultiplier, incrementCombo } = useUserStore();
  const { checkAchievements } = useAchievementStore();
  const { recordActivity, deepWorkSessions, recordCategoryActivity } = useStatsStore();
  const { logTaskCompletion: bossTick } = useWeeklyBossStore();
  const { setPendingTask } = useFocusStore();

  const allActive     = tasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const todayList     = todaysTasks();
  const completedList = completedToday();

  const baseList: Task[] = filter === 'all' ? allActive : filter === 'today' ? todayList.filter((t) => t.status !== 'completed') : completedList;
  const groups = filter !== 'completed' ? sortTasks(baseList, sort) : [{ label: 'COMPLETED', color: colors.success.default, tasks: baseList }];

  const tabs = [
    { key: 'today',     label: 'Today', count: todayList.filter((t) => t.status !== 'completed').length },
    { key: 'all',       label: 'All',   count: allActive.length },
    { key: 'completed', label: 'Done',  count: completedList.length },
  ];

  function handleComplete(taskId: string) {
    haptics.success();
    const task      = tasks.find((t) => t.id === taskId);
    const baseXp    = completeTask(taskId, profile.currentStreak);
    const bossBonus = bossTick();
    const earned    = Math.round(baseXp * comboMultiplier) + bossBonus;
    addXP(earned);
    incrementTasksCompleted();
    incrementCombo();
    setFlyOutXP(earned);
    if (task) recordCategoryActivity(task.category);
    recordActivity({ xpEarned: earned, tasksCompleted: 1, streakDay: profile.currentStreak });
    checkAchievements({ totalTasks: profile.tasksCompleted + 1, currentStreak: profile.currentStreak, longestStreak: profile.longestStreak, rank, focusMinutes: profile.focusMinutesTotal, todayTasks: completedToday().length + 1, completionHour: new Date().getHours(), deepWorkSessions });
  }

  function handleStartTask(task: Task) {
    haptics.light();
    setPendingTask(task.id, task.title, modeFromDuration(task.estimatedMinutes));
    navigation.navigate('Focus');
  }

  const flyOutColor = comboMultiplier > 1.0 ? '#fbbf24' : colors.primary.default;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <AText variant="heading" weight="bold" style={styles.title}>Quests</AText>
          <AText variant="caption" color="muted" style={{ marginTop: 2 }}>
            {allActive.length} pending · {completedList.length} done today
          </AText>
        </View>
      </View>

      {comboMultiplier > 1.0 && (
        <View style={styles.comboBanner}>
          <AText style={styles.comboText}>🔥 ×{comboMultiplier.toFixed(1)} COMBO</AText>
          <AText variant="caption" style={{ color: '#fbbf24AA', marginLeft: 4 }}>XP boost active</AText>
        </View>
      )}

      <FilterTabs tabs={tabs} activeKey={filter} onSelect={(k) => setFilter(k as FilterKey)} />

      {filter !== 'completed' && (
        <SortPicker active={sort} onChange={setSort} />
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {baseList.length === 0 ? (
          <EmptyState filter={filter} onAdd={() => setShowCreate(true)} />
        ) : (
          groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <GroupHeader label={group.label} color={group.color} count={group.tasks.length} />
              {group.tasks.map((task) => (
                <QuestCard
                  key={task.id}
                  task={task}
                  onStart={task.status !== 'completed' ? () => handleStartTask(task) : undefined}
                  onComplete={task.status !== 'completed' ? () => handleComplete(task.id) : undefined}
                  onEdit={task.status !== 'completed' ? () => setEditTask(task) : undefined}
                  onDelete={task.status !== 'completed' ? () => deleteTask(task.id) : undefined}
                />
              ))}
            </View>
          ))
        )}
        <View style={{ height: spacing[16] }} />
      </ScrollView>

      <XPFlyOut xp={flyOutXP ?? 0} color={flyOutColor} visible={flyOutXP !== null} onHide={() => setFlyOutXP(null)} />

      <Pressable style={styles.fab} onPress={() => { haptics.light(); setShowCreate(true); }}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      <CreateTaskModal visible={showCreate} onClose={() => setShowCreate(false)} />
      {editTask && (
        <EditTaskModal visible={!!editTask} task={editTask} onClose={() => setEditTask(null)} />
      )}
    </SafeAreaView>
  );
}

function EmptyState({ filter, onAdd }: { filter: FilterKey; onAdd: () => void }) {
  const messages: Record<FilterKey, { icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }> = {
    today:     { icon: 'sunny-outline',                 title: 'No quests today',  sub: 'Add tasks to start earning XP' },
    all:       { icon: 'checkmark-done-circle-outline', title: 'All caught up',     sub: 'No pending tasks right now' },
    completed: { icon: 'trophy-outline',                title: 'Nothing done yet',  sub: 'Complete tasks to see them here' },
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
  container:   { flex: 1, backgroundColor: colors.bg.primary },
  header:      { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[3] },
  title:       { color: colors.text.primary, fontSize: 26 },
  comboBanner: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[2], marginBottom: spacing[2], borderRadius: radius.full, backgroundColor: 'rgba(251,191,36,0.12)', borderWidth: 1, borderColor: 'rgba(251,191,36,0.30)' },
  comboText:   { fontFamily: fontFamily.bold, fontSize: 13, color: '#fbbf24', letterSpacing: 0.5 },
  scroll:      { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[5], paddingTop: spacing[2], gap: spacing[5] },
  group:       { gap: spacing[2] },
  emptyState:  { alignItems: 'center', paddingTop: spacing[20], gap: spacing[3] },
  emptyAddBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[2], paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1, borderColor: colors.primary.default + '40', backgroundColor: colors.primary.faint },
  fab:         { position: 'absolute', bottom: spacing[8], right: spacing[5], width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.primary.container, alignItems: 'center', justifyContent: 'center', elevation: 8 },
});
