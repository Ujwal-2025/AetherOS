/**
 * MetricDetailSheet — bottom-sheet detail for a single System Metric category.
 * Reads all tasks from useTaskStore and filters by the given TaskCategory.
 */
import React from 'react';
import { View, Modal, Pressable, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';
import { CircularProgress } from './CircularProgress';
import { useTaskStore } from '../../store/useTaskStore';
import { Task, TaskCategory, TaskPriority } from '../../types';

// ─── Priority badge ───────────────────────────────────────────────────────────

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low:      colors.text.faint,
  medium:   colors.secondary.default,
  high:     colors.primary.default,
  critical: colors.danger.default,
};
const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'LOW', medium: 'MED', high: 'HIGH', critical: 'CRIT',
};

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task }: { task: Task }) {
  const isCompleted = task.status === 'completed';
  const pc          = PRIORITY_COLOR[task.priority];

  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.dot, { backgroundColor: isCompleted ? colors.success.default : pc }]} />

      <AText
        variant="body"
        style={[rowStyles.title, isCompleted && rowStyles.done]}
        numberOfLines={2}
      >
        {task.title}
      </AText>

      <View style={[rowStyles.badge, { borderColor: pc + '40', backgroundColor: pc + '12' }]}>
        {isCompleted
          ? <Ionicons name="checkmark" size={11} color={colors.success.default} />
          : <AText style={[rowStyles.badgeLabel, { color: pc }]}>{PRIORITY_LABEL[task.priority]}</AText>
        }
        <AText style={[rowStyles.xp, { color: isCompleted ? colors.success.default : pc }]}>
          {isCompleted ? `+${task.xpReward}` : `${task.xpReward}`} XP
        </AText>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing[3],
    paddingVertical:   spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  dot:  { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  title: { flex: 1, color: colors.text.primary, fontSize: 13, lineHeight: 18 },
  done:  { color: colors.text.muted, textDecorationLine: 'line-through' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing[2], paddingVertical: 3,
    borderRadius: radius.sm, borderWidth: 1,
  },
  badgeLabel: { fontFamily: fontFamily.bold, fontSize: 9, letterSpacing: 0.8 },
  xp:         { fontFamily: fontFamily.bold, fontSize: 10, letterSpacing: 0.3 },
});

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ icon, label, count, color }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; count: number; color: string;
}) {
  return (
    <View style={secStyles.row}>
      <Ionicons name={icon} size={13} color={color} />
      <AText style={[secStyles.label, { color }]}>{label}</AText>
      <View style={[secStyles.pill, { backgroundColor: color + '18', borderColor: color + '35' }]}>
        <AText style={[secStyles.count, { color }]}>{count}</AText>
      </View>
    </View>
  );
}

const secStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[4], marginBottom: spacing[1] },
  label: { fontFamily: fontFamily.bold, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' },
  pill:  { paddingHorizontal: 6, paddingVertical: 2, borderRadius: radius.full, borderWidth: 1 },
  count: { fontFamily: fontFamily.bold, fontSize: 10 },
});

// ─── Main sheet ───────────────────────────────────────────────────────────────

interface MetricDetailSheetProps {
  visible:  boolean;
  onClose:  () => void;
  category: TaskCategory;
  label:    string;
  color:    string;
  icon:     keyof typeof Ionicons.glyphMap;
}

