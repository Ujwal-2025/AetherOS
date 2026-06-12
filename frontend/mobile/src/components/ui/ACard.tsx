import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { colors, spacing, radius } from '../../theme';

interface ACardProps extends ViewProps {
  elevated?: boolean;
  children:  React.ReactNode;
}

export function ACard({ elevated, style, children, ...props }: ACardProps) {
  return (
    <View
      style={[
        styles.card,
        elevated && styles.elevated,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg.surface,
    borderRadius:    radius.xl,
    borderWidth:     1,
    borderColor:     colors.border.subtle,
    padding:         spacing[5],
  },
  elevated: {
    backgroundColor: colors.bg.elevated,
    borderColor:     colors.border.default,
  },
});
