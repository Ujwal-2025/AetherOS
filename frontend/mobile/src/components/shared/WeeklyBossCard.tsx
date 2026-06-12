import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';
import { useWeeklyBossStore } from '../../store/useWeeklyBossStore';

function getDaysLeft(): string {
  const now     = new Date();
  const sunday  = new Date(now);
  const diff    = 7 - (now.getDay() === 0 ? 7 : now.getDay());
  sunday.setDate(now.getDate() + diff);
  sunday.setHours(23, 59, 59, 999);
  const ms   = sunday.getTime() - now.getTime();
  const days = Math.floor(ms / 86_400_000);
  const hrs  = Math.floor((ms % 86_400_000) / 3_600_000);
  return days > 0 ? `${days}d ${hrs}h` : `${hrs}h`;
}

export function WeeklyBossCard() {
  const { boss, refreshIfNewWeek } = useWeeklyBossStore();
  const [timeLeft, setTimeLeft] = useState(getDaysLeft());
  const barWidth = useSharedValue(0);

  const minuteProgress = boss.targetMinutes > 0 ? Math.min(boss.focusMinutesLogged / boss.targetMinutes, 1) : 1;
  const taskProgress   = boss.targetTasks   > 0 ? Math.min(boss.tasksCompleted     / boss.targetTasks,   1) : 1;
  const overallProgress = boss.targetMinutes > 0 && boss.targetTasks > 0
    ? (minuteProgress + taskProgress) / 2
    : Math.max(minuteProgress, taskProgress);

  const glow = Platform.OS === 'web' ? { boxShadow: `0 0 24px 4px rgba(255,71,71,0.18)` } as any : {};

  useEffect(() => {
    refreshIfNewWeek();
    const id = setInterval(() => { setTimeLeft(getDaysLeft()); refreshIfNewWeek(); }, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    barWidth.value = withSpring(overallProgress, { damping: 18, stiffness: 100 });
  }, [overallProgress]);

  const barStyle = useAnimatedStyle(() => ({ width: `${barWidth.value * 100}%` as any }));

  return (
    <View style={[styles.card, boss.isComplete && { borderColor: colors.success.default + '40' }, glow]}>
      <LinearGradient
        colors={boss.isComplete ? ['rgba(16,185,129,0.10)', 'transparent'] : ['rgba(255,71,71,0.08)', 'rgba(183,109,255,0.06)', 'transparent']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        pointerEvents="none"
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, boss.isComplete ? { backgroundColor: colors.success.default + '15', borderColor: colors.success.default + '30' } : { backgroundColor: 'rgba(255,71,71,0.12)', borderColor: 'rgba(255,71,71,0.30)' }]}>
            <Ionicons name={boss.isComplete ? 'checkmark-circle' : 'skull'} size={18} color={boss.isComplete ? colors.success.default : '#ff4747'} />
          </View>
          <View>
            <AText style={[styles.bossLabel, { color: boss.isComplete ? colors.success.default + 'AA' : 'rgba(255,71,71,0.7)' }]}>WEEKLY BOSS</AText>
            <AText variant="body" weight="bold" style={{ color: colors.white }}>{boss.title}</AText>
          </View>
        </View>
        {boss.isComplete ? (
          <View style={[styles.pill, { borderColor: colors.success.default + '40', backgroundColor: colors.success.default + '15' }]}>
            <Ionicons name="checkmark" size={12} color={colors.success.default} />
            <AText style={[styles.pillText, { color: colors.success.default }]}>Defeated</AText>
          </View>
        ) : (
          <View style={styles.timerPill}>
            <Ionicons name="time-outline" size={11} color={colors.text.faint} />
            <AText style={styles.timerText}>{timeLeft}</AText>
          </View>
        )}
      </View>

      <AText variant="caption" color="muted" style={styles.desc}>{boss.description}</AText>

      {/* Progress bars */}
      <View style={styles.progressSection}>
        {boss.targetMinutes > 0 && (
          <View style={styles.progressRow}>
            <View style={styles.progressLabels}>
              <AText variant="label" color="muted" style={{ fontSize: 10, letterSpacing: 1 }}>FOCUS</AText>
              <AText variant="label" style={{ fontSize: 10, color: boss.isComplete ? colors.success.default : '#ff4747' }}>
                {boss.focusMinutesLogged}m / {boss.targetMinutes}m
              </AText>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${minuteProgress * 100}%`, backgroundColor: boss.isComplete ? colors.success.default : '#ff4747' }]} />
            </View>
          </View>
        )}
        {boss.targetTasks > 0 && (
          <View style={styles.progressRow}>
            <View style={styles.progressLabels}>
              <AText variant="label" color="muted" style={{ fontSize: 10, letterSpacing: 1 }}>TASKS</AText>
              <AText variant="label" style={{ fontSize: 10, color: boss.isComplete ? colors.success.default : colors.primary.default }}>
                {boss.tasksCompleted} / {boss.targetTasks}
              </AText>
            </View>
            <View style={styles.track}>
              <Animated.View style={[styles.fill, { backgroundColor: boss.isComplete ? colors.success.default : colors.primary.default }, barStyle]} />
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Ionicons name="flash" size={14} color={boss.isComplete ? colors.success.default : '#ff4747'} />
        <AText style={[styles.xpLabel, { color: boss.isComplete ? colors.success.default : '#ff4747' }]}>+{boss.bonusXP.toLocaleString()} XP</AText>
        <View style={{ flex: 1 }} />
        <AText variant="caption" color="muted">Boss reward</AText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card:          { borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,71,71,0.25)', backgroundColor: colors.bg.surface, padding: spacing[5], gap: spacing[4], overflow: 'hidden' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: spacing[3], flex: 1 },
  iconBox:       { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bossLabel:     { fontFamily: fontFamily.bold, fontSize: 9, letterSpacing: 2 },
  pill:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full, borderWidth: 1 },
  pillText:      { fontFamily: fontFamily.semiBold, fontSize: 11 },
  timerPill:     { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[3], paddingVertical: spacing[1], borderRadius: radius.full, backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.default },
  timerText:     { fontFamily: fontFamily.medium, fontSize: 10, color: colors.text.faint, letterSpacing: 0.5 },
  desc:          { lineHeight: 18, marginTop: -spacing[2] },
  progressSection: { gap: spacing[3] },
  progressRow:   { gap: spacing[2] },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track:         { height: 6, backgroundColor: colors.bg.high, borderRadius: radius.full, overflow: 'hidden' },
  fill:          { height: '100%', borderRadius: radius.full, minWidth: 4 },
  footer:        { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: colors.border.subtle },
  xpLabel:       { fontFamily: fontFamily.bold, fontSize: 14, letterSpacing: 0.5 },
});
