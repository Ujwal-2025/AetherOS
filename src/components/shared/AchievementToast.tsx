import React, { useEffect } from 'react';
import { StyleSheet, Platform, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withDelay, runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, fontFamily } from '../../theme';
import { AText } from '../ui/AText';
import { Achievement } from '../../store/useAchievementStore';

const CATEGORY_COLORS: Record<string, string> = {
  streak:  '#fbbf24', focus: colors.primary.default,
  rank:    colors.secondary.default, tasks: colors.success.default, special: '#f97316',
};

interface AchievementToastProps { achievement: Achievement | null; onHide: () => void; }

export function AchievementToast({ achievement, onHide }: AchievementToastProps) {
  const translateY = useSharedValue(-120);
  const opacity    = useSharedValue(0);

  useEffect(() => {
    if (!achievement) return;
    translateY.value = withSpring(0, { damping: 14, stiffness: 160 });
    opacity.value    = withTiming(1, { duration: 250 });
    translateY.value = withDelay(2500, withTiming(-120, { duration: 350 }, (done) => { if (done) runOnJS(onHide)(); }));
    opacity.value    = withDelay(2500, withTiming(0, { duration: 350 }));
  }, [achievement]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }], opacity: opacity.value }));

  if (!achievement) return null;
  const color = CATEGORY_COLORS[achievement.category] ?? colors.primary.default;
  const glow = Platform.OS === 'web' ? { boxShadow: `0 4px 30px 8px ${color}30` } as any : { elevation: 16 };

  return (
    <Animated.View style={[styles.container, glow, style]} pointerEvents="none">
      <LinearGradient colors={[color + '20', 'transparent']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} pointerEvents="none" />
      <View style={[styles.iconBox, { backgroundColor: color + '18', borderColor: color + '40' }]}>
        <Ionicons name={achievement.icon} size={24} color={color} />
      </View>
      <View style={styles.textBlock}>
        <AText style={[styles.topLabel, { color: color + 'AA' }]}>ACHIEVEMENT UNLOCKED</AText>
        <AText style={styles.title}>{achievement.title}</AText>
        <AText variant="caption" color="muted" numberOfLines={1}>{achievement.description}</AText>
      </View>
      <View style={styles.xpBlock}>
        <Ionicons name="flash" size={14} color={color} />
        <AText style={[styles.xpText, { color }]}>+{achievement.xpBonus}</AText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 60, left: spacing[4], right: spacing[4], zIndex: 99999, flexDirection: 'row', alignItems: 'center', gap: spacing[3], backgroundColor: colors.bg.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border.strong, padding: spacing[4], overflow: 'hidden' },
  iconBox: { width: 50, height: 50, borderRadius: radius.md, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  textBlock: { flex: 1, gap: 2 },
  topLabel: { fontFamily: fontFamily.bold, fontSize: 9, letterSpacing: 2 },
  title:    { fontFamily: fontFamily.bold, fontSize: 15, color: colors.white, letterSpacing: 0.3 },
  xpBlock:  { alignItems: 'center', justifyContent: 'center', gap: 2 },
  xpText:   { fontFamily: fontFamily.bold, fontSize: 14, letterSpacing: 0.5 },
});
