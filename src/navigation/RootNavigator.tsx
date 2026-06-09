import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSequence, runOnJS,
} from 'react-native-reanimated';
import { NavigationContainer } from '@react-navigation/native';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { MainNavigator } from './MainNavigator';
import { AppTourOverlay } from '../components/shared/AppTourOverlay';
import { useUserStore } from '../store/useUserStore';
import { colors } from '../theme';

export function RootNavigator() {
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  const setOnboarded = useUserStore((s) => s.setOnboarded);

  const [phase, setPhase]     = useState<'onboarding' | 'main'>(hasOnboarded ? 'main' : 'onboarding');
  const [showTour, setShowTour] = useState(false);

  // Purple flash that masks the instant scene swap
  const flashOpacity = useSharedValue(0);
  const flashStyle   = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));

  function revealMain() {
    setPhase('main');
    flashOpacity.value = withTiming(0, { duration: 500 }, (done) => {
      if (done) runOnJS(setShowTour)(true);
    });
  }

  function handleComplete() {
    setOnboarded();
    // Flash in → swap scene → flash out
    flashOpacity.value = withSequence(
      withTiming(1, { duration: 220 }),
      withTiming(1, { duration: 60 }),    // brief hold
    );
    // Swap at peak of flash after 280ms
    flashOpacity.value = withTiming(1, { duration: 280 }, (done) => {
      if (done) runOnJS(revealMain)();
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg.primary }}>
      {phase === 'onboarding' && (
        <OnboardingScreen onComplete={handleComplete} />
      )}

      {phase === 'main' && (
        <NavigationContainer>
          <MainNavigator />
        </NavigationContainer>
      )}

      {/* Cinematic purple flash overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.flash, flashStyle]}
        pointerEvents="none"
      />

      {showTour && (
        <AppTourOverlay onDone={() => setShowTour(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flash: { backgroundColor: colors.primary.default + '70' },
});
