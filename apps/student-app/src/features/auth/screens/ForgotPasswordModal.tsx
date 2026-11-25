import React from 'react';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Button, useTheme, StyleSheet, Text } from '@school-erp/ui';

export function ForgotPasswordModal() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();

  return (
    <Screen
      header={<Header title="Reset Password" showBack onBack={() => router.back()} />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
    >
      <Card variant="outlined" style={{ padding: spacing.lg, marginVertical: spacing.md }}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: typography.fontSizes.lg,
              fontWeight: typography.fontWeights.semibold,
              marginBottom: spacing.sm,
            },
          ]}
        >
          School-Admin Managed Recovery
        </Text>
        <Text
          style={[
            styles.body,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSizes.base,
              lineHeight: typography.lineHeights.relaxed,
              marginBottom: spacing.base,
            },
          ]}
        >
          In accordance with school security policies, student passwords are managed directly by
          your school institution. Self-serve online password resets are not enabled for student
          accounts.
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color: colors.text,
              fontSize: typography.fontSizes.base,
              fontWeight: typography.fontWeights.medium,
              marginBottom: spacing.xs,
            },
          ]}
        >
          How to get your password reset:
        </Text>
        <Text
          style={[
            styles.listItem,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSizes.sm,
              lineHeight: typography.lineHeights.normal,
              marginBottom: spacing.xs,
            },
          ]}
        >
          1. Contact your Class Teacher or School Administrative Office during school hours.
        </Text>
        <Text
          style={[
            styles.listItem,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSizes.sm,
              lineHeight: typography.lineHeights.normal,
              marginBottom: spacing.xs,
            },
          ]}
        >
          2. Provide your Admission Number and School Roll Number for identity verification.
        </Text>
        <Text
          style={[
            styles.listItem,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSizes.sm,
              lineHeight: typography.lineHeights.normal,
            },
          ]}
        >
          3. Your administrator will issue a temporary password for your account.
        </Text>
      </Card>

      <Button
        label="Return to Sign In"
        variant="primary"
        size="lg"
        onPress={() => router.back()}
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {},
  subtitle: {},
  body: {},
  listItem: {},
});
