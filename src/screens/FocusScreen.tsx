import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { CircularProgress } from '../components/shared/CircularProgress';
import { XPFlyOut } from '../components/shared/XPFlyOut';
import { useUserStore } from '../store/useUserStore';
import { useFocusStore } from '../store/useFocusStore';
import { useDailyChallengeStore } from '../store/useDailyChallengeStore';
import { useAchievementStore } from '../store/useAchievementStore';
import { useStatsStore } from '../store/useStatsStore';
import { haptics } from '../utils/haptics';
import { FocusMode } from '../types';

interface ModeConfig {
  key:      FocusMode;
  label:    string;
  subtitle: string;
  minutes:  number;
  xp:       number;
  color:    string;
  icon:     keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
}

const MODES: ModeConfig[] = [
  { key: 'deep',   label: 'Deep Work',  subtitle: 'No interruptions. Full immersion.',   minutes: 90, xp: 500, color: colors.primary.default,   icon: 'skull-outline',  gradient: ['rgba(183,109,255,0.12)', 'transparent'] },
  { key: 'flow',   label: 'Flow State', subtitle: 'Sustained focus. Steady output.',     minutes: 60, xp: 300, color: colors.secondary.default, icon: 'water-outline',  gradient: ['rgba(173,198,255,0.12)', 'transparent'] },
  { key: 'sprint', label: 'Sprint',     subtitle: 'Short burst. Fast wins.',             minutes: 25, xp: 150, color: colors.success.default,   icon: 'flash-outline',  gradient: ['rgba(16,185,129,0.12)',  'transparent'] },
];

type Stage = 'select' | 'running' | 'complete';

