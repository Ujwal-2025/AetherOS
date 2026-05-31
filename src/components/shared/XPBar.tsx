import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';
import { formatXP } from '../../utils/xp';

interface XPBarProps {
  currentXP:  number;
  nextRankXP: number;
  progress:   number; // 0–1
}

export function XPBar({ currentXP, nextRankXP, progress }: XPBarProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const pct = Math.max(clampedProgress * 100, 1.5);

  return (
    <View style={styles.container}>
      <View style={styles.labels}>
        <AText variant="label" color="muted" style={styles.label}>
          {formatXP(currentXP)} XP
        </AText>
        <AText variant="label" color="muted" style={styles.label}>
          {formatXP(nextRankXP)} XP
        </AText>
      </View>

      <View style={styles.track}>
        <LinearGradient
          colors={[colors.primary.container, colors.secondary.default]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.fill, { width: `${pct}%` as any }]}
        />
        {/* Glow dot at the end */}
        <View style={[styles.glowDot, { left: `${pct}%` as any }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing[2] },
  labels: {
    flexDirection:  'row',
    justifyContent: 'space-between',
  },
  label: { fontSize: 9, letterSpacing: 1 },
  track: {
    height:          8,
    backgroundColor: '#1e1e1e',
    borderRadius:    radius.full,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    position:        'relative',
  },
  fill: {
    height:       '100%',
    borderRadius: radius.full,
    minWidth:     6,
  },
  glowDot: {
    position:        'absolute',
    top:             -2,
    width:           12,
    height:          12,
    borderRadius:    6,
    backgroundColor: colors.primary.default,
    ...(Platform.OS === 'web'
      ? { boxShadow: `0 0 8px 3px ${colors.primary.glow}` }
      : {}),
  },
});
