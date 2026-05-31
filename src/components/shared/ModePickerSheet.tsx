import React from 'react';
import { View, Modal, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';
import { FocusMode } from '../../types';

interface Mode {
  key:      FocusMode;
  label:    string;
  subtitle: string;
  minutes:  number;
  xp:       number;
  color:    string;
  icon:     keyof typeof Ionicons.glyphMap;
}

const MODES: Mode[] = [
  { key: 'deep',   label: 'Deep Work',   subtitle: 'Full immersion',  minutes: 90, xp: 500, color: colors.primary.default,   icon: 'skull-outline' },
  { key: 'flow',   label: 'Flow State',  subtitle: 'Steady focus',    minutes: 60, xp: 300, color: colors.secondary.default, icon: 'water-outline' },
  { key: 'sprint', label: 'Sprint',      subtitle: 'Fast burst',      minutes: 25, xp: 150, color: colors.success.default,   icon: 'flash-outline' },
];

interface ModePickerSheetProps {
  visible:   boolean;
  taskTitle: string;
  onSelect:  (mode: FocusMode) => void;
  onClose:   () => void;
}

export function ModePickerSheet({ visible, taskTitle, onSelect, onClose }: ModePickerSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <AText variant="caption" color="muted" numberOfLines={1} style={styles.taskLabel}>{taskTitle}</AText>
          <AText variant="subheading" weight="bold">Select Focus Mode</AText>
        </View>
        <View style={styles.modeList}>
          {MODES.map((mode) => (
            <Pressable key={mode.key} style={styles.modeRow} onPress={() => onSelect(mode.key)}>
              <View style={[styles.modeIcon, { backgroundColor: mode.color + '15', borderColor: mode.color + '30' }]}>
                <Ionicons name={mode.icon} size={22} color={mode.color} />
              </View>
              <View style={styles.modeInfo}>
                <AText variant="body" weight="semiBold">{mode.label}</AText>
                <AText variant="caption" color="muted">{mode.subtitle}</AText>
              </View>
              <View style={styles.modeMeta}>
                <AText variant="body" weight="bold" style={{ color: mode.color }}>{mode.minutes}m</AText>
                <AText variant="caption" style={{ color: mode.color + 'AA' }}>+{mode.xp} XP</AText>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.text.faint} />
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <AText variant="body" color="muted">Cancel</AText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor:  colors.bg.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth:   1,
    borderColor:      colors.border.default,
    paddingBottom:    spacing[8],
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border.strong,
    alignSelf: 'center', marginTop: spacing[3], marginBottom: spacing[2],
  },
  header: {
    paddingHorizontal: spacing[5], paddingVertical: spacing[4],
    gap: spacing[1], borderBottomWidth: 1, borderBottomColor: colors.border.subtle,
  },
  taskLabel: { color: colors.primary.default, letterSpacing: 0.5 },
  modeList:  { paddingHorizontal: spacing[4], paddingTop: spacing[3], gap: spacing[2] },
  modeRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    padding: spacing[4], borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.border.subtle, backgroundColor: colors.bg.elevated,
  },
  modeIcon: {
    width: 46, height: 46, borderRadius: radius.md,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  modeInfo: { flex: 1, gap: 2 },
  modeMeta: { alignItems: 'flex-end', gap: 2 },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing[4], marginTop: spacing[2] },
});
