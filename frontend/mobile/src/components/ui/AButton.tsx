import React from 'react';
import { Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { AText } from './AText';
import { colors, spacing, radius, fontFamily, fontSize } from '../../theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size    = 'sm' | 'md' | 'lg';

interface AButtonProps {
  variant?:  Variant;
  size?:     Size;
  label:     string;
  fullWidth?: boolean;
  disabled?:  boolean;
  loading?:   boolean;
  onPress?:   () => void;
  leftIcon?:  React.ReactNode;
}

const VARIANT_STYLES = {
  primary:   { bg: colors.primary.container,  border: colors.primary.default + '40', text: colors.black },
  secondary: { bg: colors.bg.elevated,        border: colors.border.strong,          text: colors.text.primary },
  ghost:     { bg: 'transparent',             border: colors.border.default,         text: colors.text.muted },
  danger:    { bg: colors.danger.container,   border: colors.danger.default + '40',  text: colors.danger.default },
};

const SIZE_STYLES = {
  sm: { paddingVertical: spacing[2], paddingHorizontal: spacing[4], fontSize: fontSize.sm },
  md: { paddingVertical: spacing[3], paddingHorizontal: spacing[5], fontSize: fontSize.base },
  lg: { paddingVertical: spacing[4], paddingHorizontal: spacing[6], fontSize: fontSize.base },
};

export function AButton({ variant = 'primary', size = 'md', label, fullWidth, disabled, loading, onPress, leftIcon }: AButtonProps) {
  const vs = VARIANT_STYLES[variant];
  const ss = SIZE_STYLES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: vs.bg, borderColor: vs.border, paddingVertical: ss.paddingVertical, paddingHorizontal: ss.paddingHorizontal },
        fullWidth && { width: '100%' },
        (disabled || loading) && { opacity: 0.4 },
      ]}
    >
      {leftIcon && <View style={{ marginRight: spacing[2] }}>{leftIcon}</View>}
      {loading ? (
        <ActivityIndicator size="small" color={vs.text} />
      ) : (
        <AText style={{ fontFamily: fontFamily.semiBold, fontSize: ss.fontSize, color: vs.text }}>
          {label}
        </AText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    borderRadius:   radius.full,
    borderWidth:    1,
  },
});
