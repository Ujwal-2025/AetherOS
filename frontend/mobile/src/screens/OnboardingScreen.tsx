import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, fontFamily } from '../theme';
import { AText } from '../components/ui/AText';
import { TypewriterText } from '../components/ui/TypewriterText';
import { useUserStore } from '../store/useUserStore';

type Phase = 'loading' | 'creating' | 'name';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [phase, setPhase] = useState<Phase>('loading');
  const [name, setName]   = useState('');
  const setDisplayName    = useUserStore((s) => s.setDisplayName);

  // Orb scale pulse
  const outerScale  = useSharedValue(1);
  // Name section cross-fade
  const nameOpacity = useSharedValue(0);

  useEffect(() => {
    // Start slow orb pulse on mount
    outerScale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900 }),
        withTiming(1.0,  { duration: 900 }),
      ),
      -1,
      true,
    );

    const t = setTimeout(() => setPhase('creating'), 1500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase === 'name') {
      nameOpacity.value = withTiming(1, { duration: 400 });
    }
  }, [phase]);

  function handleTypingDone() {
    setTimeout(() => setPhase('name'), 600);
  }

  function handleBegin() {
    setDisplayName(name.trim() || 'Hunter');
    onComplete();
  }

  const orbAnimStyle  = useAnimatedStyle(() => ({ transform: [{ scale: outerScale.value }] }));
  const nameFadeStyle = useAnimatedStyle(() => ({ opacity: nameOpacity.value }));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

        {/* Orb — visible all 3 phases */}
        <View style={styles.orbSection}>
          <Animated.View style={orbAnimStyle}>
            <View style={[styles.orbOuter, { borderColor: colors.primary.default + '20' }]}>
              <View style={[styles.orbInner, { borderColor: colors.primary.default + '40' }]}>
                <View style={[styles.orbCore, { backgroundColor: colors.primary.default + '15', borderColor: colors.primary.default + '30' }]}>
                  <Ionicons
                    name={phase === 'name' ? 'person-outline' : 'planet-outline'}
                    size={52}
                    color={colors.primary.default}
                  />
                </View>
              </View>
            </View>
          </Animated.View>
        </View>

        {/* Phase-specific content */}
        <View style={styles.contentSection}>
          {phase === 'creating' && (
            <TypewriterText
              text="Creating World…"
              speed={55}
              style={styles.creatingText}
              onDone={handleTypingDone}
            />
          )}

          {phase === 'name' && (
            <Animated.View style={[styles.nameContent, nameFadeStyle]}>
              <AText variant="title" weight="bold" style={[styles.title, { color: colors.white }]}>
                What's your hunter name?
              </AText>
              <AText variant="body" color="muted" style={styles.subtitle}>
                This is how AetherOS will address you. You can change it later.
              </AText>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name…"
                placeholderTextColor={colors.text.faint}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleBegin}
                maxLength={24}
              />
              <Pressable
                style={[styles.beginBtn, { backgroundColor: colors.primary.default + '18', borderColor: colors.primary.default + '50' }]}
                onPress={handleBegin}
              >
                <AText style={[styles.beginTxt, { color: colors.primary.default }]}>
                  {name.trim() ? `Begin as ${name.trim()}` : 'Begin as Hunter'}
                </AText>
                <Ionicons name="flash" size={16} color={colors.primary.default} />
              </Pressable>
            </Animated.View>
          )}
        </View>

      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:              1,
    backgroundColor:   colors.bg.primary,
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: spacing[6],
    paddingBottom:     spacing[6],
  },

  orbSection: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orbOuter:   { width: 260, height: 260, borderRadius: 130, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orbInner:   { width: 210, height: 210, borderRadius: 105, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  orbCore:    { width: 160, height: 160, borderRadius: 80,  borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  contentSection: { width: '100%', alignItems: 'center', minHeight: 200, justifyContent: 'center' },

  creatingText: {
    color:      colors.text.primary,
    fontFamily: fontFamily.semiBold,
    fontSize:   28,
    textAlign:  'center',
  },

  nameContent: { width: '100%', alignItems: 'center', gap: spacing[4] },
  title:       { textAlign: 'center', lineHeight: 40 },
  subtitle:    { textAlign: 'center', maxWidth: 320, lineHeight: 22 },

  nameInput: {
    width:           '100%',
    backgroundColor: colors.bg.elevated,
    borderWidth:     1,
    borderColor:     colors.primary.default + '40',
    borderRadius:    radius.md,
    padding:         spacing[4],
    color:           colors.text.primary,
    fontFamily:      fontFamily.regular,
    fontSize:        18,
    textAlign:       'center',
    marginTop:       spacing[2],
  },

  beginBtn: {
    width:          '100%',
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            spacing[2],
    paddingVertical: spacing[4],
    borderRadius:   radius.full,
    borderWidth:    1,
    marginTop:      spacing[2],
  },
  beginTxt: { fontFamily: fontFamily.semiBold, fontSize: 16, letterSpacing: 0.5 },
});
