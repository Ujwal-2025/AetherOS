import React, { useState } from 'react';
import {
  View, Modal, StyleSheet, Pressable, TextInput,
  ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily, fontSize } from '../../theme';
import { AText } from '../ui/AText';
import { AButton } from '../ui/AButton';
import { useTaskStore } from '../../store/useTaskStore';
import { TaskPriority, TaskCategory, RecurrenceType } from '../../types';
import { XP_BY_PRIORITY } from '../../utils/xp';

interface CreateTaskModalProps {
  visible:  boolean;
  onClose: () => void;
}

const PRIORITIES: { key: TaskPriority; label: string; color: string; xp: number }[] = [
  { key: 'low',      label: 'Low',      color: colors.text.muted,       xp: XP_BY_PRIORITY.low },
  { key: 'medium',   label: 'Medium',   color: colors.secondary.default, xp: XP_BY_PRIORITY.medium },
  { key: 'high',     label: 'High',     color: colors.primary.default,  xp: XP_BY_PRIORITY.high },
  { key: 'critical', label: 'Critical', color: colors.danger.default,   xp: XP_BY_PRIORITY.critical },
];

const CATEGORIES: { key: TaskCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'work',     label: 'Work',     icon: 'briefcase-outline' },
  { key: 'health',   label: 'Health',   icon: 'fitness-outline' },
  { key: 'learning', label: 'Learning', icon: 'book-outline' },
  { key: 'personal', label: 'Personal', icon: 'person-outline' },
  { key: 'custom',   label: 'Custom',   icon: 'star-outline' },
];

const DURATIONS = [15, 25, 30, 45, 60, 90, 120];

export function CreateTaskModal({ visible, onClose }: CreateTaskModalProps) {
  const { addTask } = useTaskStore();

  const [title,      setTitle]      = useState('');
  const [priority,   setPriority]   = useState<TaskPriority>('medium');
  const [category,   setCategory]   = useState<TaskCategory>('work');
  const [duration,   setDuration]   = useState(25);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  const selectedPriority = PRIORITIES.find((p) => p.key === priority)!;

  function handleSubmit() {
    if (!title.trim()) return;
    addTask({ title: title.trim(), priority, category, xpReward: selectedPriority.xp, recurrence, estimatedMinutes: duration, tags: [] });
    resetAndClose();
  }

  function resetAndClose() {
    setTitle(''); setPriority('medium'); setCategory('work'); setDuration(25); setRecurrence('none');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetAndClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.handleBar} />
          <View style={styles.header}>
            <AText variant="subheading" weight="bold">New Quest</AText>
            <Pressable onPress={resetAndClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.muted} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.field}>
              <AText variant="label" color="muted" uppercase style={styles.fieldLabel}>Quest Title</AText>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="What needs to be done?" placeholderTextColor={colors.text.faint} autoFocus returnKeyType="next" />
            </View>

            {/* Priority */}
            <View style={styles.field}>
              <AText variant="label" color="muted" uppercase style={styles.fieldLabel}>Priority</AText>
              <View style={styles.optionRow}>
                {PRIORITIES.map((p) => (
                  <Pressable key={p.key} style={[styles.priorityChip, priority === p.key && { borderColor: p.color, backgroundColor: p.color + '15' }]} onPress={() => setPriority(p.key)}>
                    <AText variant="label" weight={priority === p.key ? 'bold' : 'medium'} style={{ color: priority === p.key ? p.color : colors.text.muted, fontSize: 11 }}>{p.label}</AText>
                    <AText variant="label" style={{ color: priority === p.key ? p.color : colors.text.faint, fontSize: 10 }}>+{p.xp} XP</AText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Category */}
            <View style={styles.field}>
              <AText variant="label" color="muted" uppercase style={styles.fieldLabel}>Category</AText>
              <View style={styles.optionRow}>
                {CATEGORIES.map((c) => (
                  <Pressable key={c.key} style={[styles.categoryChip, category === c.key && styles.categoryChipActive]} onPress={() => setCategory(c.key)}>
                    <Ionicons name={c.icon} size={16} color={category === c.key ? colors.primary.default : colors.text.muted} />
                    <AText variant="label" style={{ color: category === c.key ? colors.primary.default : colors.text.muted, fontSize: 11 }}>{c.label}</AText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Duration */}
            <View style={styles.field}>
              <AText variant="label" color="muted" uppercase style={styles.fieldLabel}>Est. Duration</AText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.durationRow}>
                  {DURATIONS.map((d) => (
                    <Pressable key={d} style={[styles.durationChip, duration === d && styles.durationChipActive]} onPress={() => setDuration(d)}>
                      <AText variant="caption" weight={duration === d ? 'semiBold' : 'regular'} style={{ color: duration === d ? colors.primary.default : colors.text.muted }}>{d}m</AText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Recurrence */}
            <View style={styles.field}>
              <AText variant="label" color="muted" uppercase style={styles.fieldLabel}>Repeat</AText>
              <View style={styles.optionRow}>
                {(['none', 'daily', 'weekly'] as RecurrenceType[]).map((r) => (
                  <Pressable key={r} style={[styles.recurrenceChip, recurrence === r && styles.recurrenceChipActive]} onPress={() => setRecurrence(r)}>
                    <AText variant="label" style={{ color: recurrence === r ? colors.primary.default : colors.text.muted, fontSize: 11, textTransform: 'capitalize' }}>{r === 'none' ? 'Once' : r}</AText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* XP Preview */}
            <View style={styles.xpPreview}>
              <View style={styles.xpPreviewLeft}>
                <Ionicons name="flash" size={18} color={colors.primary.default} />
                <AText variant="body" weight="semiBold" style={{ color: colors.text.primary }}>XP Reward</AText>
              </View>
              <AText variant="heading" weight="bold" style={{ color: selectedPriority.color }}>+{selectedPriority.xp} XP</AText>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <AButton variant="primary" size="lg" label="Add Quest" fullWidth disabled={!title.trim()} onPress={handleSubmit} />
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: colors.bg.surface },
  container: { flex: 1 },
  handleBar: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border.strong, alignSelf: 'center', marginTop: spacing[3] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  closeBtn: { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.bg.elevated, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing[5], gap: spacing[6] },
  field:      { gap: spacing[3] },
  fieldLabel: { letterSpacing: 2, fontSize: 10 },
  input: { backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.md, padding: spacing[4], color: colors.text.primary, fontFamily: fontFamily.regular, fontSize: fontSize.base },
  optionRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  priorityChip: { flex: 1, minWidth: '22%', paddingVertical: spacing[3], paddingHorizontal: spacing[3], borderRadius: radius.md, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', gap: 3 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default },
  categoryChipActive: { borderColor: colors.primary.default + '60', backgroundColor: colors.primary.faint },
  durationRow: { flexDirection: 'row', gap: spacing[2] },
  durationChip: { paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default },
  durationChipActive: { borderColor: colors.primary.default + '60', backgroundColor: colors.primary.faint },
  recurrenceChip: { paddingVertical: spacing[2], paddingHorizontal: spacing[4], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default },
  recurrenceChipActive: { borderColor: colors.primary.default + '60', backgroundColor: colors.primary.faint },
  xpPreview: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.bg.elevated, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.default, padding: spacing[4] },
  xpPreviewLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  footer: { padding: spacing[5], borderTopWidth: 1, borderTopColor: colors.border.subtle },
});
