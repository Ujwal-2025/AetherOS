import React, { useState, useRef } from 'react';
import { View, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { useUserStore } from '../store/useUserStore';

interface Slide {
  icon:       keyof typeof Ionicons.glyphMap;
  iconColor:  string;
  gradient:   [string, string];
  title:      string;
  subtitle:   string;
}

const SLIDES: Slide[] = [
  {
    icon:      'skull-outline',
    iconColor: colors.primary.default,
    gradient:  ['rgba(183,109,255,0.18)', 'transparent'],
    title:     'Welcome to AetherOS',
    subtitle:  'A futuristic operating system for your most disciplined self. Turn every task into a mission. Every session into power.',
  },
  {
    icon:      'flash-outline',
    iconColor: colors.secondary.default,
    gradient:  ['rgba(173,198,255,0.18)', 'transparent'],
    title:     'Daily Quests',
    subtitle:  'Every task earns XP. Complete more, earn bigger multipliers. Build a streak that becomes impossible to break.',
  },
  {
    icon:      'timer-outline',
    iconColor: colors.success.default,
    gradient:  ['rgba(16,185,129,0.18)', 'transparent'],
    title:     'Focus Sessions',
    subtitle:  'Deep Work. Flow State. Sprint. Choose your mode, lock in, and earn massive XP for uninterrupted focus.',
  },
  {
    icon:      'ribbon-outline',
    iconColor: '#fbbf24',
    gradient:  ['rgba(251,191,36,0.18)', 'transparent'],
    title:     'Rise Through the Ranks',
    subtitle:  'From E-Rank to the legendary SSS tier. Every quest, every session, every streak pushes you higher.',
  },
];

// Final name-entry step — not a slide, rendered separately
const NAME_STEP_GRADIENT: [string, string] = ['rgba(183,109,255,0.18)', 'transparent'];

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [index, setIndex]   = useState(0);
  const [onNameStep, setOnNameStep] = useState(false);
  const [name, setName]     = useState('');
  const inputRef            = useRef<TextInput>(null);
  const setDisplayName      = useUserStore((s) => s.setDisplayName);

  const slide  = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  function goNext() {
    if (isLast) { setOnNameStep(true); return; }
    setIndex((i) => i + 1);
  }

  function goBack() {
    if (onNameStep) { setOnNameStep(false); return; }
    if (index > 0) setIndex((i) => i - 1);
  }

  function handleBegin() {
    setDisplayName(name.trim() || 'Hunter');
    onComplete();
  }

  // ── Name entry step ──────────────────────────────────────────────────────────
  if (onNameStep) {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <LinearGradient colors={NAME_STEP_GRADIENT} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} pointerEvents="none" />

          <View style={styles.orbSection}>
            <View style={[styles.orbOuter, { borderColor: colors.primary.default + '20' }]}>
              <View style={[styles.orbInner, { borderColor: colors.primary.default + '40' }]}>
                <View style={[styles.orbCore, { backgroundColor: colors.primary.default + '15', borderColor: colors.primary.default + '30' }]}>
                  <Ionicons name="person-outline" size={52} color={colors.primary.default} />
                </View>
              </View>
            </View>
          </View>

          <View style={styles.textSection}>
            <AText variant="title" weight="bold" style={[styles.title, { color: colors.white }]}>
              What's your hunter name?
            </AText>
            <AText variant="body" color="muted" style={styles.subtitle}>
              This is how AetherOS will address you. You can change it later.
            </AText>

            <TextInput
              ref={inputRef}
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter your name…"
              placeholderTextColor={colors.text.faint}
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleBegin}
              maxLength={24}
            />
          </View>

          <View style={styles.btnRow}>
            <Pressable style={styles.backBtn} onPress={goBack}>
              <Ionicons name="arrow-back" size={18} color={colors.text.muted} />
            </Pressable>
            <Pressable
              style={[styles.nextBtn, { backgroundColor: colors.primary.default + '18', borderColor: colors.primary.default + '50' }]}
              onPress={handleBegin}
            >
              <AText style={[styles.nextTxt, { color: colors.primary.default }]}>
                {name.trim() ? `Begin as ${name.trim()}` : 'Begin as Hunter'}
              </AText>
              <Ionicons name="flash" size={16} color={colors.primary.default} />
            </Pressable>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    );
  }

  // ── Normal slides ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient colors={slide.gradient} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.6 }} pointerEvents="none" />

      {/* Skip */}
      {!isLast && (
        <Pressable style={styles.skipBtn} onPress={() => setOnNameStep(true)}>
          <AText variant="caption" color="muted">Skip</AText>
        </Pressable>
      )}

      {/* Icon orb */}
      <View style={styles.orbSection}>
        <View style={[styles.orbOuter, { borderColor: slide.iconColor + '20' }]}>
          <View style={[styles.orbInner, { borderColor: slide.iconColor + '40' }]}>
            <View style={[styles.orbCore, { backgroundColor: slide.iconColor + '15', borderColor: slide.iconColor + '30' }]}>
              <Ionicons name={slide.icon} size={52} color={slide.iconColor} />
            </View>
          </View>
        </View>
      </View>

      {/* Text */}
      <View style={styles.textSection}>
        <AText variant="title" weight="bold" style={[styles.title, { color: colors.white }]}>
          {slide.title}
        </AText>
        <AText variant="body" color="muted" style={styles.subtitle}>
          {slide.subtitle}
        </AText>
      </View>

      {/* Dots — 5 total (4 slides + name step) */}
      <View style={styles.dots}>
        {[...SLIDES, null].map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index
                ? { backgroundColor: slide.iconColor, width: 20 }
                : { backgroundColor: colors.border.strong },
            ]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={styles.btnRow}>
        {index > 0 ? (
          <Pressable style={styles.backBtn} onPress={goBack}>
            <Ionicons name="arrow-back" size={18} color={colors.text.muted} />
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}

        <Pressable
          style={[styles.nextBtn, { backgroundColor: slide.iconColor + '18', borderColor: slide.iconColor + '50' }]}
          onPress={goNext}
        >
          <AText style={[styles.nextTxt, { color: slide.iconColor }]}>
            {isLast ? 'Set my name' : 'Continue'}
          </AText>
          <Ionicons name="arrow-forward" size={16} color={slide.iconColor} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[6], paddingBottom: spacing[6] },
  skipBtn:   { alignSelf: 'flex-end', paddingVertical: spacing[3], paddingHorizontal: spacing[4] },

  orbSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbOuter:   { width: 260, height: 260, borderRadius: 130, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orbInner:   { width: 210, height: 210, borderRadius: 105, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orbCore:    { width: 160, height: 160, borderRadius: 80, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  textSection: { alignItems: 'center', gap: spacing[4], paddingBottom: spacing[6], width: '100%' },
  title:       { textAlign: 'center', lineHeight: 40 },
  subtitle:    { textAlign: 'center', maxWidth: 320, lineHeight: 22 },

  nameInput: {
    width: '100%',
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.primary.default + '40',
    borderRadius: radius.md,
    padding: spacing[4],
    color: colors.text.primary,
    fontFamily: fontFamily.regular,
    fontSize: 18,
    textAlign: 'center',
    marginTop: spacing[2],
  },

  dots: { flexDirection: 'row', gap: spacing[2], marginBottom: spacing[6] },
  dot:  { height: 4, borderRadius: 2, width: 8, backgroundColor: colors.border.strong },

  btnRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing[4], width: '100%' },
  backBtn: {
    width: 48, height: 48, borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border.default,
    alignItems: 'center', justifyContent: 'center',
  },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing[2], paddingVertical: spacing[4],
    borderRadius: radius.full, borderWidth: 1,
  },
  nextTxt: { fontFamily: fontFamily.semiBold, fontSize: 16, letterSpacing: 0.5 },
});
