import React, { useState } from 'react';
import {
  View, Modal, StyleSheet, Pressable, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';
import { useTaskStore } from '../../store/useTaskStore';
import { useGoalStore } from '../../store/useGoalStore';
import { useCategoryStore } from '../../store/useCategoryStore';
import { XPFlyOut } from './XPFlyOut';
import { XP_BY_PRIORITY } from '../../utils/xp';
import { GoalPlan, GoalTaskRaw } from './GoalInputSheet';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function weekOffsetToDate(weekOffset: number): number {
  const d = new Date();
  d.setDate(d.getDate() + weekOffset * 7);
  d.setHours(23, 59, 0, 0);
  return d.getTime();
}

function totalXP(tasks: GoalTaskRaw[], selected: Record<string, boolean>): number {
  return tasks.reduce((sum, t, i) => {
    const key = `${t.title}-${i}`;
    return selected[key] ? sum + XP_BY_PRIORITY[t.priority] : sum;
  }, 0);
}

// ─── Task row ────────────────────────────────────────────────────────────────

function TaskRow({
  task, id, selected, onToggle, color, badge,
}: {
  task: GoalTaskRaw; id: string; selected: boolean;
  onToggle: (id: string) => void; color: string; badge?: string;
}) {
  const xp = XP_BY_PRIORITY[task.priority];
  return (
    <Pressable style={[styles.taskRow, selected && { borderColor: color + '40', backgroundColor: color + '08' }]} onPress={() => onToggle(id)}>
      <View style={[styles.checkbox, selected && { backgroundColor: color, borderColor: color }]}>
        {selected && <Ionicons name="checkmark" size={12} color={colors.black} />}
      </View>
      <View style={styles.taskInfo}>
        <AText variant="body" weight="semiBold" style={[styles.taskTitle, !selected && { color: colors.text.muted }]} numberOfLines={2}>{task.title}</AText>
        <View style={styles.taskMeta}>
          {badge && (
            <View style={[styles.badge, { borderColor: color + '40', backgroundColor: color + '12' }]}>
              <AText style={[styles.badgeText, { color }]}>{badge}</AText>
            </View>
          )}
          <Ionicons name="timer-outline" size={10} color={colors.text.faint} />
          <AText style={styles.metaText}>{task.estimatedMinutes}m</AText>
          <Ionicons name="flash" size={10} color={selected ? color : colors.text.faint} />
          <AText style={[styles.metaText, selected && { color }]}>+{xp} XP</AText>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Section ─────────────────────────────────────────────────────────────────

function Section({ title, icon, color, children }: { title: string; icon: keyof typeof Ionicons.glyphMap; color: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: color + '15', borderColor: color + '30' }]}>
          <Ionicons name={icon} size={14} color={color} />
        </View>
        <AText variant="caption" weight="bold" uppercase style={{ color, letterSpacing: 2, fontSize: 10 }}>{title}</AText>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface GoalPlanPreviewSheetProps {
  visible:    boolean;
  plan:       GoalPlan | null;
  targetDate: string;
  onClose:    () => void;
  onConfirm:  () => void;
}

export function GoalPlanPreviewSheet({ visible, plan, targetDate, onClose, onConfirm }: GoalPlanPreviewSheetProps) {
  const { addTask }        = useTaskStore();
  const { addGoal }        = useGoalStore();
  const { getCategory }    = useCategoryStore();
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [flyXP, setFlyXP]       = useState<number | null>(null);

  // Pre-select all on first open — must stay BEFORE any early return
  React.useEffect(() => {
    if (!visible || !plan) return;
    const init: Record<string, boolean> = {};
    [
      plan.dailyHabit,
      ...plan.milestones,
      ...plan.thisWeek,
    ].forEach((task, i) => { init[`${task.title}-${i}`] = true; });
    setSelected(init);
  }, [visible, plan?.goalId]);

  if (!plan) return null;

  const allTasks = [
    { task: plan.dailyHabit, section: 'habit'     },
    ...plan.milestones.map((t) => ({ task: t, section: 'milestone' })),
    ...plan.thisWeek.map((t)  => ({ task: t, section: 'thisweek'  })),
  ];

  function makeId(task: GoalTaskRaw, i: number) { return `${task.title}-${i}`; }

  function toggle(id: string) {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  }

  function getCatColor(catId: string): string {
    return getCategory(catId)?.color ?? colors.primary.default;
  }

  function handleConfirm() {
    if (!plan) return;
    const tagKey = `goal:${plan.goalId}`;
    let count = 0;
    let earnedXP = 0;

    allTasks.forEach(({ task, section }, i) => {
      const id = makeId(task, i);
      if (!selected[id]) return;
      const xp = XP_BY_PRIORITY[task.priority];
      addTask({
        title:            task.title,
        priority:         task.priority,
        category:         task.category,
        xpReward:         xp,
        recurrence:       section === 'habit' ? 'daily' : 'none',
        estimatedMinutes: task.estimatedMinutes,
        dueDate:          section === 'milestone' && task.weekOffset ? weekOffsetToDate(task.weekOffset) : undefined,
        tags:             [tagKey],
      });
      count++;
      earnedXP += xp;
    });

    addGoal({
      id:         plan.goalId,
      title:      plan.goalTitle,
      targetDate,
      tagKey,
      taskCount:  count,
    });

    setFlyXP(earnedXP);
    setTimeout(() => { setFlyXP(null); onConfirm(); }, 1800);
  }

  const habitColor     = getCatColor(plan.dailyHabit.category);
  const milestoneColor = colors.warning.default;
  const weekColor      = colors.success.default;

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const totalXPValue  = allTasks.reduce((sum, { task }, i) => {
    return selected[makeId(task, i)] ? sum + XP_BY_PRIORITY[task.priority] : sum;
  }, 0);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <LinearGradient colors={['rgba(183,109,255,0.06)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.4 }} pointerEvents="none" />

        <View style={styles.handleBar} />

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <AText variant="subheading" weight="bold">{plan.goalTitle}</AText>
            <AText variant="caption" color="muted" style={{ marginTop: 2 }}>Review your quest plan · tap to toggle</AText>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.text.muted} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* Daily Habit */}
          <Section title="Daily Habit" icon="repeat-outline" color={habitColor}>
            <TaskRow
              task={plan.dailyHabit}
              id={makeId(plan.dailyHabit, 0)}
              selected={selected[makeId(plan.dailyHabit, 0)] ?? true}
              onToggle={toggle}
              color={habitColor}
              badge="Repeats daily"
            />
          </Section>

          {/* Milestones */}
          {plan.milestones.length > 0 && (
            <Section title="Milestones" icon="flag-outline" color={milestoneColor}>
              {plan.milestones.map((t, i) => {
                const idx = i + 1;
                const id  = makeId(t, idx);
                return (
                  <TaskRow
                    key={id}
                    task={t}
                    id={id}
                    selected={selected[id] ?? true}
                    onToggle={toggle}
                    color={milestoneColor}
                    badge={t.weekOffset ? `Week ${t.weekOffset}` : undefined}
                  />
                );
              })}
            </Section>
          )}

          {/* This Week */}
          {plan.thisWeek.length > 0 && (
            <Section title="This Week" icon="flash-outline" color={weekColor}>
              {plan.thisWeek.map((t, i) => {
                const idx = 1 + plan.milestones.length + i;
                const id  = makeId(t, idx);
                return (
                  <TaskRow
                    key={id}
                    task={t}
                    id={id}
                    selected={selected[id] ?? true}
                    onToggle={toggle}
                    color={weekColor}
                  />
                );
              })}
            </Section>
          )}

          <View style={{ height: spacing[8] }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerStats}>
            <AText variant="caption" color="muted">{selectedCount} quests selected</AText>
            <View style={styles.xpPill}>
              <Ionicons name="flash" size={12} color={colors.primary.default} />
              <AText variant="caption" weight="bold" style={{ color: colors.primary.default }}>+{totalXPValue} XP incoming</AText>
            </View>
          </View>
          <Pressable
            style={[styles.confirmBtn, selectedCount === 0 && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={selectedCount === 0}
          >
            <AText style={styles.confirmText}>Add {selectedCount} quest{selectedCount !== 1 ? 's' : ''} to AetherOS</AText>
            <Ionicons name="arrow-forward" size={16} color={colors.black} />
          </Pressable>
        </View>

        <XPFlyOut xp={flyXP ?? 0} color={colors.primary.default} visible={flyXP !== null} onHide={() => setFlyXP(null)} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: colors.bg.primary },
  handleBar:    { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border.strong, alignSelf: 'center', marginTop: spacing[3] },
  header:       { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border.subtle, gap: spacing[3] },
  closeBtn:     { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.bg.elevated, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  scroll:       { flex: 1 },
  scrollContent: { padding: spacing[5], gap: spacing[5] },

  section:      { gap: spacing[3] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  sectionIcon:  { width: 26, height: 26, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sectionBody:  { gap: spacing[2] },

  taskRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle, padding: spacing[4] },
  checkbox:     { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: colors.border.strong, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  taskInfo:     { flex: 1, gap: spacing[2] },
  taskTitle:    { color: colors.text.primary, lineHeight: 20, fontSize: 14 },
  taskMeta:     { flexDirection: 'row', alignItems: 'center', gap: spacing[2], flexWrap: 'wrap' },
  badge:        { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius.sm, borderWidth: 1 },
  badgeText:    { fontFamily: fontFamily.bold, fontSize: 9, letterSpacing: 1 },
  metaText:     { fontFamily: fontFamily.regular, fontSize: 10, color: colors.text.faint },

  footer:       { padding: spacing[5], borderTopWidth: 1, borderTopColor: colors.border.subtle, gap: spacing[3] },
  footerStats:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  xpPill:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full, backgroundColor: colors.primary.faint, borderWidth: 1, borderColor: colors.primary.default + '30' },
  confirmBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], backgroundColor: colors.primary.container, borderRadius: radius.full, paddingVertical: spacing[4] },
  confirmBtnDisabled: { backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.default },
  confirmText:  { fontFamily: fontFamily.semiBold, fontSize: 16, color: colors.black, letterSpacing: 0.3 },
});
