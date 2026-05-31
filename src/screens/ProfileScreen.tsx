import React from 'react';
import { View, ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { CircularProgress } from '../components/shared/CircularProgress';
import { useUserStore } from '../store/useUserStore';
import { useStatsStore } from '../store/useStatsStore';
import { useAchievementStore } from '../store/useAchievementStore';
import { getRankThreshold, RANK_THRESHOLDS, formatXP } from '../utils/xp';
import { Rank, DayStats } from '../types';

const RANK_ORDER: Rank[] = ['E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS'];
const CAT_COLORS: Record<string, string> = { streak: '#fbbf24', focus: colors.primary.default, rank: colors.secondary.default, tasks: colors.success.default, special: '#f97316' };

export function ProfileScreen() {
  const { profile, rank, rankProgress, xpToNextRank } = useUserStore();
  const { getLast28Days, deepWorkSessions } = useStatsStore();
  const { getUnlocked, achievements } = useAchievementStore();

  const days28    = getLast28Days();
  const unlocked  = getUnlocked();
  const rankInfo  = getRankThreshold(rank);
  const maxXP     = days28.reduce((m, d) => Math.max(m, d.xpEarned), 1);
  const daysActive = days28.filter((d) => d.xpEarned > 0).length;
  const totalFocusHours = Math.round(profile.focusMinutesTotal / 60 * 10) / 10;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['rgba(183,109,255,0.07)', 'transparent']} style={[styles.ambient, { pointerEvents: 'none' }]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Hunter Card */}
        <View style={styles.hunterCard}>
          <LinearGradient colors={['#1a1025', '#0a0a0a']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} />
          <View style={styles.hunterTop}>
            <View style={styles.avatarRing}><View style={styles.avatar}><Ionicons name="person" size={36} color={rankInfo.color} /></View></View>
            <View style={styles.identityBlock}>
              <AText variant="heading" weight="bold" style={{ color: colors.white }}>{profile.displayName}</AText>
              <View style={styles.rankBadge}><View style={[styles.rankDot, { backgroundColor: rankInfo.color }]} /><AText style={[styles.rankLabelText, { color: rankInfo.color }]}>{rankInfo.label}</AText></View>
              <AText variant="caption" color="muted">{formatXP(profile.totalXP)} total XP · {xpToNextRank > 0 ? `${formatXP(xpToNextRank)} to next rank` : 'MAX RANK'}</AText>
            </View>
          </View>
          <View style={styles.xpRingRow}>
            <CircularProgress size={100} progress={rankProgress} strokeWidth={7} color={rankInfo.color} trackColor="#2a2a2a">
              <AText style={[styles.rankLetterBig, { color: rankInfo.color }]}>{rank}</AText>
            </CircularProgress>
            <View style={styles.xpMeta}>
              <MetaRow icon="flame-outline"     label="Streak"    value={`${profile.currentStreak} days`} color={colors.warning.default} />
              <MetaRow icon="hourglass-outline" label="Focus"     value={`${totalFocusHours}h`}           color={colors.secondary.default} />
              <MetaRow icon="skull-outline"     label="Deep Work" value={`${deepWorkSessions} sessions`}  color={colors.primary.default} />
              <MetaRow icon="calendar-outline"  label="Active"    value={`${daysActive} / 28 days`}       color={colors.success.default} />
            </View>
          </View>
        </View>

        {/* Stat Grid */}
        <View style={styles.statGrid}>
          <StatCard label="Total Quests" value={profile.tasksCompleted.toString()} icon="checkmark-done-outline" color={colors.success.default} />
          <StatCard label="Focus Hours"  value={`${totalFocusHours}h`}             icon="timer-outline"          color={colors.secondary.default} />
          <StatCard label="Best Streak"  value={`${profile.longestStreak}d`}       icon="flame-outline"          color={colors.warning.default} />
          <StatCard label="Achievements" value={`${unlocked.length}/${achievements.length}`} icon="ribbon-outline" color={colors.primary.default} />
        </View>

        {/* Activity Heatmap */}
        <View style={styles.section}>
          <SectionHeader title="Activity" subtitle="Last 28 days" icon="analytics-outline" color={colors.secondary.default} />
          <Heatmap days={days28} maxXP={maxXP} />
        </View>

        {/* Rank Timeline */}
        <View style={styles.section}>
          <SectionHeader title="Rank Progression" subtitle="Your journey" icon="trending-up-outline" color={colors.primary.default} />
          <RankTimeline currentRank={rank} totalXP={profile.totalXP} />
        </View>

        {/* Recent Achievements */}
        {unlocked.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Achievements" subtitle={`${unlocked.length} unlocked`} icon="star-outline" color="#fbbf24" />
            <View style={styles.achRow}>
              {unlocked.slice(0, 6).map((ach) => {
                const c = CAT_COLORS[ach.category] ?? colors.primary.default;
                return (
                  <View key={ach.id} style={[styles.achChip, { borderColor: c + '40', backgroundColor: c + '10' }]}>
                    <Ionicons name={ach.icon} size={18} color={c} />
                    <AText variant="label" style={{ color: c, fontSize: 10, textAlign: 'center' }} numberOfLines={2}>{ach.title}</AText>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: spacing[16] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Heatmap({ days, maxXP }: { days: DayStats[]; maxXP: number }) {
  const weeks = [0, 1, 2, 3].map((w) => days.slice(w * 7, w * 7 + 7));
  return (
    <View style={heatStyles.container}>
      <View style={heatStyles.dayLabels}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <AText key={i} style={heatStyles.dayLabel}>{d}</AText>)}
      </View>
      {weeks.map((week, wi) => (
        <View key={wi} style={heatStyles.week}>
          {week.map((day, di) => {
            const intensity = maxXP > 0 ? day.xpEarned / maxXP : 0;
            const isToday   = day.date === new Date().toISOString().split('T')[0];
            return (
              <View key={di} style={[heatStyles.cell, { backgroundColor: intensity > 0 ? `rgba(183,109,255,${0.15 + intensity * 0.75})` : colors.bg.elevated }, isToday && heatStyles.todayCell]} />
            );
          })}
        </View>
      ))}
      <View style={heatStyles.legend}>
        <AText style={heatStyles.legendLabel}>Less</AText>
        {[0.1, 0.3, 0.55, 0.8, 1.0].map((v, i) => <View key={i} style={[heatStyles.legendCell, { backgroundColor: `rgba(183,109,255,${0.15 + v * 0.75})` }]} />)}
        <AText style={heatStyles.legendLabel}>More</AText>
      </View>
    </View>
  );
}
const heatStyles = StyleSheet.create({
  container: { gap: 4 },
  dayLabels: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 2, marginBottom: 2 },
  dayLabel:  { fontFamily: fontFamily.medium, fontSize: 9, color: colors.text.faint, width: 16, textAlign: 'center' },
  week:      { flexDirection: 'row', justifyContent: 'space-around', gap: 4 },
  cell:      { flex: 1, height: 16, borderRadius: 3, minWidth: 16 },
  todayCell: { borderWidth: 1, borderColor: colors.primary.default + '80' },
  legend:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  legendCell: { width: 12, height: 12, borderRadius: 2 },
  legendLabel: { fontFamily: fontFamily.regular, fontSize: 9, color: colors.text.faint },
});

function RankTimeline({ currentRank, totalXP }: { currentRank: Rank; totalXP: number }) {
  const currentIdx = RANK_ORDER.indexOf(currentRank);
  return (
    <View style={timelineStyles.container}>
      {RANK_THRESHOLDS.map((threshold, i) => {
        const reached   = i <= currentIdx;
        const isCurrent = threshold.rank === currentRank;
        const glow      = isCurrent && Platform.OS === 'web' ? { boxShadow: `0 0 12px 3px ${threshold.color}50` } as any : {};
        return (
          <View key={threshold.rank} style={timelineStyles.row}>
            {i < RANK_THRESHOLDS.length - 1 && <View style={[timelineStyles.connector, { backgroundColor: reached ? threshold.color + '40' : colors.border.subtle }]} />}
            <View style={[timelineStyles.dot, reached ? { backgroundColor: threshold.color, borderColor: threshold.color + '60' } : { backgroundColor: colors.bg.elevated, borderColor: colors.border.default }, isCurrent && timelineStyles.currentDot, glow]}>
              {isCurrent && <View style={[timelineStyles.innerDot, { backgroundColor: threshold.color }]} />}
            </View>
            <View style={timelineStyles.labelBlock}>
              <AText style={[timelineStyles.rankLabel, { color: reached ? threshold.color : colors.text.faint }, isCurrent && { fontFamily: fontFamily.bold }]}>{threshold.label}</AText>
              <AText style={timelineStyles.xpLabel}>{formatXP(threshold.minXP)} XP{isCurrent && ` · ${formatXP(totalXP - threshold.minXP)} earned`}</AText>
            </View>
            {isCurrent && <View style={[timelineStyles.currentBadge, { borderColor: threshold.color + '50', backgroundColor: threshold.color + '15' }]}><AText style={[timelineStyles.currentBadgeText, { color: threshold.color }]}>CURRENT</AText></View>}
          </View>
        );
      })}
    </View>
  );
}
const timelineStyles = StyleSheet.create({
  container:        { gap: 0, paddingLeft: spacing[2] },
  row:              { flexDirection: 'row', alignItems: 'center', gap: spacing[4], paddingVertical: spacing[3], position: 'relative' },
  connector:        { position: 'absolute', left: 9, top: '60%', width: 2, height: '100%', zIndex: 0 },
  dot:              { width: 20, height: 20, borderRadius: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  currentDot:       { width: 24, height: 24, borderRadius: 12 },
  innerDot:         { width: 8, height: 8, borderRadius: 4 },
  labelBlock:       { flex: 1, gap: 2 },
  rankLabel:        { fontFamily: fontFamily.semiBold, fontSize: 14, letterSpacing: 0.3 },
  xpLabel:          { fontFamily: fontFamily.regular, fontSize: 11, color: colors.text.faint },
  currentBadge:     { paddingHorizontal: spacing[2], paddingVertical: 2, borderRadius: radius.full, borderWidth: 1 },
  currentBadgeText: { fontFamily: fontFamily.bold, fontSize: 9, letterSpacing: 1.5 },
});

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={statStyles.card}>
      <Ionicons name={icon} size={18} color={color} />
      <AText style={[statStyles.value, { color }]}>{value}</AText>
      <AText variant="label" color="muted" style={statStyles.label}>{label}</AText>
    </View>
  );
}
const statStyles = StyleSheet.create({
  card:  { flex: 1, minWidth: '45%', backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.subtle, padding: spacing[4], alignItems: 'center', gap: spacing[2] },
  value: { fontFamily: fontFamily.bold, fontSize: 22, letterSpacing: 0.5 },
  label: { fontSize: 10, letterSpacing: 1.5, textAlign: 'center' },
});

function MetaRow({ icon, label, value, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string }) {
  return (
    <View style={metaStyles.row}>
      <Ionicons name={icon} size={13} color={color} />
      <AText variant="caption" color="muted" style={metaStyles.label}>{label}</AText>
      <AText variant="caption" weight="semiBold" style={[metaStyles.value, { color }]}>{value}</AText>
    </View>
  );
}
const metaStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  label: { flex: 1, fontSize: 11 },
  value: { fontSize: 11 },
});