export function MetricDetailSheet({ visible, onClose, category, label, color, icon }: MetricDetailSheetProps) {
  const { tasks } = useTaskStore();

  // All non-failed tasks in this category
  const categoryTasks = tasks.filter(
    (t) => t.category === category && t.status !== 'failed'
  );
  const completed = categoryTasks.filter((t) => t.status === 'completed');
  const pending   = categoryTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress');
  const total     = categoryTasks.length;
  const rate      = total > 0 ? completed.length / total : 0;
  const pct       = Math.round(rate * 100);
  const xpEarned  = completed.reduce((s, t) => s + t.xpReward, 0);
  const ringColor = pct === 100 && total > 0 ? colors.success.default : color;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIcon, { backgroundColor: color + '18', borderColor: color + '35' }]}>
              <Ionicons name={icon} size={18} color={color} />
            </View>
            <View>
              <AText variant="subheading" weight="bold">{label}</AText>
              <AText variant="caption" color="muted" style={{ marginTop: 1 }}>
                {total === 0 ? 'No tasks in this category' : `${total} task${total === 1 ? '' : 's'} total`}
              </AText>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={18} color={colors.text.muted} />
          </Pressable>
        </View>

        {/* Progress summary */}
        <View style={styles.summary}>
          {/* Ring */}
          <CircularProgress
            size={120}
            progress={rate}
            strokeWidth={9}
            color={ringColor}
            trackColor={colors.bg.high}
          >
            <View style={styles.ringInner}>
              <AText style={[styles.ringPct, { color: ringColor }]}>
                {total === 0 ? '—' : `${pct}%`}
              </AText>
              <AText variant="label" color="muted" style={{ fontSize: 9, letterSpacing: 1 }}>DONE</AText>
            </View>
          </CircularProgress>

          {/* Stats column */}
          <View style={styles.statsCol}>
            <StatRow icon="checkmark-circle-outline" label="Completed" value={completed.length.toString()} color={colors.success.default} />
            <StatRow icon="time-outline"             label="Pending"   value={pending.length.toString()}   color={colors.warning.default} />
            <StatRow icon="flash"                    label="XP Earned" value={`+${xpEarned}`}              color={color} />
            <StatRow icon="list-outline"             label="Total"     value={total.toString()}             color={colors.text.muted} />
          </View>
        </View>

        {/* Progress bar */}
        {total > 0 && (
          <View style={styles.barTrack}>
            <LinearGradient
              colors={pct === 100 ? [colors.success.default, colors.success.default] : [color, color + 'AA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.barFill, { width: `${Math.max(pct, 2)}%` as any }]}
            />
          </View>
        )}

        {/* Task lists */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {completed.length > 0 && (
            <View>
              <SectionLabel icon="checkmark-circle" label="Completed" count={completed.length} color={colors.success.default} />
              {completed.map((t) => <TaskRow key={t.id} task={t} />)}
            </View>
          )}

          {pending.length > 0 && (
            <View>
              <SectionLabel icon="ellipse-outline" label="Pending" count={pending.length} color={colors.warning.default} />
              {pending.map((t) => <TaskRow key={t.id} task={t} />)}
            </View>
          )}

          {total === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name={icon} size={36} color={colors.text.faint} />
              <AText variant="body" color="muted" style={{ textAlign: 'center' }}>
                No {label.toLowerCase()} tasks yet.
              </AText>
              <AText variant="caption" color="muted" style={{ textAlign: 'center' }}>
                Add a task with the {label} category to track it here.
              </AText>
            </View>
          )}

          {completed.length > 0 && pending.length === 0 && total > 0 && (
            <View style={styles.allDone}>
              <Ionicons name="checkmark-done-circle" size={30} color={colors.success.default} />
              <AText variant="body" weight="semiBold" style={{ color: colors.success.default }}>
                All {label.toLowerCase()} tasks complete!
              </AText>
            </View>
          )}

          <View style={{ height: spacing[4] }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── Stat row ─────────────────────────────────────────────────────────────────

function StatRow({ icon, label, value, color }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string;
}) {
  return (
    <View style={srStyles.row}>
      <Ionicons name={icon} size={13} color={color} />
      <AText variant="caption" color="muted" style={srStyles.label}>{label}</AText>
      <AText style={[srStyles.value, { color }]}>{value}</AText>
    </View>
  );
}

const srStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  label: { flex: 1, fontSize: 11 },
  value: { fontFamily: fontFamily.bold, fontSize: 14 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
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
    alignSelf: 'center', marginTop: spacing[3], marginBottom: spacing[1],
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingVertical: spacing[4],
    borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  headerIcon: {
    width: 36, height: 36, borderRadius: radius.md,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: radius.full,
    backgroundColor: colors.bg.elevated, alignItems: 'center', justifyContent: 'center',
  },
  summary: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[6],
    paddingHorizontal: spacing[5], paddingVertical: spacing[5],
  },
  statsCol:  { flex: 1, gap: spacing[3] },
  ringInner: { alignItems: 'center', gap: 2 },
  ringPct:   { fontFamily: fontFamily.bold, fontSize: 26, letterSpacing: 0.5 },
  barTrack: {
    height: 8, marginHorizontal: spacing[5],
    backgroundColor: colors.bg.high, borderRadius: radius.full,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border.subtle,
  },
  barFill:     { height: '100%', borderRadius: radius.full, minWidth: 6 },
  scroll:      { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[5], paddingBottom: spacing[4] },
  emptyState: { alignItems: 'center', paddingTop: spacing[8], gap: spacing[3] },
  allDone:    { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingTop: spacing[5], justifyContent: 'center' },
});