export function FocusScreen() {
  const [stage,      setStage]      = useState<Stage>('select');
  const [activeMode, setActiveMode] = useState<ModeConfig>(MODES[0]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isPaused,   setIsPaused]   = useState(false);
  const [xpEarned,   setXpEarned]   = useState(0);
  const [flyOutXP,   setFlyOutXP]   = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addXP, addFocusMinutes, incrementCombo, profile, rank } = useUserStore();
  const { pendingTaskTitle, autoStartMode, clearPendingTask } = useFocusStore();
  const { logFocusMinutes: logChallengeMinutes } = useDailyChallengeStore();
  const { checkAchievements } = useAchievementStore();
  const { recordActivity, deepWorkSessions } = useStatsStore();

  useEffect(() => {
    if (autoStartMode && stage === 'select') {
      const mode = MODES.find((m) => m.key === autoStartMode) ?? MODES[1];
      startSession(mode);
    }
  }, [autoStartMode]);

  function startSession(mode: ModeConfig) {
    setActiveMode(mode);
    setSecondsLeft(mode.minutes * 60);
    setIsPaused(false);
    setStage('running');
  }

  function handleComplete() {
    clearInterval(intervalRef.current!);
    const earned = activeMode.xp;
    setXpEarned(earned);
    addXP(earned);
    addFocusMinutes(activeMode.minutes);
    logChallengeMinutes(activeMode.minutes);
    incrementCombo();
    clearPendingTask();
    haptics.focusComplete();
    setFlyOutXP(earned);

    const isDeepWork = activeMode.key === 'deep';
    recordActivity({ xpEarned: earned, focusMinutes: activeMode.minutes, streakDay: profile.currentStreak, isDeepWork });
    checkAchievements({ totalTasks: profile.tasksCompleted, currentStreak: profile.currentStreak, longestStreak: profile.longestStreak, rank, focusMinutes: profile.focusMinutesTotal + activeMode.minutes, todayTasks: 0, deepWorkSessions: deepWorkSessions + (isDeepWork ? 1 : 0) });

    setStage('complete');
  }

  function handleEnd() {
    clearInterval(intervalRef.current!);
    const elapsed        = activeMode.minutes * 60 - secondsLeft;
    const elapsedMinutes = Math.floor(elapsed / 60);
    const earnedPartial  = Math.round((elapsed / (activeMode.minutes * 60)) * activeMode.xp);
    setXpEarned(earnedPartial);
    if (earnedPartial > 0) { addXP(earnedPartial); setFlyOutXP(earnedPartial); }
    addFocusMinutes(elapsedMinutes);
    if (elapsedMinutes > 0) logChallengeMinutes(elapsedMinutes);
    clearPendingTask();
    if (earnedPartial > 0) haptics.success();
    setStage('complete');
  }

  function handleRestart() {
    clearPendingTask(); setStage('select'); setIsPaused(false); setSecondsLeft(0);
  }

  useEffect(() => {
    if (stage !== 'running' || isPaused) { clearInterval(intervalRef.current!); return; }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => { if (s <= 1) { handleComplete(); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [stage, isPaused]);

  if (stage === 'select')   return <ModeSelectView onSelect={startSession} />;
  if (stage === 'complete') return <CompleteView mode={activeMode} xp={xpEarned} onRestart={handleRestart} />;

  const total    = activeMode.minutes * 60;
  const progress = (total - secondsLeft) / total;
  const mins     = Math.floor(secondsLeft / 60);
  const secs     = secondsLeft % 60;
  const timeStr  = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={activeMode.gradient} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} />

      <View style={styles.timerHeader}>
        <Pressable onPress={handleEnd} style={styles.endBtn}>
          <Ionicons name="close" size={18} color={colors.text.muted} />
          <AText variant="label" color="muted">End</AText>
        </Pressable>
        <AText variant="label" weight="bold" uppercase style={{ color: activeMode.color, letterSpacing: 2 }}>{activeMode.label}</AText>
        <Pressable style={styles.pauseBtn} onPress={() => setIsPaused((p) => !p)}>
          <Ionicons name={isPaused ? 'play' : 'pause'} size={18} color={colors.text.muted} />
        </Pressable>
      </View>

      {pendingTaskTitle && (
        <View style={styles.linkedTask}>
          <Ionicons name="link-outline" size={12} color={colors.text.muted} />
          <AText variant="caption" color="muted" numberOfLines={1} style={{ flex: 1 }}>{pendingTaskTitle}</AText>
        </View>
      )}

      <View style={styles.timerCenter}>
        <CircularProgress size={280} progress={progress} strokeWidth={8} color={activeMode.color} trackColor={colors.bg.high}>
          <View style={styles.timerInner}>
            {isPaused && <AText variant="label" color="muted" uppercase style={{ letterSpacing: 3, marginBottom: 4 }}>Paused</AText>}
            <AText style={[styles.timeDisplay, { color: activeMode.color }]}>{timeStr}</AText>
            <AText variant="label" color="muted" uppercase style={{ letterSpacing: 2, marginTop: 4 }}>Remaining</AText>
          </View>
        </CircularProgress>
      </View>

      <XPFlyOut xp={flyOutXP ?? 0} color={activeMode.color} visible={flyOutXP !== null} onHide={() => setFlyOutXP(null)} />

      <View style={styles.timerFooter}>
        <View style={styles.timerStat}><AText variant="label" color="muted" uppercase style={{ letterSpacing: 1.5, fontSize: 9 }}>XP Reward</AText><AText variant="subheading" weight="bold" style={{ color: activeMode.color }}>+{activeMode.xp}</AText></View>
        <View style={[styles.timerStat, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border.subtle }]}><AText variant="label" color="muted" uppercase style={{ letterSpacing: 1.5, fontSize: 9 }}>Mode</AText><AText variant="body" weight="semiBold">{activeMode.label}</AText></View>
        <View style={styles.timerStat}><AText variant="label" color="muted" uppercase style={{ letterSpacing: 1.5, fontSize: 9 }}>Duration</AText><AText variant="subheading" weight="bold">{activeMode.minutes}m</AText></View>
      </View>
    </SafeAreaView>
  );
}

