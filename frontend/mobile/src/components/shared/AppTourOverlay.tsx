import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Pressable, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withRepeat, withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';

const { height: H } = Dimensions.get('window');

interface TourStep {
  icon:    keyof typeof Ionicons.glyphMap;
  color:   string;
  title:   string;
  desc:    string;
  tabHint: { icon: keyof typeof Ionicons.glyphMap; label: string; index: number };
}

const TAB_ITEMS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'home-outline',   label: 'Home'    },
  { icon: 'list-outline',   label: 'Quests'  },
  { icon: 'timer-outline',  label: 'Focus'   },
  { icon: 'ribbon-outline', label: 'Rewards' },
  { icon: 'person-outline', label: 'Profile' },
];

const STEPS: TourStep[] = [
  {
    icon:    'stats-chart-outline',
    color:   colors.primary.default,
    title:   'Your Command Center',
    desc:    'The Dashboard shows your XP bar, streak, today\'s active quests, and the Weekly Boss. Your mission starts here.',
    tabHint: { icon: 'home-outline', label: 'Dashboard', index: 0 },
  },
  {
    icon:    'list-outline',
    color:   '#adc6ff',
    title:   'Daily Quests',
    desc:    'Create tasks, set priority levels, and earn XP for each one you complete. Chain completions to build a combo multiplier.',
    tabHint: { icon: 'list-outline', label: 'Quests tab', index: 1 },
  },
  {
    icon:    'timer-outline',
    color:   colors.success.default,
    title:   'Focus Sessions',
    desc:    'The glowing centre button. Choose Deep Work (90m), Flow State (60m), or Sprint (25m). Earn bonus XP for every minute you lock in.',
    tabHint: { icon: 'timer-outline', label: 'Focus button', index: 2 },
  },
  {
    icon:    'ribbon-outline',
    color:   '#fbbf24',
    title:   'Ranks & Achievements',
    desc:    'From E-Rank to legendary SSS. Every quest and focus session pushes your rank up. Unlock achievements and collect titles.',
    tabHint: { icon: 'ribbon-outline', label: 'Rewards tab', index: 3 },
  },
  {
    icon:    'planet-outline',
    color:   colors.primary.default,
    title:   'AI Goal Planner',
    desc:    'Tap the ✦ button on your Dashboard. Tell the AI your goal — it builds you daily habits, weekly milestones, and this week\'s action quests.',
    tabHint: { icon: 'home-outline', label: '✦ on Dashboard', index: 0 },
  },
];

interface AppTourOverlayProps {
  onDone: () => void;
}

