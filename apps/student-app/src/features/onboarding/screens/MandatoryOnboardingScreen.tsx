import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Button, useTheme, StyleSheet, Text } from '@school-erp/ui';
import { useAuthStore } from '@school-erp/mobile-core';

export function MandatoryOnboardingScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleComplete = async () => {
    setIsSubmitting(true);
    await completeOnboarding();
    setIsSubmitting(false);
    router.replace('/(tabs)');
  };

  return (
    <Screen
      header={<Header title="Welcome to School Portal" />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
    >
      <Card variant="outlined" style={{ padding: spacing.lg, marginVertical: spacing.md }}>
        <Text
          style={[
            styles.title,
            {
              color: colors.primary,
              fontSize: typography.fontSizes.xl,
              fontWeight: typography.fontWeights.bold,
              marginBottom: spacing.xs,
            },
          ]}
        >
          Welcome to Your Student Portal!
        </Text>
        <Text
          style={[
            styles.body,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSizes.sm,
              lineHeight: typography.lineHeights.normal,
              marginBottom: spacing.base,
            },
          ]}
        >
          Your school portal provides direct access to your daily timetable, attendance records,
          homework assignments, examination schedules, official circulars, and school notices.
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
          Student Code of Conduct & Guidelines:
        </Text>
        <Text
          style={[
            styles.item,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSizes.sm,
              lineHeight: typography.lineHeights.normal,
              marginBottom: spacing.xs,
            },
          ]}
        >
          • Check your daily schedule and homework tasks regularly.
        </Text>
        <Text
          style={[
            styles.item,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSizes.sm,
              lineHeight: typography.lineHeights.normal,
              marginBottom: spacing.xs,
            },
          ]}
        >
          • Keep your school credentials secure and do not share them.
        </Text>
        <Text
          style={[
            styles.item,
            {
              color: colors.textSecondary,
              fontSize: typography.fontSizes.sm,
              lineHeight: typography.lineHeights.normal,
            },
          ]}
        >
          • Important notices and attendance updates will be posted here.
        </Text>
      </Card>

      <Button
        label="Accept & Proceed to Dashboard"
        onPress={handleComplete}
        loading={isSubmitting}
        size="lg"
        style={{ marginTop: spacing.base }}
        testID="onboarding-accept-button"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {},
  subtitle: {},
  body: {},
  item: {},
});
