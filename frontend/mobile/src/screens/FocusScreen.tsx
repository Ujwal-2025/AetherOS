import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import Animated from 'react-native-reanimated';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { CircularProgress } from '../components/shared/CircularProgress';
import { XPFlyOut } from '../components/shared/XPFlyOut';
import { useUserStore } from '../store/useUserStore';
import { useFocusStore } from '../store/useFocusStore';
import { useDailyChallengeStore } from '../store/useDailyChallengeStore';
import { useWeeklyBossStore } from '../store/useWeeklyBossStore';
import { useAchievementStore } from '../store/useAchievementStore';
import { useStatsStore } from '../store/useStatsStore';
import { haptics } from '../utils/haptics';
import { playSuccessSound } from '../utils/sound';
import { requestNotificationPermissions, scheduleTimerCompletion, cancelTimerNotifications } from '../utils/notifications';
import { FocusMode } from '../types';

interface ModeConfig {
  key: FocusMode;
  label: string;
  subtitle: string;
  minutes: number;
  xp: number;
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradient: [string, string];
}

const MODES: ModeConfig[] = [
  { key: 'deep', label: 'Deep Work', subtitle: 'No interruptions. Full immersion.', minutes: 90, xp: 500, color: colors.primary.default, icon: 'skull-outline', gradient: ['rgba(183,109,255,0.12)', 'transparent'] },
  { key: 'flow', label: 'Flow State', subtitle: 'Sustained focus. Steady output.', minutes: 60, xp: 300, color: colors.secondary.default, icon: 'water-outline', gradient: ['rgba(173,198,255,0.12)', 'transparent'] },
  { key: 'sprint', label: 'Sprint', subtitle: 'Short burst. Fast wins.', minutes: 25, xp: 150, color: colors.success.default, icon: 'flash-outline', gradient: ['rgba(16,185,129,0.12)', 'transparent'] },
  { key: 'custom', label: 'Custom', subtitle: 'Your time. Your rules.', minutes: 0, xp: 0, color: '#fbbf24', icon: 'create-outline', gradient: ['rgba(251,191,36,0.12)', 'transparent'] },
];

type Stage = 'select' | 'custom_input' | 'ready' | 'running' | 'complete';

