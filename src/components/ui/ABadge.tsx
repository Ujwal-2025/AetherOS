import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AText } from './AText';
import { colors, spacing, radius } from '../../theme';

interface ABadgeProps {
  label:   string;
  color?:  string;
  size?:   'sm' | 'md';
}

export function ABadge({ label, color = colors.primary.default, size = 'md' }: ABadgeProps) {
  return (
    <View style={[
      styles.badge,
      size === 'sm' && styles.badgeSm,
      { borderColor: color + '40', backgroundColor: color + '15' },
    ]}>
      <AText
        style={[
          styles.text,
          size === 'sm' && styles.textSm,
          { color },
        ]}
      >
        {label}
      </AText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing[3],
    paddingVertical:   spacing[1],
    borderRadius:      radius.full,
    borderWidth:       1,
  },
  badgeSm: {
    paddingHorizontal: spacing[2],
    paddingVertical:   2,
  },
  text: {
    fontSize:      11,
    fontWeight:    '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  textSm: {
    fontSize: 9,
  },
});
