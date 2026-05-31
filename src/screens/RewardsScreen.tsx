import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { useAchievementStore, Achievement, AchievementCategory } from '../store/useAchievementStore';

type FilterTab = 'all' | AchievementCategory;
const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'streak', label: 'Streak' }, { key: 'focus', label: 'Focus' },
  { key: 'rank', label: 'Rank' }, { key: 'tasks', label: 'Tasks' }, { key: 'special', label: 'Special' },
];
const CATEGORY_COLORS: Record<string, string> = {
  streak: '#fbbf24', focus: colors.primary.default, rank: colors.secondary.default, tasks: colors.success.default, special: '#f97316',
};

export function RewardsScreen() {
  const { achievements, getUnlocked } = useAchievementStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const unlocked = getUnlocked();
  const total    = achievements.length;
  const pct      = total > 0 ? Math.round((unlocked.length / total) * 100) : 0;
  const filtered = achievements.filter((a) => activeFilter === 'all' || a.category === activeFilter);
  const sorted   = [...filtered].sort((a, b) => (b.unlockedAt ? 1 : 0) - (a.unlockedAt ? 1 : 0));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['rgba(173,198,255,0.06)', 'transparent']} style={[styles.ambient, { pointerEvents: 'none' }]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />

      <View style={styles.header}>
        <AText variant="heading" weight="bold" style={styles.title}>Rewards</AText>
        <AText variant="caption" color="muted">{unlocked.length} / {total} unlocked</AText>
      </View>

      <View style={styles.overallProgress}>
        <View style={styles.progressTrack}>
          <LinearGradient colors={[colors.secondary.default, colors.primary.default]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${Math.max(pct, 2)}%` as any }]} />
        </View>
        <AText variant="caption" style={{ color: colors.secondary.default, minWidth: 36 }}>{pct}%</AText>
      </View>

      <View style={styles.statRow}>
        <StatPill icon="checkmark-circle-outline" value={unlocked.length}              label="Unlocked" color={colors.success.default} />
        <StatPill icon="lock-closed-outline"      value={total - unlocked.length}       label="Locked"   color={colors.text.faint} />
        <StatPill icon="flash"                    value={unlocked.reduce((s, a) => s + a.xpBonus, 0)} label="XP Earned" color={colors.primary.default} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow} style={styles.filterScroll}>
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.key;
          const c = tab.key === 'all' ? colors.primary.default : CATEGORY_COLORS[tab.key];
          return (
            <Pressable key={tab.key} style={[styles.filterChip, isActive && { borderColor: c + '60', backgroundColor: c + '15' }]} onPress={() => setActiveFilter(tab.key)}>
              <AText variant="label" style={{ color: isActive ? c : colors.text.muted, fontSize: 12, letterSpacing: 0.5 }}>{tab.label}</AText>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {sorted.map((ach) => <AchievementCard key={ach.id} achievement={ach} />)}
        <View style={{ height: spacing[16] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function AchievementCard({ achievement: ach }: { achievement: Achievement }) {
  const isUnlocked = !!ach.unlockedAt;
  const color      = isUnlocked ? CATEGORY_COLORS[ach.category] ?? colors.primary.default : colors.text.faint;
  const glow       = isUnlocked && Platform.OS === 'web' ? { boxShadow: `0 0 16px 2px ${color}20` } as any : {};
  return (
    <View style={[styles.achCard, isUnlocked && { borderColor: color + '30' }, glow]}>
      {isUnlocked && <LinearGradient colors={[color + '0F', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} pointerEvents="none" />}
      <View style={[styles.achIcon, isUnlocked ? { backgroundColor: color + '18', borderColor: color + '40' } : { backgroundColor: colors.bg.elevated, borderColor: colors.border.subtle }]}>
        <Ionicons name={isUnlocked ? ach.icon : 'lock-closed-outline'} size={isUnlocked ? 26 : 22} color={color} />
      </View>
      <AText variant="body" weight={isUnlocked ? 'semiBold' : 'regular'} style={[styles.achTitle, { color: isUnlocked ? colors.white : colors.text.faint }]} numberOfLines={1}>{ach.title}</AText>
      <AText variant="caption" style={[styles.achDesc, { color: isUnlocked ? colors.text.muted : colors.text.faint + '80' }]} numberOfLines={2}>{ach.description}</AText>
      <View style={styles.achFooter}>
        <Ionicons name="flash" size={11} color={isUnlocked ? color : colors.text.faint} />
        <AText style={[styles.achXP, { color: isUnlocked ? color : colors.text.faint }]}>+{ach.xpBonus}</AText>
        {ach.unlockedAt && <AText variant="label" style={styles.achDate}>{new Date(ach.unlockedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</AText>}
      </View>
    </View>
  );
}

function StatPill({ icon, value, label, color }: { icon: keyof typeof Ionicons.glyphMap; value: number; label: string; color: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={14} color={color} />
      <AText variant="body" weight="bold" style={{ color }}>{value}</AText>
      <AText variant="caption" color="muted">{label}</AText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg.primary },
  ambient:   { position: 'absolute', top: 0, left: 0, right: 0, height: 250 },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[2], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  title:  { fontSize: 26 },
  overallProgress: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingHorizontal: spacing[5], paddingVertical: spacing[3] },
  progressTrack:   { flex: 1, height: 6, backgroundColor: colors.bg.high, borderRadius: radius.full, overflow: 'hidden' },
  progressFill:    { height: '100%', borderRadius: radius.full, minWidth: 4 },
  statRow:         { flexDirection: 'row', paddingHorizontal: spacing[5], gap: spacing[3], marginBottom: spacing[3] },
  statPill:        { flex: 1, flexDirection: 'column', alignItems: 'center', gap: 4, backgroundColor: colors.bg.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border.subtle, paddingVertical: spacing[3] },
  filterScroll:    { flexGrow: 0 },
  filterRow:       { paddingHorizontal: spacing[5], gap: spacing[2], paddingBottom: spacing[3] },
  filterChip:      { paddingHorizontal: spacing[4], paddingVertical: spacing[2], borderRadius: radius.full, borderWidth: 1, borderColor: colors.border.default },
  scroll:          { flex: 1 },
  grid:            { paddingHorizontal: spacing[5], flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  achCard:         { width: '47%', backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle, padding: spacing[4], gap: spacing[3], overflow: 'hidden', alignItems: 'center' },
  achIcon:         { width: 60, height: 60, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  achTitle:        { textAlign: 'center', fontSize: 13, letterSpacing: 0.2 },
  achDesc:         { textAlign: 'center', fontSize: 11, lineHeight: 15 },
  achFooter:       { flexDirection: 'row', alignItems: 'center', gap: 4 },
  achXP:           { fontFamily: fontFamily.bold, fontSize: 12, letterSpacing: 0.5 },
  achDate:         { color: colors.text.faint, fontSize: 10, marginLeft: 6 },
});
