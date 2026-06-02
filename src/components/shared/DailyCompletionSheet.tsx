/**
 * DailyCompletionSheet — bottom-sheet detail view for the Daily Completion card.
 * Reads from useTaskStore directly; no props needed beyond visibility control.
 */
import React from 'react';
import { View, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';
import { CircularProgress } from './CircularProgress';
import { useTaskStore } from '../../store/useTaskStore';
import { Task, TaskPriority } from '../../types';

// ─── Priority meta ────────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low:      colors.text.faint,
  medium:   colors.secondary.default,
  high:     colors.primary.default,
  critical: colors.danger.default,
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'LOW', medium: 'MED', high: 'HIGH', critical: 'CRIT',
};

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ task, done }: { task: Task; done: boolean }) {
  const color = PRIORITY_COLOR[task.priority];
  return (
    <View style={rowStyles.row}>
      {/* Priority accent */}
      <View style={[rowStyles.dot, { backgroundColor: done ? colors.success.default : color }]} />

      {/* Title */}
      <AText
        variant="body"
        style={[rowStyles.title, done && rowStyles.titleDone]}
        numberOfLines={2}
      >
        {task.title}
      </AText>

      {/* Right badge */}
      <View style={[rowStyles.badge, { borderColor: (done ? colors.success.default : color) + '40', backgroundColor: (done ? colors.success.default : color) + '12' }]}>
        {done ? (
          <Ionicons name="checkmark" size={11} color={colors.success.default} />
        ) : (
          <AText style={[rowStyles.badgeText, { color }]}>{PRIORITY_LABEL[task.priority]}</AText>
        )}
        <AText style={[rowStyles.xpText, { color: done ? colors.success.default : color }]}>
          {done ? `+${task.xpReward}` : `${task.xpReward}`} XP
        </AText>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing[3],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3, flexShrink: 0,
  },
  title: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 13,
    lineHeight: 18,
  },
  titleDone: {
    color: colors.text.muted,
    textDecorationLine: 'line-through',
  },
  badge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               4,
    paddingHorizontal: spacing[2],
    paddingVertical:   3,
    borderRadius:      radius.sm,
    borderWidth:       1,
  },
  badgeText: {
    fontFamily:    fontFamily.bold,
    fontSize:      9,
    letterSpacing: 0.8,
  },
  xpText: {
    fontFamily:    fontFamily.bold,
    fontSize:      10,
    letterSpacing: 0.3,
  },
});

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ icon, label, count, color }: {
  icon:  keyof typeof Ionicons.glyphMap;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <View style={secStyles.row}>
      <Ionicons name={icon} size={14} color={color} />
      <AText style={[secStyles.label, { color }]}>{label}</AText>
      <View style={[secStyles.countPill, { backgroundColor: color + '18', borderColor: color + '35' }]}>
        <AText style={[secStyles.count, { color }]}>{count}</AText>
      </View>
    </View>
  );
}

const secStyles = StyleSheet.create({
  row:       { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[2], marginTop: spacing[4] },
  label:     { fontFamily: fontFamily.bold, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  countPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1 },
  count:     { fontFamily: fontFamily.bold, fontSize: 10 },
});

// ─── Sheet ────────────────────────────────────────────────────────────────────

interface DailyCompletionSheetProps {
  visible:  boolean;
  onClose:  () => void;
}