function SectionHeader({ title, subtitle, icon, color }: { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; color: string }) {
  return (
    <View style={sectionStyles.header}>
      <Ionicons name={icon} size={16} color={color} />
      <AText variant="body" weight="semiBold" style={{ color: colors.white, letterSpacing: 0.3 }}>{title}</AText>
      <View style={{ flex: 1 }} />
      <AText variant="caption" color="muted">{subtitle}</AText>
    </View>
  );
}
const sectionStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginBottom: spacing[3] },
});

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: colors.bg.primary },
  ambient:       { position: 'absolute', top: 0, left: 0, right: 0, height: 300 },
  scrollContent: { paddingHorizontal: spacing[5], paddingTop: spacing[5], gap: spacing[5] },
  hunterCard:    { borderRadius: 24, borderWidth: 1, borderColor: colors.primary.default + '25', padding: spacing[5], gap: spacing[5], overflow: 'hidden' },
  hunterTop:     { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  avatarRing:    { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: colors.primary.default + '50', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg.elevated },
  avatar:        { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary.faint, alignItems: 'center', justifyContent: 'center' },
  identityBlock: { flex: 1, gap: spacing[1] },
  rankBadge:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  rankDot:       { width: 6, height: 6, borderRadius: 3 },
  rankLabelText: { fontFamily: fontFamily.bold, fontSize: 12, letterSpacing: 1.5 },
  xpRingRow:     { flexDirection: 'row', alignItems: 'center', gap: spacing[5] },
  rankLetterBig: { fontFamily: fontFamily.bold, fontSize: 28, letterSpacing: 2 },
  xpMeta:        { flex: 1, gap: spacing[3] },
  statGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  section:       { gap: 0 },
  achRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  achChip:       { width: 76, height: 76, borderRadius: radius.lg, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2], padding: spacing[2] },
});
