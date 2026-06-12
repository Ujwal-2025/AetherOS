import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, ScrollView, Pressable, TextInput, Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withRepeat, withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { useRoadmapStore } from '../store/useRoadmapStore';
import { useUserStore } from '../store/useUserStore';
import { RoadmapPhase, RoadmapTask } from '../types';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Phase Card ───────────────────────────────────────────────────────────────

interface PhaseCardProps {
  phase:      RoadmapPhase;
  index:      number;
  animate:    boolean;
  delay:      number;
  editMode:   boolean;
  onTaskEdit: (phaseId: string, taskId: string, newTitle: string) => void;
}

function PhaseCard({ phase, index, animate, delay, editMode, onTaskEdit }: PhaseCardProps) {
  const [expanded,  setExpanded]  = useState(index === 0);
  const [expanded2, setExpanded2] = useState(false); // edit panel
  const [taskEdits, setTaskEdits] = useState<Record<string, string>>({});

  const cardOpacity   = useSharedValue(animate ? 0 : 1);
  const cardTranslate = useSharedValue(animate ? 20 : 0);
  const shiverRotate  = useSharedValue(0);

  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(() => {
      cardOpacity.value   = withTiming(1, { duration: 400 });
      cardTranslate.value = withSpring(0);
    }, delay);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (editMode) {
      shiverRotate.value = withRepeat(
        withSequence(
          withTiming(1.5,  { duration: 70 }),
          withTiming(-1.5, { duration: 70 }),
          withTiming(0,    { duration: 70 }),
        ),
        -1,
      );
    } else {
      shiverRotate.value = withTiming(0, { duration: 150 });
    }
  }, [editMode]);

  const cardStyle   = useAnimatedStyle(() => ({
    opacity:   cardOpacity.value,
    transform: [{ translateY: cardTranslate.value }, { rotate: `${shiverRotate.value}deg` }],
  }));

  const PHASE_COLORS = [colors.primary.container, colors.secondary.default, colors.success.default, '#fbbf24', '#f97316'];
  const accent = PHASE_COLORS[index % PHASE_COLORS.length];

  function handleCardPress() {
    if (editMode) {
      setExpanded2((v) => !v);
    } else {
      setExpanded((v) => !v);
    }
  }

  return (
    <Animated.View style={[pc.card, cardStyle]}>
      <Pressable onPress={handleCardPress} style={pc.header}>
        <View style={[pc.badge, { backgroundColor: accent + '20', borderColor: accent + '50' }]}>
          <AText variant="caption" style={{ color: accent, fontFamily: fontFamily.bold }}>
            {index + 1}
          </AText>
        </View>
        <View style={{ flex: 1 }}>
          <AText weight="semiBold" style={{ color: colors.text.primary }}>{phase.title}</AText>
          <AText variant="caption" color="muted">
            Week {phase.weekStart}–{phase.weekEnd} · {phase.tasks.length} tasks
          </AText>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.text.faint}
        />
      </Pressable>

      {/* Collapsed → expanded content */}
      {expanded && !editMode && (
        <View style={pc.body}>
          <AText variant="caption" color="muted" style={pc.desc}>{phase.description}</AText>
          {phase.tasks.map((t) => (
            <View key={t.id} style={pc.taskRow}>
              <View style={[pc.dot, { backgroundColor: accent }]} />
              <AText variant="caption" style={{ flex: 1, color: colors.text.secondary }}>{t.title}</AText>
              <AText variant="caption" color="faint">{t.estimatedMinutes}m</AText>
            </View>
          ))}
        </View>
      )}

      {/* Edit mode expansion: inline task editors */}
      {editMode && expanded2 && (
        <View style={pc.editBody}>
          <View style={pc.unrollLine} />
          {phase.tasks.map((t) => (
            <TextInput
              key={t.id}
              style={pc.editInput}
              value={taskEdits[t.id] ?? t.title}
              onChangeText={(v) => {
                setTaskEdits((prev) => ({ ...prev, [t.id]: v }));
                onTaskEdit(phase.id, t.id, v);
              }}
              placeholder={t.title}
              placeholderTextColor={colors.text.faint}
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
}

// ─── Speed Lines + Welcome overlay ───────────────────────────────────────────

const LINE_WIDTHS = [SW * 0.9, SW * 0.7, SW * 0.8, SW * 0.5, SW * 0.65];

function ContinueEffect({ name, onDone }: { name: string; onDone: () => void }) {
  const l0 = useSharedValue(-SW); const l1 = useSharedValue(-SW);
  const l2 = useSharedValue(-SW); const l3 = useSharedValue(-SW);
  const l4 = useSharedValue(-SW);
  const textOpacity   = useSharedValue(0);
  const textTranslate = useSharedValue(0);

  useEffect(() => {
    const shootLine = (sv: typeof l0, delay: number) => {
      setTimeout(() => { sv.value = withTiming(SW * 2, { duration: 250 }); }, delay);
    };
    shootLine(l0, 0); shootLine(l1, 40); shootLine(l2, 80);
    shootLine(l3, 120); shootLine(l4, 160);

    setTimeout(() => { textOpacity.value = withSpring(1); }, 300);

    setTimeout(() => {
      textOpacity.value   = withTiming(0, { duration: 300 });
      textTranslate.value = withTiming(-200, { duration: 300 }, (done) => {
        if (done) runOnJS(onDone)();
      });
    }, 1200);
  }, []);

  const s0 = useAnimatedStyle(() => ({ transform: [{ translateX: l0.value }] }));
  const s1 = useAnimatedStyle(() => ({ transform: [{ translateX: l1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateX: l2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateX: l3.value }] }));
  const s4 = useAnimatedStyle(() => ({ transform: [{ translateX: l4.value }] }));
  const lineStyles = [s0, s1, s2, s3, s4];

  const textStyle = useAnimatedStyle(() => ({
    opacity:   textOpacity.value,
    transform: [{ translateY: textTranslate.value }],
  }));

  return (
    <View style={[StyleSheet.absoluteFill, ce.container]}>
      {lineStyles.map((ls, i) => (
        <Animated.View
          key={i}
          style={[ce.line, { width: LINE_WIDTHS[i], top: SH * 0.3 + i * 40 }, ls]}
        />
      ))}
      <Animated.View style={[ce.textWrap, textStyle]}>
        <AText style={ce.welcomeText}>Welcome {name}</AText>
      </Animated.View>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function RoadmapScreen() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { hasPlan, phases, goalTitle, clearRoadmap, updatePhase } = useRoadmapStore();
  const displayName = useUserStore((s) => s.profile.displayName);

  const isFirstArrival = useRef(true);
  const [editMode,    setEditMode]    = useState(false);
  const [showEffect,  setShowEffect]  = useState(false);

  // Entry animation shared values
  const sphereY   = useSharedValue(SH / 2 - 80);
  const inkH      = useSharedValue(0);
  const inkOpacity = useSharedValue(0);

  const sphereStyle = useAnimatedStyle(() => ({ top: sphereY.value }));
  const inkStyle    = useAnimatedStyle(() => ({ height: inkH.value, opacity: inkOpacity.value }));

  useEffect(() => {
    if (!hasPlan || !isFirstArrival.current) return;

    sphereY.value = withSpring(insets.top + 24, { damping: 14, stiffness: 90 }, () => {
      inkOpacity.value = withTiming(1, { duration: 200 });
      inkH.value       = withTiming(phases.length * 160, { duration: phases.length * 800 });
    });

    isFirstArrival.current = false;
  }, [hasPlan]);

  function handleContinueDone() {
    setShowEffect(false);
    navigation.navigate('Arena');
  }

  function handleTaskEdit(phaseId: string, taskId: string, newTitle: string) {
    updatePhase(phaseId, {
      tasks: phases
        .find((p) => p.id === phaseId)
        ?.tasks.map((t) => (t.id === taskId ? { ...t, title: newTitle } : t)) ?? [],
    });
  }

  if (!hasPlan) {
    return (
      <SafeAreaView style={[rm.screen, { paddingTop: insets.top }]} edges={['bottom']}>
        <View style={rm.empty}>
          <View style={rm.emptyOrb}>
            <Ionicons name="git-branch-outline" size={40} color={colors.text.faint} />
          </View>
          <AText variant="heading" color="muted" style={{ textAlign: 'center' }}>No Roadmap Yet</AText>
          <AText variant="caption" color="faint" style={{ textAlign: 'center', maxWidth: 260 }}>
            Go to the Planner tab and choose "Plan with Creator" to generate your roadmap.
          </AText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[rm.screen, { backgroundColor: colors.bg.primary }]}>
      {/* Sphere decoration at top */}
      <Animated.View style={[rm.sphere, sphereStyle]} />

      {/* Ink drip line */}
      <Animated.View style={[rm.inkLine, { top: insets.top + 24 + 20 }, inkStyle]} />

      {/* Header */}
      <SafeAreaView edges={['top']} style={rm.header}>
        <View style={rm.headerRow}>
          <View style={{ flex: 1 }}>
            <AText variant="caption" color="muted" style={rm.headerLabel}>ROADMAP</AText>
            <AText weight="bold" style={rm.headerTitle} numberOfLines={1}>{goalTitle}</AText>
          </View>
          <Pressable style={rm.editBtn} onPress={() => setEditMode((v) => !v)}>
            <AText variant="caption" style={{ color: editMode ? colors.primary.default : colors.text.muted }}>
              {editMode ? 'Done' : 'Edit'}
            </AText>
          </Pressable>
        </View>
      </SafeAreaView>

      {/* Phase cards */}
      <ScrollView
        style={rm.scroll}
        contentContainerStyle={rm.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {phases.map((phase, i) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            index={i}
            animate={isFirstArrival.current}
            delay={600 + i * 700}
            editMode={editMode}
            onTaskEdit={handleTaskEdit}
          />
        ))}

        {/* Action buttons */}
        <View style={rm.actions}>
          <Pressable style={rm.continueBtn} onPress={() => setShowEffect(true)}>
            <AText weight="semiBold" style={{ color: colors.bg.primary }}>Continue</AText>
            <Ionicons name="arrow-forward" size={18} color={colors.bg.primary} />
          </Pressable>
          <Pressable
            style={rm.newPlanBtn}
            onPress={() => {
              clearRoadmap();
              navigation.navigate('Planner');
            }}
          >
            <AText variant="caption" color="muted">New Plan</AText>
          </Pressable>
        </View>
      </ScrollView>

      {/* Continue effect overlay */}
      {showEffect && (
        <ContinueEffect name={displayName} onDone={handleContinueDone} />
      )}
    </View>
  );
}

// ─── Phase card styles ────────────────────────────────────────────────────────

const pc = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius:    radius.lg,
    borderWidth:     1,
    borderColor:     colors.border.medium,
    marginBottom:    spacing[3],
    overflow:        'hidden',
  },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    padding:         spacing[4],
    gap:             spacing[3],
  },
  badge: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  body:    { paddingHorizontal: spacing[4], paddingBottom: spacing[4], gap: spacing[2] },
  desc:    { lineHeight: 18, marginBottom: spacing[1] },
  taskRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] },
  dot:     { width: 5, height: 5, borderRadius: 3, marginTop: 5 },

  editBody: { paddingHorizontal: spacing[4], paddingBottom: spacing[4], gap: spacing[2] },
  unrollLine: { height: 1, backgroundColor: colors.primary.container + '40', marginBottom: spacing[2] },
  editInput: {
    color:           colors.text.primary,
    fontFamily:      fontFamily.regular,
    fontSize:        13,
    borderWidth:     1,
    borderColor:     colors.border.medium,
    borderRadius:    radius.sm,
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[2],
    backgroundColor: colors.bg.elevated,
  },
});

