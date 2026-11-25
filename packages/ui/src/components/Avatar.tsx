import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from '../theme/responsive.js';
import { Text } from './Text.js';
import { useTheme } from '../theme/theme.context.js';

export interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 40 }: AvatarProps) {
  const { colors, typography } = useTheme();

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primaryLight,
        },
      ]}
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={`Avatar for ${name}`}
    >
      <Text
        style={[
          styles.text,
          {
            color: '#FFFFFF',
            fontSize: size * 0.4,
            fontWeight: typography.fontWeights.semibold,
          },
        ]}
      >
        {initials || '?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {},
});
