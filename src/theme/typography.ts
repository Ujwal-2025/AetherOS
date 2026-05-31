export const fontFamily = {
  regular:  'Inter_400Regular',
  medium:   'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold:     'Inter_700Bold',
} as const;

export const fontSize = {
  xs:    11,
  sm:    13,
  base:  15,
  md:    17,
  lg:    20,
  xl:    24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 40,
} as const;

export const lineHeight = {
  tight:   1.2,
  snug:    1.35,
  normal:  1.5,
  relaxed: 1.65,
} as const;

export const letterSpacing = {
  tight:   -0.5,
  normal:  0,
  wide:    0.5,
  wider:   1,
  widest:  2,
} as const;
