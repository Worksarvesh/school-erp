import { View } from 'react-native';
import { useTheme } from '@school-erp/ui';

interface ProgressBarProps {
  /** 0 to 100. */
  percent: number;
  accessibilityLabel: string;
}

export function ProgressBar({ percent, accessibilityLabel }: ProgressBarProps) {
  const { colors, radii } = useTheme();
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
      style={{
        height: 8,
        borderRadius: radii.full,
        backgroundColor: colors.surfaceSubtle,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          borderRadius: radii.full,
          backgroundColor: colors.primary,
        }}
      />
    </View>
  );
}
