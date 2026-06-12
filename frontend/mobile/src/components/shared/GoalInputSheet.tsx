import React, { useState } from 'react';
import {
  View, Modal, StyleSheet, Pressable, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';
import { useCategoryStore } from '../../store/useCategoryStore';

// ─── Types mirroring the API response ────────────────────────────────────────

export interface GoalTaskRaw {
  title:            string;
  category:         string;
  priority:         'low' | 'medium' | 'high' | 'critical';
  estimatedMinutes: number;
  weekOffset?:      number; // milestones only
}

export interface GoalPlan {
  goalId:      string;
  goalTitle:   string;
  dailyHabit:  GoalTaskRaw;
  milestones:  GoalTaskRaw[];
  thisWeek:    GoalTaskRaw[];
}

// ─── Month picker presets ─────────────────────────────────────────────────────

const MONTH_PRESETS = ['1 month', '3 months', '6 months', '1 year'];

interface GoalInputSheetProps {
  visible:   boolean;
  onClose:   () => void;
  onPlanReady: (plan: GoalPlan, targetDate: string) => void;
}

const GROQ_SYSTEM_PROMPT = `You are AetherOS, a productivity quest planner. Given a goal and target date, return ONLY a JSON object (no markdown, no explanation) with this exact shape:
{"goalId":"slug-here","goalTitle":"Short Title","dailyHabit":{"title":"Action verb task","category":"learning","priority":"high","estimatedMinutes":30},"milestones":[{"title":"Milestone task","category":"learning","priority":"high","estimatedMinutes":60,"weekOffset":4}],"thisWeek":[{"title":"First step task","category":"learning","priority":"medium","estimatedMinutes":20}]}
Rules: dailyHabit=1 recurring practice, milestones=3-5 checkpoints with weekOffset spaced to target date, thisWeek=4-5 immediate actions. category must be one of: health,work,learning,personal. priority: low/medium/high/critical.`;

async function fetchGoalPlan(goal: string, targetDate: string, categories: string[]): Promise<GoalPlan> {
  const apiKey = (process.env as Record<string, string>).EXPO_PUBLIC_GROQ_API_KEY ?? '';

  if (!apiKey) {
    throw new Error('Add your free Groq API key to .env as EXPO_PUBLIC_GROQ_API_KEY (get it at console.groq.com)');
  }

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model:           'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: GROQ_SYSTEM_PROMPT },
        { role: 'user',   content: `Goal: "${goal}". Target: ${targetDate || 'as soon as possible'}. Categories available: ${categories.join(', ')}. Return JSON only.` },
      ],
      temperature:     0.6,
      max_tokens:      1500,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`Groq error ${res.status}: ${errBody.slice(0, 120)}`);
  }

  const data  = await res.json();
  const text  = data?.choices?.[0]?.message?.content ?? '';
  const plan  = JSON.parse(text) as GoalPlan;
  if (!plan.goalId || !plan.dailyHabit || !Array.isArray(plan.milestones) || !Array.isArray(plan.thisWeek)) {
    throw new Error('AI returned an incomplete plan. Try again.');
  }
  return plan;
}

