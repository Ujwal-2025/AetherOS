import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, TextInput, Pressable, ScrollView,
  Dimensions, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withRepeat, withSequence,
  runOnJS, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { TypewriterText } from '../components/ui/TypewriterText';
import { useRoadmapStore } from '../store/useRoadmapStore';
import { useUserStore } from '../store/useUserStore';
import { RoadmapPhase } from '../types';

const { width: SW, height: SH } = Dimensions.get('window');
const BAR_HEIGHT = 56;

// ─── Groq API ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are AetherOS, a goal strategist. Given a goal, deadline, and weekly hours, return ONLY valid JSON with this exact shape:
{"goalId":"slug","goalTitle":"Short Title","phases":[{"id":"phase-1","title":"Phase 1: Foundation","description":"What this phase accomplishes.","weekStart":1,"weekEnd":3,"tasks":[{"id":"t1","title":"Task title","category":"learning","estimatedMinutes":30}]}]}
Rules: 3-5 phases, 3-5 tasks per phase, categories from: health/work/learning/personal, no extra fields.`;

async function fetchRoadmap(
  goal: string,
  targetDate: string,
  weeklyHours: string,
): Promise<{ goalId: string; goalTitle: string; phases: RoadmapPhase[] }> {
  const apiKey = (process.env as Record<string, string>).EXPO_PUBLIC_GROQ_API_KEY ?? '';
  if (!apiKey) {
    throw new Error('Add EXPO_PUBLIC_GROQ_API_KEY to .env (get it free at console.groq.com)');
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model:           'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: `Goal: "${goal}". Deadline: ${targetDate || 'flexible'}. Hours/week: ${weeklyHours}. Return JSON only.` },
      ],
      temperature:     0.6,
      max_tokens:      2000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Groq ${res.status}: ${body.slice(0, 120)}`);
  }

  const data   = await res.json();
  const text   = data?.choices?.[0]?.message?.content ?? '';
  const parsed = JSON.parse(text);
  if (!parsed.goalId || !Array.isArray(parsed.phases)) {
    throw new Error('AI returned an incomplete roadmap. Try again.');
  }
  return parsed;
}

// ─── Sphere Loader ────────────────────────────────────────────────────────────

