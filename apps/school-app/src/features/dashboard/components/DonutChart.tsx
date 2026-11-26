import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface Props {
  percent: number;
  label: string;
  color: string;
  track: string;
  size?: number;
  stroke?: number;
}

/** A ring filled clockwise from 12 o'clock, with the percentage and a label in the middle. */
export function DonutChart({ percent, label, color, track, size = 109, stroke = 14 }: Props) {
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  const centre = size / 2;

  return (
    <View
      style={{ width: size, height: size }}
      accessible
      accessibilityLabel={`${label}: ${percent} percent`}
    >
      <Svg width={size} height={size}>
        <Circle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={track}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={centre}
          cy={centre}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${(length * percent) / 100} ${length}`}
          // Start at the top instead of 3 o'clock.
          transform={`rotate(-90 ${centre} ${centre})`}
        />
      </Svg>
      <View style={styles.middle}>
        <Text style={styles.percent}>{percent}%</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  middle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: { color: '#333333', fontSize: 20, lineHeight: 24, fontWeight: '700' },
  label: { color: '#555555', fontSize: 13, lineHeight: 17 },
});
