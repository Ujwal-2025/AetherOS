/**
 * CircularProgress — platform-conditional.
 * Native: react-native-svg arc (precise, supports gradient).
 * Web: CSS border-radius ring (SVG crashes on web with metro bundler).
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface Props {
  size:           number;
  progress:       number;      // 0–1
  strokeWidth?:   number;
  color?:         string;
  trackColor?:    string;
  gradientColors?: [string, string];
  children?:      React.ReactNode;
}

// ─── Native (SVG) ─────────────────────────────────────────────────────────────

function CircularProgressNative({ size, progress, strokeWidth = 6, color = '#b76dff', trackColor = '#2a2a2a', children }: Props) {
  const Svg    = require('react-native-svg').Svg;
  const Circle = require('react-native-svg').Circle;
  const Defs   = require('react-native-svg').Defs;
  const LinearGradient = require('react-native-svg').LinearGradient;
  const Stop   = require('react-native-svg').Stop;

  const r           = (size - strokeWidth) / 2;
  const cx          = size / 2;
  const cy          = size / 2;
  const circumference = 2 * Math.PI * r;
  const dash        = circumference * Math.min(Math.max(progress, 0), 1);
  const gap         = circumference - dash;
  const rotation    = -90;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Track */}
        <Circle cx={cx} cy={cy} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        {/* Progress arc */}
        <Circle
          cx={cx} cy={cy} r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${cx} ${cy})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
        {children}
      </View>
    </View>
  );
}

// ─── Web (CSS rings) ──────────────────────────────────────────────────────────

function CircularProgressWeb({ size, progress, strokeWidth = 6, color = '#b76dff', trackColor = '#2a2a2a', children }: Props) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const deg = clampedProgress * 360;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Track ring */}
      <View style={{
        position:    'absolute',
        width:       size,
        height:      size,
        borderRadius: size / 2,
        borderWidth:  strokeWidth,
        borderColor:  trackColor,
      }} />
      {/* Progress ring using conic-gradient on web */}
      <View style={[
        {
          position:    'absolute',
          width:       size,
          height:      size,
          borderRadius: size / 2,
          // @ts-ignore web-only style
          background: `conic-gradient(${color} ${deg}deg, transparent ${deg}deg)`,
        },
      ]} />
      {/* Mask to create ring effect */}
      <View style={{
        position:    'absolute',
        width:       size - strokeWidth * 2,
        height:      size - strokeWidth * 2,
        borderRadius: (size - strokeWidth * 2) / 2,
        backgroundColor: 'transparent',
      }} />
      {/* Content */}
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </View>
    </View>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function CircularProgress(props: Props) {
  if (Platform.OS === 'web') return <CircularProgressWeb {...props} />;
  return <CircularProgressNative {...props} />;
}
