import React from 'react';
import { Text, TextStyle } from 'react-native';
import { colors, fontFamily, fontSize } from '../../theme';

type Variant = 'display' | 'title' | 'heading' | 'subheading' | 'body' | 'label' | 'caption';
type Weight  = 'regular' | 'medium' | 'semiBold' | 'bold';
type Color   = 'primary' | 'secondary' | 'muted' | 'faint';

interface ATextProps extends React.ComponentProps<typeof Text> {
  variant?:  Variant;
  weight?:   Weight;
  color?:    Color;
  uppercase?: boolean;
}

const VARIANT_STYLES: Record<Variant, TextStyle> = {
  display:    { fontSize: fontSize['4xl'], lineHeight: fontSize['4xl'] * 1.1 },
  title:      { fontSize: fontSize['3xl'], lineHeight: fontSize['3xl'] * 1.2 },
  heading:    { fontSize: fontSize['2xl'], lineHeight: fontSize['2xl'] * 1.2 },
  subheading: { fontSize: fontSize.lg,    lineHeight: fontSize.lg * 1.3 },
  body:       { fontSize: fontSize.base,  lineHeight: fontSize.base * 1.5 },
  label:      { fontSize: fontSize.xs,    lineHeight: fontSize.xs * 1.4 },
  caption:    { fontSize: fontSize.sm,    lineHeight: fontSize.sm * 1.4 },
};

const WEIGHT_MAP: Record<Weight, string> = {
  regular:  fontFamily.regular,
  medium:   fontFamily.medium,
  semiBold: fontFamily.semiBold,
  bold:     fontFamily.bold,
};

const COLOR_MAP: Record<Color, string> = {
  primary:   colors.text.primary,
  secondary: colors.text.secondary,
  muted:     colors.text.muted,
  faint:     colors.text.faint,
};

export function AText({
  variant = 'body',
  weight  = 'regular',
  color,
  uppercase,
  style,
  ...props
}: ATextProps) {
  return (
    <Text
      style={[
        VARIANT_STYLES[variant],
        { fontFamily: WEIGHT_MAP[weight], color: color ? COLOR_MAP[color] : colors.text.primary },
        uppercase && { textTransform: 'uppercase' },
        style,
      ]}
      {...props}
    />
  );
}