export function AppTourOverlay({ onDone }: AppTourOverlayProps) {
  const [step, setStep] = useState(0);
  const isFirstRender   = useRef(true);
  const isLast          = step === STEPS.length - 1;
  const current         = STEPS[step];

  // Card animation
  const cardY       = useSharedValue(H * 0.5);
  const cardOpacity = useSharedValue(0);

  // Icon pulse
  const pulse = useSharedValue(1);

  // Overlay fade-in (once)
  const overlayOpacity = useSharedValue(0);
  const overlayStyle   = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));

  useEffect(() => {
    overlayOpacity.value = withTiming(0.8, { duration: 350 });
  }, []);

  // Card animate in on step change
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      cardY.value     = withTiming(0, { duration: 550 });
      cardOpacity.value = withTiming(1, { duration: 450 });
    } else {
      cardOpacity.value = 0;
      cardY.value       = 40;
      cardY.value       = withTiming(0, { duration: 380 });
      cardOpacity.value = withTiming(1, { duration: 320 });
    }

    // Pulse icon
    pulse.value = 1;
    pulse.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 700 }), withTiming(1.0, { duration: 700 })),
      -1, true,
    );
  }, [step]);

  const cardStyle   = useAnimatedStyle(() => ({
    opacity:   cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));
  const iconStyle   = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  function handleNext() {
    if (isLast) { onDone(); return; }
    cardOpacity.value = withTiming(0, { duration: 180 }, () => {});
    setStep((s) => s + 1);
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dark overlay */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]} />

      {/* Tour card */}
      <Animated.View style={[styles.cardWrapper, cardStyle]}>
        <View style={styles.card}>
          <LinearGradient
            colors={[current.color + '14', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            pointerEvents="none"
          />

          {/* Progress dots */}
          <View style={styles.dots}>
            {STEPS.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === step ? current.color : colors.border.strong,
                    width: i === step ? 22 : 7,
                  },
                ]}
              />
            ))}
          </View>

          {/* Icon orb */}
          <Animated.View style={[styles.orbOuter, { borderColor: current.color + '25' }, iconStyle]}>
            <View style={[styles.orbInner, { borderColor: current.color + '45' }]}>
              <View style={[styles.orbCore, { backgroundColor: current.color + '18', borderColor: current.color + '35' }]}>
                <Ionicons name={current.icon} size={32} color={current.color} />
              </View>
            </View>
          </Animated.View>

          {/* Step counter */}
          <AText variant="caption" color="muted" style={styles.stepCounter}>
            {step + 1} of {STEPS.length}
          </AText>

          {/* Text */}
          <AText variant="subheading" weight="bold" style={[styles.cardTitle, { color: colors.text.primary }]}>
            {current.title}
          </AText>
          <AText variant="body" color="muted" style={styles.cardDesc}>
            {current.desc}
          </AText>

          {/* Mini tab bar indicator */}
          <View style={styles.tabRow}>
            {TAB_ITEMS.map((tab, i) => {
              const isActive = i === current.tabHint.index;
              const isCenter = i === 2;
              return (
                <View
                  key={i}
                  style={[
                    styles.tabItem,
                    isCenter && [styles.tabItemCenter, isActive && { borderColor: current.color + '60', backgroundColor: current.color + '18' }],
                    isActive && !isCenter && { backgroundColor: current.color + '14', borderRadius: radius.md },
                  ]}
                >
                  <Ionicons
                    name={isActive ? tab.icon.replace('-outline', '') as any : tab.icon}
                    size={isCenter ? 20 : 18}
                    color={isActive ? current.color : colors.text.faint}
                  />
                  {isActive && (
                    <AText style={[styles.tabLabel, { color: current.color }]}>{tab.label}</AText>
                  )}
                </View>
              );
            })}
          </View>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <Pressable style={styles.skipBtn} onPress={onDone}>
              <AText variant="caption" color="muted">Skip</AText>
            </Pressable>
            <Pressable
              style={[styles.nextBtn, { backgroundColor: current.color + '20', borderColor: current.color + '55' }]}
              onPress={handleNext}
            >
              <AText style={[styles.nextTxt, { color: current.color }]}>
                {isLast ? "Let's go!" : 'Next'}
              </AText>
              <Ionicons
                name={isLast ? 'flash' : 'arrow-forward'}
                size={16}
                color={current.color}
              />
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay:     { backgroundColor: '#000' },
  cardWrapper: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  card: {
    backgroundColor: colors.bg.surface,
    borderTopLeftRadius:  radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    borderTopWidth:  1,
    borderLeftWidth: 1,
    borderRightWidth:1,
    borderColor:     colors.border.subtle,
    paddingHorizontal: spacing[6],
    paddingTop:        spacing[5],
    paddingBottom:     spacing[8],
    gap:               spacing[4],
    overflow:          'hidden',
  },

  dots: { flexDirection: 'row', gap: spacing[2], alignSelf: 'center' },
  dot:  { height: 4, borderRadius: 2 },

  orbOuter: { alignSelf: 'center', width: 100, height: 100, borderRadius: 50, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orbInner: { width: 80,  height: 80,  borderRadius: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orbCore:  { width: 60,  height: 60,  borderRadius: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  stepCounter: { textAlign: 'center', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' },
  cardTitle:   { textAlign: 'center', fontSize: 20 },
  cardDesc:    { textAlign: 'center', lineHeight: 22, fontSize: 14 },

  tabRow: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-around',
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
    marginTop:       spacing[2],
  },
  tabItem:       { alignItems: 'center', justifyContent: 'center', paddingVertical: 4, paddingHorizontal: spacing[2], gap: 3 },
  tabItemCenter: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.border.default },
  tabLabel:      { fontFamily: fontFamily.bold, fontSize: 8, letterSpacing: 0.5, textTransform: 'uppercase' },

  btnRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: spacing[2] },
  skipBtn: { paddingVertical: spacing[3], paddingHorizontal: spacing[4] },
  nextBtn: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing[2],
    paddingVertical: spacing[4],
    borderRadius:   radius.full,
    borderWidth:    1,
  },
  nextTxt: { fontFamily: fontFamily.semiBold, fontSize: 16, letterSpacing: 0.3 },
});
