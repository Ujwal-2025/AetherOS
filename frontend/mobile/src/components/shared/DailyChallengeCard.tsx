import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';
import { useDailyChallengeStore } from '../../store/useDailyChallengeStore';

const CATEGORY_META: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  work:     { color: colors.primary.default,   icon: 'briefcase-outline' },
  health:   { color: colors.success.default,   icon: 'fitness-outline' },
  learning: { color: colors.secondary.default, icon: 'book-outline' },
  personal: { color: colors.warning.default,   icon: 'person-outline' },
  custom:   { color: colors.text.muted,        icon: 'star-outline' },
};

function getTimeUntilMidnight() {
  const now = new Date(), midnight = new Date(now); midnight.setHours(24, 0, 0, 0);
  const diff = midnight.getTime() - now.getTime();
  return `${Math.floor(diff / 3_600_000)}h ${Math.floor((diff % 3_600_000) / 60_000)}m`;
}

export function DailyChallengeCard() {
  const { challenge, refreshIfNewDay } = useDailyChallengeStore();
  const [countdown, setCountdown] = useState(getTimeUntilMidnight());
  const meta = CATEGORY_META[challenge.category] ?? CATEGORY_META.work;
  const progress = Math.min(challenge.focusMinutesLogged / challenge.targetMinutes, 1);
  const barWidth = useSharedValue(0);

  useEffect(() => {
    refreshIfNewDay();
    const id = setInterval(() => { setCountdown(getTimeUntilMidnight()); refreshIfNewDay(); }, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { barWidth.value = withSpring(progress, { damping: 18, stiffness: 100 }); }, [progress]);
  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value * 100}%` as any }));

  const glow = Platform.OS === 'web' ? { boxShadow: `0 0 20px 4px ${meta.color}25` } as any : {};

  return (
    <View style={[styles.card, { borderColor: meta.color + '35' }, glow]}>
      <LinearGradient colors={[meta.color + '12', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} pointerEvents="none" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: meta.color + '15', borderColor: meta.color + '30' }]}>
            <Ionicons name={meta.icon} size={18} color={meta.color} />
          </View>
          <View>
            <AText style={[styles.briefingLabel, { color: meta.color + 'AA' }]}>DAILY BRIEFING</AText>
            <AText variant="body" weight="bold" style={{ color: colors.white }}>{challenge.title}</AText>
          </View>
        </View>
        {challenge.isComplete ? (
          <View style={[styles.pill, { borderColor: colors.success.default + '40', backgroundColor: colors.success.default + '15' }]}>
            <Ionicons name="checkmark" size={12} color={colors.success.default} />
            <AText style={[styles.pillText, { color: colors.success.default }]}>Done</AText>
          </View>
        ) : (
          <View style={styles.countdownPill}>
            <Ionicons name="time-outline" size={11} color={colors.text.faint} />
            <AText style={styles.countdownText}>{countdown}</AText>
          </View>
        )}
      </View>
      <AText variant="caption" color="muted" style={styles.description}>{challenge.description}</AText>
      <View style={styles.progressSection}>
        <View style={styles.progressLabels}>
          <AText variant="label" color="muted" style={{ fontSize: 10, letterSpacing: 1 }}>FOCUS PROGRESS</AText>
          <AText variant="label" style={{ fontSize: 10, color: challenge.isComplete ? colors.success.default : meta.color }}>{challenge.focusMinutesLogged}m / {challenge.targetMinutes}m</AText>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { backgroundColor: challenge.isComplete ? colors.success.default : meta.color }, barStyle]} />
        </View>
      </View>
      <View style={styles.footer}>
        <Ionicons name="flash" size={14} color={meta.color} />
        <AText style={[styles.xpLabel, { color: meta.color }]}>+{challenge.bonusXP} XP</AText>
        <View style={{ flex: 1 }} />
        <AText variant="caption" color="muted">Bonus reward</AText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, backgroundColor: colors.bg.surface, padding: spacing[5], gap: spacing[4], overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  briefingLabel: { fontFamily: fontFamily.bold, fontSize: 9, letterSpacing: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full, borderWidth: 1 },
  pillText: { fontFamily: fontFamily.semiBold, fontSize: 11 },
  countdownPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full, backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.default },
  countdownText: { fontFamily: fontFamily.medium, fontSize: 10, color: colors.text.faint, letterSpacing: 0.5 },
  description: { lineHeight: 18, marginTop: -spacing[2] },
  progressSection: { gap: spacing[2] },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTrack: { height: 6, backgroundColor: colors.bg.high, borderRadius: radius.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.full, minWidth: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: colors.border.subtle },
  xpLabel: { fontFamily: fontFamily.bold, fontSize: 14, letterSpacing: 0.5 },
});