export function FocusScreen() {
  const isFocused = useIsFocused();
  const [stage, setStage] = useState<Stage>('select');
  const [activeMode, setActiveMode] = useState<ModeConfig>(MODES[0]);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [flyOutXP, setFlyOutXP] = useState<number | null>(null);
  const [customMinutes, setCustomMinutes] = useState(30);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { addXP, addFocusMinutes, incrementCombo, profile, rank } = useUserStore();
  const { pendingTaskTitle, autoStartMode, clearPendingTask } = useFocusStore();
  const { logFocusMinutes: logChallengeMinutes } = useDailyChallengeStore();
  const { logFocusMinutes: logBossMinutes } = useWeeklyBossStore();
  const { checkAchievements } = useAchievementStore();
  const { recordActivity, deepWorkSessions } = useStatsStore();

  useEffect(() => {
    if (!isFocused) return;

    if (autoStartMode && stage !== 'ready' && stage !== 'running' && stage !== 'custom_input') {
      const mode = MODES.find((m) => m.key === autoStartMode) ?? MODES[1];
      prepareSession(mode);
      setStage('ready');
    }
  }, [isFocused, autoStartMode, stage]);

  function prepareSession(mode: ModeConfig) {
    setActiveMode(mode);
    setSecondsLeft(mode.minutes * 60);
    setIsPaused(false);
  }

  async function startSession(mode: ModeConfig) {
    await requestNotificationPermissions();
    prepareSession(mode);
    setStage('running');
    scheduleTimerCompletion(mode.label, mode.minutes * 60);
  }

  async function startPreparedSession() {
    await requestNotificationPermissions();
    setIsPaused(false);
    setStage('running');
    scheduleTimerCompletion(activeMode.label, secondsLeft);
  }

  async function togglePause() {
    const willPause = !isPaused;
    setIsPaused(willPause);
    if (willPause) {
      await cancelTimerNotifications();
    } else {
      await requestNotificationPermissions();
      await scheduleTimerCompletion(activeMode.label, secondsLeft);
    }
  }

  function handleComplete() {
    clearInterval(intervalRef.current!);
    cancelTimerNotifications();
    const earned = activeMode.xp;
    const challengeBonus = logChallengeMinutes(activeMode.minutes);
    const bossBonus = logBossMinutes(activeMode.minutes);
    const total = earned + challengeBonus + bossBonus;
    setXpEarned(total);
    addXP(total);
    addFocusMinutes(activeMode.minutes);
    incrementCombo();
    clearPendingTask();
    haptics.focusComplete();
    playSuccessSound();
    setFlyOutXP(total);

    const isDeepWork = activeMode.key === 'deep';
    recordActivity({ xpEarned: earned, focusMinutes: activeMode.minutes, streakDay: profile.currentStreak, isDeepWork });
    checkAchievements({ totalTasks: profile.tasksCompleted, currentStreak: profile.currentStreak, longestStreak: profile.longestStreak, rank, focusMinutes: profile.focusMinutesTotal + activeMode.minutes, todayTasks: 0, deepWorkSessions: deepWorkSessions + (isDeepWork ? 1 : 0) });

    setStage('complete');
  }

  function handleEnd() {
    clearInterval(intervalRef.current!);
    cancelTimerNotifications();
    const elapsed = activeMode.minutes * 60 - secondsLeft;
    const elapsedMinutes = Math.floor(elapsed / 60);
    const earnedPartial = Math.round((elapsed / (activeMode.minutes * 60)) * activeMode.xp);
    let total = earnedPartial;
    if (elapsedMinutes > 0) {
      total += logChallengeMinutes(elapsedMinutes);
      total += logBossMinutes(elapsedMinutes);
    }
    setXpEarned(total);
    addFocusMinutes(elapsedMinutes);
    if (total > 0) { addXP(total); setFlyOutXP(total); }
    clearPendingTask();
    if (total > 0) haptics.success();
    setStage('complete');
  }

  function handleRestart() {
    cancelTimerNotifications();
    clearPendingTask(); setStage('select'); setIsPaused(false); setSecondsLeft(0);
  }

  async function startCustomSession() {
    const mins = Math.min(180, Math.max(1, customMinutes));
    const xp = Math.max(Math.round(mins * 3), 50);
    const mode: ModeConfig = {
      key: 'custom', label: 'Custom', subtitle: 'Your time. Your rules.',
      minutes: mins, xp, color: '#fbbf24', icon: 'create-outline',
      gradient: ['rgba(251,191,36,0.12)', 'transparent'],
    };
    await requestNotificationPermissions();
    prepareSession(mode);
    setStage('running');
    scheduleTimerCompletion(mode.label, mode.minutes * 60);
  }

  useEffect(() => {
    if (stage !== 'running' || isPaused) { clearInterval(intervalRef.current!); return; }
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => { if (s <= 1) { handleComplete(); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [stage, isPaused]);

  // Handle background/foreground state to keep timer accurate
  const appState = useRef(AppState.currentState);
  const backgroundTime = useRef<number | null>(null);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        if (backgroundTime.current && stage === 'running' && !isPaused) {
          const elapsedSeconds = Math.floor((Date.now() - backgroundTime.current) / 1000);
          setSecondsLeft((prev) => Math.max(0, prev - elapsedSeconds));
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to the background
        backgroundTime.current = Date.now();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [stage, isPaused]);

  if (stage === 'select') return <ModeSelectView onSelect={startSession} onCustom={() => setStage('custom_input')} />;
  if (stage === 'custom_input') return <CustomInputView customMinutes={customMinutes} setCustomMinutes={setCustomMinutes} onStart={startCustomSession} onBack={() => setStage('select')} />;
  if (stage === 'ready') return <ReadyView mode={activeMode} secondsLeft={secondsLeft} pendingTaskTitle={pendingTaskTitle} onStart={startPreparedSession} onCancel={handleRestart} />;
  if (stage === 'complete') return <CompleteView mode={activeMode} xp={xpEarned} onRestart={handleRestart} />;

  const total = activeMode.minutes * 60;
  const progress = (total - secondsLeft) / total;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <View style={styles.screenShell}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={activeMode.gradient} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} />

        <View style={styles.timerHeader}>
          <Pressable onPress={handleEnd} style={styles.endBtn}>
            <Ionicons name="close" size={18} color={colors.text.muted} />
            <AText variant="label" color="muted">End</AText>
          </Pressable>
          <AText variant="label" weight="bold" uppercase style={{ color: activeMode.color, letterSpacing: 2 }}>{activeMode.label}</AText>
          <Pressable style={styles.pauseBtn} onPress={togglePause}>
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
    </View>
  );
}

function ReadyView({
  mode,
  secondsLeft,
  pendingTaskTitle,
  onStart,
  onCancel,
}: {
  mode: ModeConfig;
  secondsLeft: number;
  pendingTaskTitle: string | null;
  onStart: () => void;
  onCancel: () => void;
}) {
  const total = mode.minutes * 60;
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <View style={styles.screenShell}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient colors={mode.gradient} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} />

        <View style={styles.timerHeader}>
          <Pressable onPress={onCancel} style={styles.endBtn}>
            <Ionicons name="close" size={18} color={colors.text.muted} />
            <AText variant="label" color="muted">Cancel</AText>
          </Pressable>
          <AText variant="label" weight="bold" uppercase style={{ color: mode.color, letterSpacing: 2 }}>{mode.label}</AText>
          <View style={styles.pauseBtn} />
        </View>

        {pendingTaskTitle && (
          <View style={styles.linkedTask}>
            <Ionicons name="link-outline" size={12} color={colors.text.muted} />
            <AText variant="caption" color="muted" numberOfLines={1} style={{ flex: 1 }}>{pendingTaskTitle}</AText>
          </View>
        )}

        <View style={styles.timerCenter}>
          <CircularProgress size={280} progress={total > 0 ? 0 : 0} strokeWidth={8} color={mode.color} trackColor={colors.bg.high}>
            <View style={styles.timerInner}>
              <AText variant="label" color="muted" uppercase style={{ letterSpacing: 3, marginBottom: 4 }}>Ready</AText>
              <AText style={[styles.timeDisplay, { color: mode.color }]}>{timeStr}</AText>
              <Pressable style={[styles.startBtn, { borderColor: mode.color + '50', backgroundColor: mode.color + '15' }]} onPress={onStart}>
                <Ionicons name="play" size={20} color={mode.color} />
                <AText variant="body" weight="semiBold" style={{ color: mode.color }}>Start</AText>
              </Pressable>
            </View>
          </CircularProgress>
        </View>

        <View style={styles.timerFooter}>
          <View style={styles.timerStat}><AText variant="label" color="muted" uppercase style={{ letterSpacing: 1.5, fontSize: 9 }}>XP Reward</AText><AText variant="subheading" weight="bold" style={{ color: mode.color }}>+{mode.xp}</AText></View>
          <View style={[styles.timerStat, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border.subtle }]}><AText variant="label" color="muted" uppercase style={{ letterSpacing: 1.5, fontSize: 9 }}>Mode</AText><AText variant="body" weight="semiBold">{mode.label}</AText></View>
          <View style={styles.timerStat}><AText variant="label" color="muted" uppercase style={{ letterSpacing: 1.5, fontSize: 9 }}>Duration</AText><AText variant="subheading" weight="bold">{mode.minutes}m</AText></View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function ModeSelectView({ onSelect, onCustom }: { onSelect: (m: ModeConfig) => void; onCustom: () => void }) {
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
          <Pressable
            key={mode.key}
            style={styles.modeCard}
            onPress={() => mode.key === 'custom' ? onCustom() : onSelect(mode)}
          >
            <LinearGradient colors={mode.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} />
            <View style={[styles.modeIconBox, { borderColor: mode.color + '30', backgroundColor: mode.color + '10' }]}>
              <Ionicons name={mode.icon} size={26} color={mode.color} />
            </View>
            <View style={styles.modeInfo}>
              <AText variant="subheading" weight="bold">{mode.label}</AText>
              <AText variant="caption" color="muted" style={{ marginTop: 2 }}>{mode.subtitle}</AText>
            </View>
            <View style={styles.modeMeta}>
              {mode.key === 'custom' ? (
                <AText variant="body" weight="bold" style={{ color: mode.color }}>Any</AText>
              ) : (
                <AText variant="body" weight="bold" style={{ color: mode.color }}>{mode.minutes}m</AText>
              )}
              <AText variant="caption" style={{ color: mode.color + 'AA' }}>
                {mode.key === 'custom' ? 'Custom XP' : `+${mode.xp} XP`}
              </AText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.text.faint} />
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const CUSTOM_PRESETS = [15, 25, 45, 60, 90];

