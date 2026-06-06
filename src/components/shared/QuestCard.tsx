import React from 'react';
import { StyleSheet, Pressable, Platform } from 'react-native';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';
import { Task, TaskPriority } from '../../types';
import { useCategoryStore } from '../../store/useCategoryStore';

// ─── Meta maps ────────────────────────────────────────────────────────────────

const PRIORITY_META: Record<TaskPriority, { color: string; label: string }> = {
  low:      { color: colors.text.muted,        label: 'LOW' },
  medium:   { color: colors.secondary.default,  label: 'MED' },
  high:     { color: colors.primary.default,   label: 'HIGH' },
  critical: { color: colors.danger.default,    label: 'CRIT' },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface QuestCardProps {
  task:        Task;
  onStart?:    () => void;
  onComplete?: () => void;
  onDelete?:   () => void;
  onEdit?:     () => void;
}

export function QuestCard({ task, onStart, onComplete, onDelete, onEdit }: QuestCardProps) {
  const pm          = PRIORITY_META[task.priority];
  const isCompleted = task.status === 'completed';
  const { getCategory } = useCategoryStore();
  const catIcon = (getCategory(task.category)?.icon ?? 'star-outline') as keyof typeof Ionicons.glyphMap;

  const glowStyle = !isCompleted && Platform.OS === 'web'
    ? { boxShadow: `0 0 0 1px ${pm.color}18` }
    : {};

  // Whole-card press starts a focus session; no-op when completed or no handler
  function handleCardPress() {
    if (!isCompleted && onStart) onStart();
  }

  return (
    <Pressable
      style={[styles.card, isCompleted && styles.cardDone, glowStyle]}
      onPress={handleCardPress}
      disabled={isCompleted || !onStart}
    >
      {/* Left accent bar */}
      <View style={[styles.accent, { backgroundColor: isCompleted ? colors.success.default : pm.color }]} />

      {/* Content */}
      <View style={styles.content}>
        {/* Title row */}
        <View style={styles.titleRow}>
          <Ionicons
            name={catIcon}
            size={14}
            color={isCompleted ? colors.text.faint : colors.text.muted}
          />
          <AText
            variant="body"
            weight="semiBold"
            style={[styles.title, isCompleted && styles.titleDone]}
            numberOfLines={2}
          >
            {task.title}
          </AText>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={[styles.priorityBadge, { borderColor: pm.color + '40', backgroundColor: pm.color + '12' }]}>
            <AText style={[styles.priorityText, { color: pm.color }]}>{pm.label}</AText>
          </View>

          {task.estimatedMinutes && (
            <View style={styles.metaChip}>
              <Ionicons name="timer-outline" size={10} color={colors.text.faint} />
              <AText style={styles.metaText}>{task.estimatedMinutes}m</AText>
            </View>
          )}

          <View style={styles.xpChip}>
            <Ionicons name="flash" size={10} color={isCompleted ? colors.success.default : colors.primary.default} />
            <AText style={[styles.xpText, { color: isCompleted ? colors.success.default : colors.primary.default }]}>
              +{task.xpReward} XP
            </AText>
          </View>
        </View>
      </View>

      {/* Right action area */}
      <View style={styles.actions}>
        {isCompleted ? (
          <View style={styles.doneIcon}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success.default} />
          </View>
        ) : (
          <>
            {onComplete && (
              // stopPropagation equivalent: onPress on this button, card Pressable won't also fire
              <Pressable
                style={[styles.actionBtn, styles.completeBtn]}
                onPress={(e) => { e.stopPropagation?.(); onComplete(); }}
              >
                <Ionicons name="checkmark" size={16} color={colors.success.default} />
              </Pressable>
            )}
            {/* Play icon hint — decorative, card itself is the tap target */}
            {onStart && !onComplete && (
              <View style={[styles.actionBtn, styles.startHint]}>
                <Ionicons name="play" size={14} color={colors.primary.default} />
              </View>
            )}
          </>
        )}
      </View>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.bg.surface,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    overflow:        'hidden',
  },
  cardDone: {
    opacity:     0.6,
    borderColor: colors.success.default + '20',
  },
  accent: {
    width:        3,
    alignSelf:    'stretch',
    borderRadius: 3,
    marginLeft:   1,
  },
  content: {
    flex:    1,
    padding: spacing[4],
    gap:     spacing[2],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           spacing[2],
  },
  title: {
    flex:       1,
    color:      colors.text.primary,
    lineHeight: 20,
  },
  titleDone: {
    color:              colors.text.faint,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
    flexWrap:      'wrap',
  },
  priorityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical:   2,
    borderRadius:      radius.sm,
    borderWidth:       1,
  },
  priorityText: {
    fontFamily:    fontFamily.bold,
    fontSize:      9,
    letterSpacing: 1,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           3,
  },
  metaText: {
    fontFamily: fontFamily.regular,
    fontSize:   10,
    color:      colors.text.faint,
  },
  xpChip: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           3,
    marginLeft:    'auto',
  },
  xpText: {
    fontFamily:    fontFamily.bold,
    fontSize:      11,
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           spacing[2],
    paddingRight:  spacing[3],
  },
  actionBtn: {
    width:          32,
    height:         32,
    borderRadius:   radius.full,
    borderWidth:    1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  completeBtn: {
    borderColor:     colors.success.default + '50',
    backgroundColor: colors.success.faint,
  },
  // Non-interactive hint icon — shown when only onStart is provided (Dashboard cards)
  startHint: {
    borderColor:     colors.primary.default + '30',
    backgroundColor: colors.primary.faint,
    opacity:         0.7,
  },
  doneIcon: {
    paddingHorizontal: spacing[2],
  },
});
