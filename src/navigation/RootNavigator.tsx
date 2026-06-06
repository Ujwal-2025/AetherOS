import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { MainNavigator } from './MainNavigator';
import { useUserStore } from '../store/useUserStore';

export function RootNavigator() {
  const hasOnboarded = useUserStore((s) => s.hasOnboarded);
  const setOnboarded = useUserStore((s) => s.setOnboarded);

  if (!hasOnboarded) {
    return <OnboardingScreen onComplete={setOnboarded} />;
  }

  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
}