export function GoalInputSheet({ visible, onClose, onPlanReady }: GoalInputSheetProps) {
  const [goal,       setGoal]       = useState('');
  const [target,     setTarget]     = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const { categories } = useCategoryStore();

  async function handleGenerate() {
    if (!goal.trim()) return;
    setLoading(true);
    setError('');
    try {
      const plan = await fetchGoalPlan(goal.trim(), target.trim() || 'as soon as possible', categories.map((c) => c.id));
      onPlanReady(plan, target.trim() || 'ongoing');
      setGoal('');
      setTarget('');
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setGoal('');
    setTarget('');
    setError('');
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <LinearGradient colors={['rgba(183,109,255,0.08)', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 0.5 }} pointerEvents="none" />

          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerIcon}>
                <Ionicons name="planet-outline" size={18} color={colors.primary.default} />
              </View>
              <AText variant="subheading" weight="bold">New Goal</AText>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.text.muted} />
            </Pressable>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Goal input */}
            <View style={styles.field}>
              <AText variant="label" color="muted" uppercase style={styles.fieldLabel}>What's your goal?</AText>
              <TextInput
                style={[styles.input, styles.goalInput]}
                value={goal}
                onChangeText={setGoal}
                placeholder="e.g. Learn guitar, run a half marathon, ship my SaaS…"
                placeholderTextColor={colors.text.faint}
                multiline
                numberOfLines={3}
                autoFocus
                editable={!loading}
              />
            </View>

            {/* Target date */}
            <View style={styles.field}>
              <AText variant="label" color="muted" uppercase style={styles.fieldLabel}>By when?</AText>
              <TextInput
                style={styles.input}
                value={target}
                onChangeText={setTarget}
                placeholder="e.g. September 2026, end of year, 3 months…"
                placeholderTextColor={colors.text.faint}
                editable={!loading}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.presetRow}>
                  {MONTH_PRESETS.map((p) => (
                    <Pressable
                      key={p}
                      style={[styles.presetChip, target === p && styles.presetChipActive]}
                      onPress={() => setTarget(p)}
                      disabled={loading}
                    >
                      <AText style={[styles.presetText, target === p && styles.presetTextActive]}>{p}</AText>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Info box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.secondary.default} />
              <AText variant="caption" color="muted" style={{ flex: 1, lineHeight: 18 }}>
                AetherOS will use AI to search for the best approach to your specific goal and build a personalised quest plan — daily habit, milestones, and this week's action tasks.
              </AText>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={16} color={colors.danger.default} />
                <AText style={styles.errorText}>{error}</AText>
              </View>
            ) : null}

          </ScrollView>

          {/* Generate button */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.generateBtn, (!goal.trim() || loading) && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={!goal.trim() || loading}
            >
              {loading ? (
                <>
                  <ActivityIndicator size="small" color={colors.primary.default} />
                  <AText style={styles.generateText}>Summoning your quests…</AText>
                </>
              ) : (
                <>
                  <Ionicons name="planet-outline" size={18} color={colors.black} />
                  <AText style={[styles.generateText, { color: colors.black }]}>Generate my plan</AText>
                </>
              )}
            </Pressable>
          </View>

        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg.surface },
  container:   { flex: 1 },
  handleBar:   { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border.strong, alignSelf: 'center', marginTop: spacing[3] },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.border.subtle },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  headerIcon:  { width: 34, height: 34, borderRadius: radius.full, backgroundColor: colors.primary.faint, borderWidth: 1, borderColor: colors.primary.default + '30', alignItems: 'center', justifyContent: 'center' },
  closeBtn:    { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.bg.elevated, alignItems: 'center', justifyContent: 'center' },
  scroll:      { flex: 1 },
  scrollContent: { padding: spacing[5], gap: spacing[5] },
  field:       { gap: spacing[3] },
  fieldLabel:  { letterSpacing: 2, fontSize: 10 },
  input:       { backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.default, borderRadius: radius.md, padding: spacing[4], color: colors.text.primary, fontFamily: fontFamily.regular, fontSize: 15 },
  goalInput:   { minHeight: 90, textAlignVertical: 'top' },
  presetRow:   { flexDirection: 'row', gap: spacing[2] },
  presetChip:  { paddingVertical: spacing[2], paddingHorizontal: spacing[3], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default },
  presetChipActive: { borderColor: colors.primary.default + '60', backgroundColor: colors.primary.faint },
  presetText:  { fontFamily: fontFamily.medium, fontSize: 12, color: colors.text.faint },
  presetTextActive: { color: colors.primary.default },
  infoBox:     { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], backgroundColor: colors.secondary.faint, borderRadius: radius.md, borderWidth: 1, borderColor: colors.secondary.default + '25', padding: spacing[4] },
  errorBox:    { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3], backgroundColor: colors.danger.faint, borderRadius: radius.md, borderWidth: 1, borderColor: colors.danger.default + '30', padding: spacing[4] },
  errorText:   { fontFamily: fontFamily.regular, fontSize: 13, color: colors.danger.default, flex: 1, lineHeight: 18 },
  footer:      { padding: spacing[5], borderTopWidth: 1, borderTopColor: colors.border.subtle },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[3], backgroundColor: colors.primary.container, borderRadius: radius.full, paddingVertical: spacing[4] },
  generateBtnDisabled: { backgroundColor: colors.bg.elevated, borderWidth: 1, borderColor: colors.border.default },
  generateText: { fontFamily: fontFamily.semiBold, fontSize: 16, color: colors.primary.default, letterSpacing: 0.3 },
});
