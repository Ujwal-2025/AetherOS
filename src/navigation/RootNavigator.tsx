import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { MainNavigator } from './MainNavigator';

export function RootNavigator() {
  const [hasOnboarded, setHasOnboarded] = useState(false);

  if (!hasOnboarded) {
    return <OnboardingScreen onComplete={() => setHasOnboarded(true)} />;
  }

  return (
    <NavigationContainer>
      <MainNavigator />
    </NavigationContainer>
  );
}