function CustomInputView({ customMinutes, setCustomMinutes, onStart, onBack }: {
  customMinutes: number;
  setCustomMinutes: (m: number) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const xp = Math.max(Math.round(customMinutes * 3), 50);

  function adjust(delta: number) {
    setCustomMinutes(Math.min(180, Math.max(1, customMinutes + delta)));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['rgba(251,191,36,0.10)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} />

      <View style={styles.timerHeader}>
        <Pressable onPress={onBack} style={styles.endBtn}>
          <Ionicons name="arrow-back" size={18} color={colors.text.muted} />
          <AText variant="label" color="muted">Back</AText>
        </Pressable>
        <AText variant="label" weight="bold" uppercase style={{ color: '#fbbf24', letterSpacing: 2 }}>Custom Session</AText>
        <View style={{ width: 70 }} />
      </View>

      <View style={styles.customCenter}>
        <AText variant="label" color="muted" style={{ letterSpacing: 2, marginBottom: spacing[6] }}>SESSION DURATION</AText>

        <View style={styles.customPicker}>
          <Pressable style={[styles.adjustBtn, { borderColor: '#fbbf2440', backgroundColor: '#fbbf2410' }]} onPress={() => adjust(-5)}>
            <AText style={{ color: '#fbbf24', fontSize: 26, fontFamily: fontFamily.bold, lineHeight: 30 }}>−</AText>
          </Pressable>
          <View style={styles.customDisplay}>
            <AText style={styles.customMinutes}>{customMinutes}</AText>
            <AText variant="body" color="muted" uppercase style={{ letterSpacing: 3 }}>min</AText>
          </View>
          <Pressable style={[styles.adjustBtn, { borderColor: '#fbbf2440', backgroundColor: '#fbbf2410' }]} onPress={() => adjust(5)}>
            <AText style={{ color: '#fbbf24', fontSize: 26, fontFamily: fontFamily.bold, lineHeight: 30 }}>+</AText>
          </Pressable>
        </View>

        <View style={styles.presetRow}>
          {CUSTOM_PRESETS.map((p) => (
            <Pressable
              key={p}
              style={[styles.presetBtn, customMinutes === p && { borderColor: '#fbbf2460', backgroundColor: '#fbbf2415' }]}
              onPress={() => setCustomMinutes(p)}
            >
              <AText style={{ color: customMinutes === p ? '#fbbf24' : colors.text.faint, fontSize: 12, fontFamily: fontFamily.medium }}>{p}m</AText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.timerFooter}>
        <View style={styles.timerStat}><AText variant="label" color="muted" uppercase style={{ letterSpacing: 1.5, fontSize: 9 }}>XP Reward</AText><AText variant="subheading" weight="bold" style={{ color: '#fbbf24' }}>+{xp}</AText></View>
        <View style={[styles.timerStat, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border.subtle }]}><AText variant="label" color="muted" uppercase style={{ letterSpacing: 1.5, fontSize: 9 }}>Mode</AText><AText variant="body" weight="semiBold">Custom</AText></View>
        <View style={styles.timerStat}><AText variant="label" color="muted" uppercase style={{ letterSpacing: 1.5, fontSize: 9 }}>Duration</AText><AText variant="subheading" weight="bold">{customMinutes}m</AText></View>
      </View>

      <View style={styles.customStartWrapper}>
        <Pressable style={styles.customStartBtn} onPress={onStart}>
          <AText style={styles.customStartText}>Start Session</AText>
          <Ionicons name="flash" size={16} color="#fbbf24" />
        </Pressable>
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
  screenShell: { flex: 1, backgroundColor: colors.bg.primary },
  container: { flex: 1, backgroundColor: colors.bg.primary },
  selectHeader: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[6] },
  modeList: { paddingHorizontal: spacing[5], gap: spacing[3] },
  modeCard: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle, padding: spacing[4], overflow: 'hidden' },
  modeIconBox: { width: 52, height: 52, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modeInfo: { flex: 1 },
  modeMeta: { alignItems: 'flex-end', gap: 2 },
  timerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
  endBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default },
  pauseBtn: { width: 36, height: 36, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center' },
  linkedTask: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], alignSelf: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.default, maxWidth: 260, marginBottom: spacing[2] },
  timerCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timerInner: { alignItems: 'center' },
  timeDisplay: { fontSize: 56, fontFamily: fontFamily.bold, letterSpacing: 2, lineHeight: 64 },
  startBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[4], paddingHorizontal: spacing[5], paddingVertical: spacing[3], borderRadius: radius.full, borderWidth: 1 },
  timerFooter: { flexDirection: 'row', marginHorizontal: spacing[5], marginBottom: spacing[8], backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle, overflow: 'hidden' },
  timerStat: { flex: 1, alignItems: 'center', paddingVertical: spacing[4], gap: 4 },
  completeOrb: { width: 120, height: 120, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.elevated, marginBottom: spacing[6] },
  completeText: { alignItems: 'center', marginBottom: spacing[6] },
  xpBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[6], paddingVertical: spacing[3], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default, backgroundColor: colors.bg.elevated, marginBottom: spacing[8] },
  xpBannerText: { fontFamily: fontFamily.bold, fontSize: 22 },
  restartBtn: { paddingHorizontal: spacing[8], paddingVertical: spacing[4], borderRadius: radius.full, borderWidth: 1 },

  // Custom input view
  customCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  customPicker: { flexDirection: 'row', alignItems: 'center', gap: spacing[6], marginBottom: spacing[6] },
  adjustBtn: { width: 52, height: 52, borderRadius: radius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  customDisplay: { alignItems: 'center', minWidth: 120 },
  customMinutes: { fontFamily: fontFamily.bold, fontSize: 72, color: '#fbbf24', lineHeight: 80, letterSpacing: -2 },
  presetRow: { flexDirection: 'row', gap: spacing[2] },
  presetBtn: { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default },
  customStartWrapper: { paddingHorizontal: spacing[5], paddingBottom: spacing[8] },
  customStartBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[2], backgroundColor: '#fbbf2420', borderWidth: 1, borderColor: '#fbbf2450', borderRadius: radius.full, paddingVertical: spacing[4] },
  customStartText: { fontFamily: fontFamily.semiBold, fontSize: 16, color: '#fbbf24', letterSpacing: 0.5 },
});