export function DailyCompletionSheet({ visible, onClose }: DailyCompletionSheetProps) {
  const { todaysTasks, completedToday, completionRateToday, xpEarnedToday } = useTaskStore();

  const allToday       = todaysTasks();
  const completed      = completedToday();
  const pending        = allToday.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const completionRate = completionRateToday();
  const todayXP        = xpEarnedToday();
  const pct            = Math.round(completionRate * 100);

  // Ring color: green when done, blue progress otherwise
  const ringColor = pct === 100 ? colors.success.default : colors.secondary.default;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIcon}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary.default} />
            </View>
            <View>
              <AText variant="subheading" weight="bold">Daily Completion</AText>
              <AText variant="caption" color="muted" style={{ marginTop: 1 }}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </AText>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color={colors.text.muted} />
          </Pressable>
        </View>

        {/* Progress summary */}
        <View style={styles.summary}>
          {/* Big ring */}
          <CircularProgress
            size={120}
            progress={completionRate}
            strokeWidth={9}
            color={ringColor}
            trackColor={colors.bg.high}
          >
            <View style={styles.ringInner}>
              <AText style={[styles.ringPct, { color: ringColor }]}>{pct}%</AText>
              <AText variant="label" color="muted" style={{ fontSize: 9, letterSpacing: 1 }}>DONE</AText>
            </View>
          </CircularProgress>

          {/* Stats column */}
          <View style={styles.statsCol}>
            <StatItem icon="checkmark-circle-outline" label="Completed"   value={completed.length.toString()} color={colors.success.default} />
            <StatItem icon="time-outline"             label="Pending"     value={pending.length.toString()}   color={colors.warning.default} />
            <StatItem icon="flash"                    label="XP Today"    value={`+${todayXP}`}               color={colors.primary.default} />
            <StatItem icon="list-outline"             label="Total"       value={allToday.length.toString()}  color={colors.text.muted} />
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.barTrack}>
          <LinearGradient
            colors={pct === 100 ? [colors.success.default, colors.success.default] : [colors.primary.container, colors.secondary.default]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.barFill, { width: `${Math.max(pct, 2)}%` as any }]}
          />
        </View>

        {/* Task lists */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Completed tasks */}
          {completed.length > 0 && (
            <View>
              <SectionLabel icon="checkmark-circle" label="Completed" count={completed.length} color={colors.success.default} />
              {completed.map((t) => <TaskRow key={t.id} task={t} done />)}
            </View>
          )}

          {/* Pending tasks */}
          {pending.length > 0 && (
            <View>
              <SectionLabel icon="ellipse-outline" label="Pending" count={pending.length} color={colors.warning.default} />
              {pending.map((t) => <TaskRow key={t.id} task={t} done={false} />)}
            </View>
          )}

          {/* All-done state */}
          {completed.length > 0 && pending.length === 0 && (
            <View style={styles.allDone}>
              <Ionicons name="checkmark-done-circle" size={36} color={colors.success.default} />
              <AText variant="body" weight="semiBold" style={{ color: colors.success.default }}>All tasks complete!</AText>
              <AText variant="caption" color="muted" style={{ textAlign: 'center' }}>Outstanding work. Streak secured.</AText>
            </View>
          )}

          {/* Empty state */}
          {allToday.length === 0 && (
            <View style={styles.allDone}>
              <Ionicons name="sunny-outline" size={36} color={colors.text.faint} />
              <AText variant="body" color="muted">No tasks today yet.</AText>
            </View>
          )}

          <View style={{ height: spacing[4] }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Stat item ────────────────────────────────────────────────────────────────

function StatItem({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string }) {
  return (
    <View style={siStyles.row}>
      <Ionicons name={icon} size={13} color={color} />
      <AText variant="caption" color="muted" style={siStyles.label}>{label}</AText>
      <AText style={[siStyles.value, { color }]}>{value}</AText>
    </View>
  );
}

const siStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  label: { flex: 1, fontSize: 11 },
  value: { fontFamily: fontFamily.bold, fontSize: 14 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor:      colors.bg.surface,
    borderTopLeftRadius:  24,
    borderTopRightRadius: 24,
    borderTopWidth:       1,
    borderColor:          colors.border.default,
    maxHeight:            '82%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border.strong,
    alignSelf: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },

  // Header
  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  headerIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.primary.faint,
    borderWidth: 1, borderColor: colors.primary.default + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: radius.full,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center', justifyContent: 'center',
  },

  // Progress summary
  summary: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            spacing[6],
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[5],
  },
  statsCol: { flex: 1, gap: spacing[3] },
  ringInner: { alignItems: 'center', gap: 2 },
  ringPct:   { fontFamily: fontFamily.bold, fontSize: 26, letterSpacing: 0.5 },

  // Progress bar
  barTrack: {
    height: 8,
    marginHorizontal: spacing[5],
    backgroundColor: colors.bg.high,
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  barFill: {
    height: '100%',
    borderRadius: radius.full,
    minWidth: 6,
  },

  // Lists
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[5], paddingBottom: spacing[4] },

  allDone: {
    alignItems:    'center',
    paddingTop:    spacing[6],
    gap:           spacing[3],
  },
});
