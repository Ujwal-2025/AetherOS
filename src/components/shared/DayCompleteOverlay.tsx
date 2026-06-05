import React, { useEffect } from 'react';
import { View, Modal, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';

interface DayCompleteOverlayProps {
  visible:   boolean;
  xpEarned:  number;
  streak:    number;
  onDismiss: () => void;
}

export function DayCompleteOverlay({ visible, xpEarned, streak, onDismiss }: DayCompleteOverlayProps) {
  const scale   = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    scale.value   = withSpring(1, { damping: 14, stiffness: 160 });
    opacity.value = withTiming(1, { duration: 300 });
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [visible]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity:   opacity.value,
  }));

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <LinearGradient
          colors={['rgba(16,185,129,0.15)', 'transparent', 'rgba(16,185,129,0.08)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          pointerEvents="none"
        />
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark-circle" size={56} color={colors.success.default} />
          </View>

          <AText style={styles.eyebrow}>DAY COMPLETE</AText>
          <AText style={styles.title}>All Quests Cleared</AText>
          <AText style={styles.subtitle}>Hunter, you've dominated today.</AText>

          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Ionicons name="flash" size={16} color={colors.primary.default} />
              <AText style={[styles.statValue, { color: colors.primary.default }]}>+{xpEarned}</AText>
              <AText style={styles.statLabel}>XP TODAY</AText>
            </View>
            <View style={[styles.stat, styles.statBorder]}>
              <Ionicons name="flame" size={16} color={colors.warning.default} />
              <AText style={[styles.statValue, { color: colors.warning.default }]}>{streak}</AText>
              <AText style={styles.statLabel}>DAY STREAK</AText>
            </View>
          </View>

          <Pressable style={styles.btn} onPress={onDismiss}>
            <AText style={styles.btnText}>Continue</AText>
            <Ionicons name="chevron-forward" size={14} color={colors.success.default} />
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: spacing[6] },
  card:        { width: '100%', maxWidth: 340, backgroundColor: '#0d0d0d', borderRadius: 28, borderWidth: 1, borderColor: colors.success.default + '30', padding: spacing[7], alignItems: 'center', gap: spacing[4] },
  checkCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.success.default + '15', borderWidth: 1.5, borderColor: colors.success.default + '40', alignItems: 'center', justifyContent: 'center' },
  eyebrow:     { fontFamily: fontFamily.bold, fontSize: 11, letterSpacing: 4, color: colors.success.default + 'AA', textTransform: 'uppercase' },
  title:       { fontFamily: fontFamily.bold, fontSize: 26, color: colors.white, letterSpacing: -0.5 },
  subtitle:    { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text.muted, textAlign: 'center' },
  statRow:     { flexDirection: 'row', width: '100%', marginTop: spacing[2] },
  stat:        { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing[4] },
  statBorder:  { borderLeftWidth: 1, borderColor: colors.border.subtle },
  statValue:   { fontFamily: fontFamily.bold, fontSize: 26, letterSpacing: 0.5 },
  statLabel:   { fontFamily: fontFamily.bold, fontSize: 9, letterSpacing: 2, color: colors.text.faint, textTransform: 'uppercase' },
  btn:         { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[8], paddingVertical: spacing[4], borderRadius: radius.full, borderWidth: 1, borderColor: colors.success.default + '50', backgroundColor: colors.success.default + '12', marginTop: spacing[2] },
  btnText:     { fontFamily: fontFamily.semiBold, fontSize: 15, color: colors.success.default },
});
