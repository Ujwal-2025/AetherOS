import React, { useEffect } from 'react';
import { StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring, withSequence, runOnJS,
} from 'react-native-reanimated';
import { colors, fontFamily } from '../../theme';

interface XPFlyOutProps {
  xp:      number;
  color?:  string;
  visible: boolean;
  onHide:  () => void;
}

export function XPFlyOut({ xp, color = colors.primary.default, visible, onHide }: XPFlyOutProps) {
  const translateY = useSharedValue(0);
  const opacity    = useSharedValue(0);
  const scale      = useSharedValue(0.5);

  useEffect(() => {
    if (!visible) return;
    translateY.value = 0; opacity.value = 0; scale.value = 0.5;
    scale.value      = withSpring(1, { damping: 10, stiffness: 240 });
    translateY.value = withTiming(-110, { duration: 1200 });
    opacity.value    = withSequence(
      withTiming(1, { duration: 180 }),
      withTiming(1, { duration: 640 }),
      withTiming(0, { duration: 380 }, (done) => { if (done) runOnJS(onHide)(); }),
    );
  }, [visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity:   opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.pill, { borderColor: color + '40', backgroundColor: 'rgba(0,0,0,0.80)' }, animStyle]}
      pointerEvents="none"
    >
      <Animated.Text style={[styles.text, { color }]}>+{xp} XP</Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute', bottom: 100, alignSelf: 'center',
    zIndex: 9999, paddingHorizontal: 22, paddingVertical: 10,
    borderRadius: 100, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 24px 4px rgba(183,109,255,0.35)' } as any : { elevation: 12 }),
  },
  text: { fontFamily: fontFamily.bold, fontSize: 22, letterSpacing: 1 },
});
