import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme.context.js';
import { Button } from './Button.js';

export interface StateViewProps {
  state: 'loading' | 'error' | 'empty' | 'success';
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}

export function StateView({
  state,
  title,
  description,
  icon,
  actionLabel,
  onAction,
  testID,
}: StateViewProps) {
  const { colors, spacing, typography } = useTheme();

  if (state === 'loading') {
    return (
      <View style={[styles.container, { padding: spacing.xl }]} testID={testID}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            styles.title,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSizes.base,
              marginTop: spacing.md,
            },
          ]}
        >
          {title || 'Loading...'}
        </Text>
      </View>
    );
  }

  const defaultTitle =
    state === 'error'
      ? 'Something went wrong'
      : state === 'empty'
        ? 'No data available'
        : 'Action completed successfully';

  const defaultDescription =
    state === 'error'
      ? 'An error occurred while fetching information. Please try again.'
      : state === 'empty'
        ? 'There are no items to display at this time.'
        : '';

  return (
    <View
      style={[styles.container, { padding: spacing.xl }]}
      testID={testID}
      accessible={true}
      accessibilityRole="alert"
    >
      {icon ? <View style={{ marginBottom: spacing.md }}>{icon}</View> : null}
      <Text
        style={[
          styles.title,
          {
            color: state === 'error' ? colors.error : colors.text,
            fontSize: typography.fontSizes.lg,
            fontWeight: typography.fontWeights.semibold,
            textAlign: 'center',
          },
        ]}
      >
        {title || defaultTitle}
      </Text>
      <Text
        style={[
          styles.description,
          {
            color: colors.textSecondary,
            fontSize: typography.fontSizes.sm,
            marginTop: spacing.xs,
            textAlign: 'center',
          },
        ]}
      >
        {description || defaultDescription}
      </Text>
      {onAction && actionLabel ? (
        <View style={{ marginTop: spacing.lg, width: '100%', maxWidth: 220 }}>
          <Button
            label={actionLabel}
            onPress={onAction}
            variant={state === 'error' ? 'primary' : 'secondary'}
            size="md"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {},
  description: {
    maxWidth: 300,
  },
});
