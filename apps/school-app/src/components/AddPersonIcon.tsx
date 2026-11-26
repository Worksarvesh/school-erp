import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

/** Purple person with a green "+" badge (drawn as vectors so it stays sharp at any size). */
export function AddPersonIcon({ size = 26 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 52 52" accessibilityRole="image">
      <Defs>
        <LinearGradient id="person" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#8B5CF6" />
          <Stop offset="1" stopColor="#A855F7" />
        </LinearGradient>
        <LinearGradient id="badge" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#2CA58D" />
          <Stop offset="1" stopColor="#1E9A6B" />
        </LinearGradient>
      </Defs>
      <Circle cx="20" cy="13" r="12.5" fill="url(#person)" />
      <Path
        d="M0 46 C0 38 8 32.5 20 32.5 C32 32.5 40 38 40 46 C40 49.5 37.5 52 34 52 L6 52 C2.5 52 0 49.5 0 46 Z"
        fill="url(#person)"
      />
      <Circle cx="38.5" cy="37.5" r="13.5" fill="url(#badge)" stroke="#FFFFFF" strokeWidth="1.5" />
      <Path
        d="M38.5 30.5 V44.5 M31.5 37.5 H45.5"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </Svg>
  );
}