function ModeSelectView({ onSelect }: { onSelect: (m: ModeConfig) => void }) {
  const { pendingTaskTitle } = useFocusStore();
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.selectHeader}>
        <AText variant="heading" weight="bold">Focus</AText>
        <AText variant="body" color="muted" style={{ marginTop: spacing[1] }}>Choose your session type</AText>
        {pendingTaskTitle && (
          <View style={styles.linkedTask}>
            <Ionicons name="link-outline" size={12} color={colors.primary.default} />
            <AText variant="caption" style={{ color: colors.primary.default }} numberOfLines={1}>{pendingTaskTitle}</AText>
          </View>
        )}
      </View>
      <View style={styles.modeList}>
        {MODES.map((mode) => (
          <Pressable key={mode.key} style={styles.modeCard} onPress={() => onSelect(mode)}>
            <LinearGradient colors={mode.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />
            <View style={[styles.modeIconBox, { borderColor: mode.color + '30', backgroundColor: mode.color + '10' }]}>
              <Ionicons name={mode.icon} size={26} color={mode.color} />
            </View>
            <View style={styles.modeInfo}>
              <AText variant="subheading" weight="bold">{mode.label}</AText>
              <AText variant="caption" color="muted" style={{ marginTop: 2 }}>{mode.subtitle}</AText>
            </View>
            <View style={styles.modeMeta}>
              <AText variant="body" weight="bold" style={{ color: mode.color }}>{mode.minutes}m</AText>
              <AText variant="caption" style={{ color: mode.color + 'AA' }}>+{mode.xp} XP</AText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.faint} />
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

function CompleteView({ mode, xp, onRestart }: { mode: ModeConfig; xp: number; onRestart: () => void }) {
  return (
    <SafeAreaView style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]} edges={['top', 'bottom']}>
      <LinearGradient colors={mode.gradient} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} />
      <View style={styles.completeOrb}><Ionicons name="checkmark-circle" size={64} color={mode.color} /></View>
      <View style={styles.completeText}>
        <AText variant="title" weight="bold" style={{ textAlign: 'center' }}>Session Complete</AText>
        <AText variant="body" color="muted" style={{ textAlign: 'center', marginTop: spacing[2] }}>{mode.label} · {mode.minutes} minutes</AText>
      </View>
      <View style={styles.xpBanner}>
        <Ionicons name="flash" size={22} color={mode.color} />
        <AText style={[styles.xpBannerText, { color: mode.color }]}>+{xp} XP earned</AText>
      </View>
      <Pressable style={[styles.restartBtn, { borderColor: mode.color + '50', backgroundColor: mode.color + '15' }]} onPress={onRestart}>
        <AText variant="body" weight="semiBold" style={{ color: mode.color }}>New Session</AText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: colors.bg.primary },
  selectHeader: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[6] },
  modeList:    { paddingHorizontal: spacing[5], gap: spacing[3] },
  modeCard:    { flexDirection: 'row', alignItems: 'center', gap: spacing[4], backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle, padding: spacing[4], overflow: 'hidden' },
  modeIconBox: { width: 52, height: 52, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modeInfo:    { flex: 1 },
  modeMeta:    { alignItems: 'flex-end', gap: 2 },
  timerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
  endBtn:      { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default },
  pauseBtn:    { width: 36, height: 36, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center' },
  linkedTask:  { flexDirection: 'row', alignItems: 'center', gap: spacing[2], alignSelf: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.default, maxWidth: 260, marginBottom: spacing[2] },
  timerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timerInner:  { alignItems: 'center' },
  timeDisplay: { fontSize: 56, fontFamily: fontFamily.bold, letterSpacing: 2, lineHeight: 64 },
  timerFooter: { flexDirection: 'row', marginHorizontal: spacing[5], marginBottom: spacing[8], backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle, overflow: 'hidden' },
  timerStat:   { flex: 1, alignItems: 'center', paddingVertical: spacing[4], gap: 4 },
  completeOrb: { width: 120, height: 120, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.elevated, marginBottom: spacing[6] },
  completeText: { alignItems: 'center', marginBottom: spacing[6] },
  xpBanner:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[6], paddingVertical: spacing[3], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.elevated, marginBottom: spacing[8] },
  xpBannerText: { fontFamily: fontFamily.bold, fontSize: 22 },
  restartBtn: { paddingHorizontal: spacing[8], paddingVertical: spacing[4], borderRadius: radius.full, borderWidth: 1 },
});