function SphereLoader() {
  const s1 = useSharedValue(1); const o1 = useSharedValue(1);
  const s2 = useSharedValue(1); const o2 = useSharedValue(1);
  const s3 = useSharedValue(1); const o3 = useSharedValue(1);

  const startRing = (sv: typeof s1, ov: typeof o1, delay: number) => {
    setTimeout(() => {
      sv.value = withRepeat(withSequence(withTiming(1.8, { duration: 1000 }), withTiming(1, { duration: 0 })), -1);
      ov.value = withRepeat(withSequence(withTiming(0,   { duration: 1000 }), withTiming(1, { duration: 0 })), -1);
    }, delay);
  };

  useEffect(() => {
    startRing(s1, o1, 0);
    startRing(s2, o2, 330);
    startRing(s3, o3, 660);
  }, []);

  const r1Style = useAnimatedStyle(() => ({ transform: [{ scale: s1.value }], opacity: o1.value }));
  const r2Style = useAnimatedStyle(() => ({ transform: [{ scale: s2.value }], opacity: o2.value }));
  const r3Style = useAnimatedStyle(() => ({ transform: [{ scale: s3.value }], opacity: o3.value }));

  return (
    <View style={sphere.container}>
      <Animated.View style={[sphere.ring, sphere.ring3, r3Style]} />
      <Animated.View style={[sphere.ring, sphere.ring2, r2Style]} />
      <Animated.View style={[sphere.ring, sphere.ring1, r1Style]} />
      <View style={sphere.core} />
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

type Step = 'choice' | 'goal' | 'date' | 'hours' | 'loading' | 'done';

export function PlannerScreen() {
  const insets       = useSafeAreaInsets();
  const navigation   = useNavigation<any>();
  const { setRoadmap, setWizardAnswers, clearRoadmap, hasPlan, wizardAnswers, goalTitle } = useRoadmapStore();
  const displayName  = useUserStore((s) => s.profile.displayName);

  const [step,        setStep]        = useState<Step>(hasPlan ? 'done' : 'choice');
  const [goal,        setGoal]        = useState('');
  const [targetDate,  setTargetDate]  = useState('');
  const [weeklyHours, setWeeklyHours] = useState('');
  const [error,       setError]       = useState('');
  const [sphereReady, setSphereReady] = useState(false);

  const goalRef = useRef<TextInput>(null);
  const dateRef = useRef<TextInput>(null);

  // ── Choice → Wizard transition ──
  const choiceOpacity  = useSharedValue(1);
  const barTranslateY  = useSharedValue(SH * 0.3);
  const barOpacity     = useSharedValue(0);
  const q1Opacity      = useSharedValue(0);
  const q1TranslateY   = useSharedValue(20);
  const q2Opacity      = useSharedValue(0);
  const q2TranslateY   = useSharedValue(20);
  const lineWidth1     = useSharedValue(0);
  const lineWidth2     = useSharedValue(0);
  const q3Opacity      = useSharedValue(0);
  const q3TranslateY   = useSharedValue(20);

  // ── Submit button pulses ──
  const submitScale1  = useSharedValue(1);
  const submitScale2  = useSharedValue(1);
  const submitRotate3 = useSharedValue(0);

  // ── Ink splash + white burst ──
  const inkScale          = useSharedValue(0);
  const whiteOpacity      = useSharedValue(0);

  // ── Creator card pulse ──
  const creatorBorderOp = useSharedValue(0.35);

  useEffect(() => {
    creatorBorderOp.value = withRepeat(
      withSequence(
        withTiming(0.80, { duration: 600 }),
        withTiming(0.35, { duration: 600 }),
      ),
      -1,
      true,
    );
  }, []);

  function activateWizard() {
    choiceOpacity.value = withTiming(0, { duration: 200 });
    barOpacity.value    = withTiming(1, { duration: 250 });
    barTranslateY.value = withSpring(0, { damping: 18, stiffness: 120 }, () => {
      runOnJS(setStep)('goal');
      q1Opacity.value    = withTiming(1, { duration: 300 });
      q1TranslateY.value = withSpring(0);

      submitScale1.value = withRepeat(
        withSequence(withTiming(1.07, { duration: 900 }), withTiming(1, { duration: 900 })),
        -1, true,
      );
    });
  }

  function submitGoal() {
    if (!goal.trim()) return;
    setStep('date');
    lineWidth1.value  = withTiming(SW * 0.7, { duration: 300 });
    q2Opacity.value    = withTiming(1, { duration: 400 });
    q2TranslateY.value = withSpring(0);
    submitScale2.value = withRepeat(
      withSequence(withTiming(1.07, { duration: 650 }), withTiming(1, { duration: 650 })),
      -1, true,
    );
    setTimeout(() => dateRef.current?.focus(), 400);
  }

  function submitDate() {
    setStep('hours');
    lineWidth2.value  = withTiming(SW * 0.7, { duration: 300 });
    q3Opacity.value    = withTiming(1, { duration: 400 });
    q3TranslateY.value = withSpring(0);
    submitRotate3.value = withRepeat(
      withTiming(360, { duration: 1800, easing: Easing.linear }),
      -1,
    );
  }

  function selectHours(h: string) {
    setWeeklyHours(h);
  }

  function submitHours() {
    if (!weeklyHours) return;
    setWizardAnswers({ goal: goal.trim(), targetDate: targetDate.trim(), weeklyHours });
    setStep('loading');
    inkScale.value = withTiming(24, { duration: 600 }, () => {
      runOnJS(setSphereReady)(true);
    });
    callGroq();
  }

  function goToRoadmap() {
    navigation.navigate('Roadmap');
  }

  async function callGroq() {
    setError('');
    try {
      const result = await fetchRoadmap(goal.trim(), targetDate.trim(), weeklyHours);
      setRoadmap(result.goalId, result.goalTitle, result.phases);
      setStep('done');
      whiteOpacity.value = withTiming(1, { duration: 400 }, () => {
        runOnJS(goToRoadmap)();
      });
    } catch (e: any) {
      setSphereReady(false);
      inkScale.value = withTiming(0, { duration: 300 });
      setError(e?.message ?? 'Something went wrong. Try again.');
      setStep('hours');
    }
  }

  function handleNewPlan() {
    clearRoadmap();
    setGoal(''); setTargetDate(''); setWeeklyHours(''); setError('');
    setStep('choice');
    choiceOpacity.value  = withTiming(1, { duration: 300 });
    barOpacity.value     = withTiming(0, { duration: 200 });
    barTranslateY.value  = SH * 0.3;
    q1Opacity.value      = 0; q2Opacity.value = 0; q3Opacity.value = 0;
    lineWidth1.value     = 0; lineWidth2.value = 0;
    creatorBorderOp.value = withRepeat(
      withSequence(withTiming(0.80, { duration: 600 }), withTiming(0.35, { duration: 600 })),
      -1, true,
    );
  }

  // ── Animated styles ──
  const choiceStyle       = useAnimatedStyle(() => ({ opacity: choiceOpacity.value }));
  const barStyle          = useAnimatedStyle(() => ({
    opacity:   barOpacity.value,
    transform: [{ translateY: barTranslateY.value }],
  }));
  const q1Style           = useAnimatedStyle(() => ({ opacity: q1Opacity.value, transform: [{ translateY: q1TranslateY.value }] }));
  const q2Style           = useAnimatedStyle(() => ({ opacity: q2Opacity.value, transform: [{ translateY: q2TranslateY.value }] }));
  const lineStyle1        = useAnimatedStyle(() => ({ width: lineWidth1.value }));
  const lineStyle2        = useAnimatedStyle(() => ({ width: lineWidth2.value }));
  const q3Style           = useAnimatedStyle(() => ({ opacity: q3Opacity.value, transform: [{ translateY: q3TranslateY.value }] }));
  const submit1Style      = useAnimatedStyle(() => ({ transform: [{ scale: submitScale1.value }] }));
  const submit2Style      = useAnimatedStyle(() => ({ transform: [{ scale: submitScale2.value }] }));
  const submit3RotStyle   = useAnimatedStyle(() => ({ transform: [{ rotate: `${submitRotate3.value}deg` }] }));
  const creatorBorderStyle= useAnimatedStyle(() => ({ borderColor: `rgba(183,109,255,${creatorBorderOp.value})` }));
  const inkStyle          = useAnimatedStyle(() => ({ transform: [{ scale: inkScale.value }] }));
  const whiteStyle        = useAnimatedStyle(() => ({ opacity: whiteOpacity.value }));

  // ── Done (has plan) view ──
  if (step === 'done' || (hasPlan && step === 'choice')) {
    return (
      <SafeAreaView style={[s.screen, { paddingTop: insets.top }]} edges={['bottom']}>
        <View style={s.doneContainer}>
          <AText variant="caption" color="muted" style={s.doneLabel}>ACTIVE PLAN</AText>
          <AText variant="title" weight="bold" style={s.doneTitle}>{goalTitle}</AText>

          <View style={s.doneCard}>
            <Row icon="flag-outline"    label="Goal"     value={wizardAnswers.goal || goalTitle} />
            <Row icon="calendar-outline" label="By"      value={wizardAnswers.targetDate || '—'} />
            <Row icon="time-outline"    label="Per week" value={wizardAnswers.weeklyHours || '—'} />
          </View>

          <Pressable style={s.newPlanBtn} onPress={handleNewPlan}>
            <AText style={s.newPlanTxt} color="muted">Start New Plan</AText>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Loading view ──
  if (step === 'loading') {
    const INK = Math.max(SW, SH) * 0.6;
    return (
      <View style={[s.screen, { backgroundColor: colors.bg.primary }]}>
        <Animated.View style={[s.inkCircle, { width: INK, height: INK, borderRadius: INK / 2, marginLeft: -INK / 2, marginTop: -INK / 2 }, inkStyle]} />
        {sphereReady && (
          <View style={StyleSheet.absoluteFill}>
            <SphereLoader />
          </View>
        )}
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#fff' }, whiteStyle]} pointerEvents="none" />
      </View>
    );
  }

  // ── Main wizard view ──
  return (
    <View style={[s.screen, { backgroundColor: colors.bg.primary }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ flex: 1 }}>

          {/* Choice cards (fades out when wizard activates) */}
          <Animated.View style={[StyleSheet.absoluteFill, s.choiceWrapper, choiceStyle]}>
            <SafeAreaView style={s.choiceInner} edges={['top', 'bottom']}>
              <AText variant="caption" color="muted" style={s.choiceHeader}>CHOOSE YOUR PATH</AText>
              <View style={s.choiceRow}>
                {/* Plan with Creator */}
                <Animated.View style={[s.choiceCard, creatorBorderStyle]}>
                  <Pressable style={s.choiceCardInner} onPress={activateWizard}>
                    <View style={[s.choiceIcon, { backgroundColor: colors.primary.default + '15' }]}>
                      <Ionicons name="sparkles" size={28} color={colors.primary.default} />
                    </View>
                    <AText weight="semiBold" style={s.choiceTitle}>Plan with Creator</AText>
                    <AText variant="caption" color="muted" style={s.choiceSub}>Let AetherOS build your roadmap</AText>
                  </Pressable>
                </Animated.View>

                {/* Do It Manually */}
                <View style={[s.choiceCard, { borderColor: colors.border.medium }]}>
                  <Pressable style={s.choiceCardInner} onPress={() => navigation.navigate('Arena')}>
                    <View style={[s.choiceIcon, { backgroundColor: colors.bg.elevated }]}>
                      <Ionicons name="hammer-outline" size={28} color={colors.text.muted} />
                    </View>
                    <TypewriterText
                      text="Do It Manually"
                      speed={60}
                      style={s.choiceTitle}
                    />
                    <AText variant="caption" color="muted" style={s.choiceSub}>Jump into Arena and plan as you go</AText>
                  </Pressable>
                </View>
              </View>
            </SafeAreaView>
          </Animated.View>

          {/* Wizard bar + questions */}
          <Animated.View style={[s.wizardBar, { top: insets.top + 16, left: 16, right: 16 }, barStyle]}>
            <TextInput
              ref={goalRef}
              style={s.barInput}
              value={goal}
              onChangeText={setGoal}
              placeholder="type your goal hunter"
              placeholderTextColor={colors.text.faint}
              returnKeyType="done"
              onSubmitEditing={step === 'goal' ? submitGoal : undefined}
              editable={step === 'goal'}
            />
            {step === 'goal' && (
              <Animated.View style={submit1Style}>
                <Pressable style={s.barSubmit} onPress={submitGoal}>
                  <Ionicons name="arrow-forward" size={18} color={colors.bg.primary} />
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>

          {/* Q2 */}
          <Animated.View style={[s.qSection, { top: insets.top + BAR_HEIGHT + 40, left: 16, right: 16 }, q1Style]}>
            <Animated.View style={[s.connLine, lineStyle1]} />
            <Animated.View style={[s.q2Row, q2Style]}>
              <TextInput
                ref={dateRef}
                style={s.qInput}
                value={targetDate}
                onChangeText={setTargetDate}
                placeholder="when do you want to achieve this?"
                placeholderTextColor={colors.text.faint}
                returnKeyType="done"
                onSubmitEditing={step === 'date' ? submitDate : undefined}
                editable={step === 'date'}
              />
              {step === 'date' && (
                <Animated.View style={submit2Style}>
                  <Pressable style={s.barSubmit} onPress={submitDate}>
                    <Ionicons name="arrow-forward" size={18} color={colors.bg.primary} />
                  </Pressable>
                </Animated.View>
              )}
            </Animated.View>

            <Animated.View style={[s.connLine, lineStyle2]} />

            {/* Q3 */}
            <Animated.View style={[s.q3Wrapper, q3Style]}>
              <AText variant="caption" color="muted" style={s.q3Label}>hours per week</AText>
              <View style={s.chipsRow}>
                {['1–3 h', '3–5 h', '5+ h'].map((h) => (
                  <Pressable
                    key={h}
                    style={[s.chip, weeklyHours === h && s.chipSelected]}
                    onPress={() => selectHours(h)}
                  >
                    <AText style={[s.chipTxt, weeklyHours === h && { color: colors.primary.default }]}>{h}</AText>
                  </Pressable>
                ))}
              </View>

              {error ? (
                <AText variant="caption" style={{ color: colors.danger.default, textAlign: 'center', marginTop: spacing[2] }}>
                  {error}
                </AText>
              ) : null}

              <View style={s.submitRow}>
                <View style={s.submit3Wrapper}>
                  <Animated.View style={[s.submit3Ring, submit3RotStyle]} />
                  <Pressable
                    style={[s.submit3Btn, !weeklyHours && { opacity: 0.4 }]}
                    onPress={submitHours}
                    disabled={!weeklyHours}
                  >
                    <Ionicons name="flash" size={22} color={colors.bg.primary} />
                  </Pressable>
                </View>
                <AText variant="caption" color="muted" style={s.submit3Label}>Generate Roadmap</AText>
              </View>
            </Animated.View>
          </Animated.View>

        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Small helper ─────────────────────────────────────────────────────────────

function Row({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={s.doneRow}>
      <Ionicons name={icon} size={16} color={colors.text.muted} style={{ marginRight: 8 }} />
      <AText variant="caption" color="muted" style={{ width: 64 }}>{label}</AText>
      <AText variant="caption" color="secondary" style={{ flex: 1 }} numberOfLines={2}>{value}</AText>
    </View>
  );
}

// ─── Sphere loader styles ─────────────────────────────────────────────────────

const RING1 = 120; const RING2 = 180; const RING3 = 240;

const sphere = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  core:  { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.bg.elevated, position: 'absolute' },
  ring:  { position: 'absolute', borderRadius: 999, borderWidth: 1 },
  ring1: { width: RING1, height: RING1, borderColor: 'rgba(255,255,255,0.5)' },
  ring2: { width: RING2, height: RING2, borderColor: 'rgba(255,255,255,0.3)' },
  ring3: { width: RING3, height: RING3, borderColor: 'rgba(255,255,255,0.15)' },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.primary },

  // Choice view
  choiceWrapper: { flex: 1 },
  choiceInner:   { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4] },
  choiceHeader:  { letterSpacing: 2, marginBottom: spacing[6] },
  choiceRow:     { flexDirection: 'row', gap: spacing[4], width: '100%' },
  choiceCard:    {
    flex: 1, borderWidth: 1, borderRadius: radius.lg,
    backgroundColor: colors.bg.surface, overflow: 'hidden',
  },
  choiceCardInner: { padding: spacing[5], gap: spacing[3] },
  choiceIcon:      { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  choiceTitle:     { fontFamily: fontFamily.semiBold, fontSize: 14, color: colors.text.primary },
  choiceSub:       { lineHeight: 18 },

  // Wizard bar
  wizardBar: {
    position:        'absolute',
    height:          BAR_HEIGHT,
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.bg.elevated,
    borderRadius:    radius.full,
    paddingLeft:     spacing[5],
    paddingRight:    spacing[2],
    borderWidth:     1,
    borderColor:     colors.primary.default + '30',
    gap:             spacing[2],
  },
  barInput: {
    flex: 1,
    color:      colors.text.primary,
    fontFamily: fontFamily.regular,
    fontSize:   15,
  },
  barSubmit: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary.container,
    alignItems: 'center', justifyContent: 'center',
  },

  // Questions section
  qSection:  { position: 'absolute', gap: spacing[4] },
  connLine:  { height: 2, backgroundColor: colors.primary.container + '60' },
  q2Row:     { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  qInput:    {
    flex: 1,
    color:           colors.text.primary,
    fontFamily:      fontFamily.regular,
    fontSize:        15,
    backgroundColor: colors.bg.elevated,
    borderWidth:     1,
    borderColor:     colors.border.medium,
    borderRadius:    radius.full,
    paddingHorizontal: spacing[5],
    paddingVertical:   spacing[3],
  },

  // Q3
  q3Wrapper: { gap: spacing[3] },
  q3Label:   { letterSpacing: 1.5 },
  chipsRow:  { flexDirection: 'row', gap: spacing[3] },
  chip: {
    flex: 1, paddingVertical: spacing[3], borderRadius: radius.full,
    borderWidth: 1, borderColor: colors.border.medium,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
  },
  chipSelected: { borderColor: colors.primary.default },
  chipTxt: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text.muted },

  submitRow:      { alignItems: 'center', gap: spacing[2], marginTop: spacing[2] },
  submit3Wrapper: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center' },
  submit3Ring: {
    position: 'absolute', width: 50, height: 50, borderRadius: 25,
    borderWidth: 2, borderColor: colors.primary.container,
    borderStyle: 'dashed',
  },
  submit3Btn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary.container,
    alignItems: 'center', justifyContent: 'center',
  },
  submit3Label: { letterSpacing: 1 },

  // Ink splash
  inkCircle: { position: 'absolute', left: '50%', top: '50%', backgroundColor: '#000' },

  // Done / has-plan view
  doneContainer: { flex: 1, paddingHorizontal: spacing[6], paddingTop: spacing[8], gap: spacing[4] },
  doneLabel:     { letterSpacing: 2 },
  doneTitle:     { color: colors.white, lineHeight: 40 },
  doneCard:      {
    backgroundColor: colors.bg.surface, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.border.medium,
    padding: spacing[5], gap: spacing[4],
  },
  doneRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  newPlanBtn: {
    marginTop: spacing[4], paddingVertical: spacing[4],
    borderRadius: radius.full, borderWidth: 1,
    borderColor: colors.border.medium, alignItems: 'center',
  },
  newPlanTxt: { fontFamily: fontFamily.medium },
});
