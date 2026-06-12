import React, { useEffect, useRef } from 'react';
import { View, Modal, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withSpring, withTiming, withRepeat, withSequence, runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily, fontSize } from '../../theme';
import { AText } from '../ui/AText';
import { getRankThreshold } from '../../utils/xp';
import { haptics } from '../../utils/haptics';
import { Rank } from '../../types';

function Particle({ angle, delay, color, size }: { angle: number; delay: number; color: string; size: number }) {
  const distance = 90 + (angle % 3) * 35;
  const rad = (angle * Math.PI) / 180;
  const tx = useSharedValue(0), ty = useSharedValue(0), op = useSharedValue(0), sc = useSharedValue(0);
  useEffect(() => {
    const timer = setTimeout(() => {
      sc.value = withSpring(1, { damping: 14, stiffness: 200 });
      tx.value = withTiming(Math.cos(rad) * distance, { duration: 900 });
      ty.value = withTiming(Math.sin(rad) * distance, { duration: 900 });
      op.value = withSequence(withTiming(1, { duration: 180 }), withTiming(1, { duration: 500 }), withTiming(0, { duration: 320 }));
    }, delay);
    return () => clearTimeout(timer);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: sc.value }], opacity: op.value }));
  return <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, style]} />;
}

const RANK_SUBTITLES: Record<Rank, string> = {
  E: 'The awakening begins.',   D: 'You surpassed the weak.',
  C: 'Power flows through you.', B: 'Few reach this height.',
  A: 'Elite. Feared. Rising.',   S: 'You have transcended limits.',
  SS: 'The world bends before you.', SSS: 'There is none above you.',
};

interface RankUpOverlayProps { rank: Rank; visible: boolean; onDismiss: () => void; }

export function RankUpOverlay({ rank, visible, onDismiss }: RankUpOverlayProps) {
  const rankInfo = getRankThreshold(rank);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeScale = useSharedValue(0), badgeOpacity = useSharedValue(0);
  const ringScale = useSharedValue(0.6), titleOpacity = useSharedValue(0), titleY = useSharedValue(30);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;
    haptics.rankUp();
    badgeScale.value = 0; badgeOpacity.value = 0; ringScale.value = 0.6; titleOpacity.value = 0; titleY.value = 30; pulseScale.value = 1;
    badgeScale.value = withSpring(1, { damping: 12, stiffness: 140 });
    badgeOpacity.value = withTiming(1, { duration: 400 });
    ringScale.value = withSpring(1, { damping: 10, stiffness: 120 });
    const t1 = setTimeout(() => { titleOpacity.value = withTiming(1, { duration: 500 }); titleY.value = withSpring(0, { damping: 14, stiffness: 120 }); }, 300);
    const t2 = setTimeout(() => { pulseScale.value = withRepeat(withSequence(withTiming(1.12, { duration: 700 }), withTiming(1.0, { duration: 700 })), -1, true); }, 600);
    timerRef.current = setTimeout(onDismiss, 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible]);

  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: badgeScale.value }], opacity: badgeOpacity.value }));
  const ringStyle  = useAnimatedStyle(() => ({ transform: [{ scale: ringScale.value * pulseScale.value }] }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: titleY.value }] }));

  if (!visible) return null;
  const glow = Platform.OS === 'web' ? { boxShadow: `0 0 60px 20px ${rankInfo.color}55` } as any : { elevation: 20 };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <LinearGradient colors={[rankInfo.color + '22', 'transparent', rankInfo.color + '11']} style={StyleSheet.absoluteFill} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} pointerEvents="none" />
        <View style={styles.particleOrigin} pointerEvents="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <Particle key={i} angle={i * 18} delay={i * 25} color={rankInfo.color} size={i % 3 === 0 ? 10 : i % 3 === 1 ? 6 : 4} />
          ))}
        </View>
        <Animated.View style={[styles.center, badgeStyle]}>
          <Animated.View style={[styles.outerRing, { borderColor: rankInfo.color + '40' }, ringStyle, glow]} />
          <View style={[styles.badge, { borderColor: rankInfo.color + '60', backgroundColor: rankInfo.color + '10' }, glow]}>
            <AText style={[styles.rankLetter, { color: rankInfo.color }]}>{rank}</AText>
          </View>
        </Animated.View>
        <Animated.View style={[styles.textBlock, titleStyle]}>
          <AText style={styles.rankUpLabel}>RANK UP</AText>
          <AText style={[styles.rankName, { color: rankInfo.color }]}>{rankInfo.label}</AText>
          <AText style={styles.subtitle}>{RANK_SUBTITLES[rank]}</AText>
        </Animated.View>
        <Animated.View style={[styles.btnWrapper, titleStyle]}>
          <Pressable style={[styles.continueBtn, { borderColor: rankInfo.color + '50', backgroundColor: rankInfo.color + '18' }]} onPress={onDismiss}>
            <Ionicons name="chevron-forward" size={14} color={rankInfo.color} />
            <AText style={[styles.continueTxt, { color: rankInfo.color }]}>Continue</AText>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', gap: spacing[6] },
  particleOrigin: { position: 'absolute', width: 0, height: 0, alignItems: 'center', justifyContent: 'center', top: '50%', left: '50%' },
  center: { alignItems: 'center', justifyContent: 'center' },
  outerRing: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1 },
  badge: { width: 160, height: 160, borderRadius: 80, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  rankLetter: { fontFamily: fontFamily.bold, fontSize: 72, lineHeight: 80, letterSpacing: 4 },
  textBlock: { alignItems: 'center', gap: spacing[2] },
  rankUpLabel: { fontFamily: fontFamily.bold, fontSize: 13, letterSpacing: 6, color: colors.text.muted },
  rankName:  { fontFamily: fontFamily.bold, fontSize: 36, letterSpacing: 2 },
  subtitle:  { fontFamily: fontFamily.medium, fontSize: fontSize.sm, color: colors.text.muted, textAlign: 'center', marginTop: spacing[1] },
  btnWrapper: {},
  continueBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[8], paddingVertical: spacing[4], borderRadius: radius.full, borderWidth: 1, marginTop: spacing[2] },
  continueTxt: { fontFamily: fontFamily.semiBold, fontSize: fontSize.base, letterSpacing: 0.5 },
});