// ─── Continue effect styles ───────────────────────────────────────────────────

const ce = StyleSheet.create({
  container: { backgroundColor: colors.bg.primary + 'cc', alignItems: 'center', justifyContent: 'center' },
  line:      { position: 'absolute', height: 2, backgroundColor: colors.primary.default + '80', left: -SW },
  textWrap:  { alignItems: 'center' },
  welcomeText: {
    fontFamily: fontFamily.bold,
    fontSize:   32,
    color:      colors.white,
    textAlign:  'center',
  },
});

// ─── Main screen styles ───────────────────────────────────────────────────────

const rm = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg.primary },

  sphere: {
    position:        'absolute',
    left:            '50%',
    marginLeft:      -10,
    width:           20,
    height:          20,
    borderRadius:    10,
    backgroundColor: colors.bg.elevated,
    borderWidth:     1,
    borderColor:     colors.primary.default + '40',
    zIndex:          10,
  },
  inkLine: {
    position:        'absolute',
    left:            '50%',
    marginLeft:      -1,
    width:           2,
    backgroundColor: colors.text.primary,
    zIndex:          5,
  },

  header:      { zIndex: 20 },
  headerRow:   { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[6], paddingTop: spacing[2], paddingBottom: spacing[3] },
  headerLabel: { letterSpacing: 2 },
  headerTitle: { color: colors.white, fontSize: 18, marginTop: 2 },
  editBtn:     { paddingHorizontal: spacing[4], paddingVertical: spacing[2] },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[8] },

  actions:     { gap: spacing[3], marginTop: spacing[4] },
  continueBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    gap:             spacing[2],
    backgroundColor: colors.primary.container,
    borderRadius:    radius.full,
    paddingVertical: spacing[4],
  },
  newPlanBtn: {
    alignItems:      'center',
    paddingVertical: spacing[3],
    borderRadius:    radius.full,
    borderWidth:     1,
    borderColor:     colors.border.medium,
  },

  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing[8], gap: spacing[4],
  },
  emptyOrb: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1, borderColor: colors.border.medium,
    backgroundColor: colors.bg.surface,
    alignItems: 'center', justifyContent: 'center',
  },
});
