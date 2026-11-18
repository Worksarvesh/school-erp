import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme.context.js';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  testID?: string;
}

export function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  testID,
}: HeaderProps) {
  const { colors, spacing, typography } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.base,
          paddingVertical: spacing.md,
        },
      ]}
      testID={testID}
      accessible={true}
      accessibilityRole="header"
    >
      <View style={styles.leftRow}>
        {showBack && onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, { marginRight: spacing.sm }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.backText, { color: colors.primary }]}>←</Text>
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleColumn}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                fontSize: typography.fontSizes.lg,
                fontWeight: typography.fontWeights.semibold,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                {
                  color: colors.textSecondary,
                  fontSize: typography.fontSizes.xs,
                },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {rightAction ? <View style={styles.rightAction}>{rightAction}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 44,
    minHeight: 44,
  },
  backText: {
    fontSize: 22,
    fontWeight: '700',
  },
  titleColumn: {
    flex: 1,
  },
  title: {},
  subtitle: {
    marginTop: 2,
  },
  rightAction: {
    marginLeft: 12,
  },
});
