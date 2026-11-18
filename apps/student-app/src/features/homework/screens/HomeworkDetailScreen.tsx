import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, Header, Card, Badge, StateView, useTheme } from '@school-erp/ui';
import type { HomeworkDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services.js';

export function HomeworkDetailScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();

  const [detail, setDetail] = useState<HomeworkDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      MockStudentServices.getHomeworkDetail(params.id)
        .then(setDetail)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return (
      <Screen header={<Header title="Homework Details" showBack onBack={() => router.back()} />}>
        <StateView state="loading" title="Loading assignment..." />
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen header={<Header title="Homework Details" showBack onBack={() => router.back()} />}>
        <StateView
          state="error"
          title="Assignment not found"
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header title={detail.subjectName} showBack onBack={() => router.back()} />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
    >
      <Card variant="elevated" style={styles.card}>
        <View style={styles.badgeRow}>
          <Badge label={detail.subjectName} variant="info" size="sm" />
          <Badge
            label={detail.status === 'completed' ? 'Completed' : 'Pending'}
            variant={detail.status === 'completed' ? 'success' : 'warning'}
            size="sm"
          />
        </View>

        <Text
          style={[
            styles.title,
            {
              color: colors.text,
              fontSize: typography.fontSizes.lg,
              fontWeight: '700',
              marginVertical: spacing.sm,
            },
          ]}
        >
          {detail.title}
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSizes.sm,
            lineHeight: typography.lineHeights.relaxed,
          }}
        >
          {detail.description}
        </Text>

        <View
          style={[
            styles.metaBox,
            {
              backgroundColor: colors.surfaceSubtle,
              marginTop: spacing.base,
              padding: spacing.md,
              borderRadius: 8,
            },
          ]}
        >
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.fontSizes.xs,
              marginBottom: 4,
            }}
          >
            Teacher:{' '}
            <Text style={{ color: colors.text, fontWeight: '600' }}>{detail.teacherName}</Text>
          </Text>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: typography.fontSizes.xs,
              marginBottom: 4,
            }}
          >
            Assigned Date:{' '}
            <Text style={{ color: colors.text, fontWeight: '600' }}>{detail.assignedDate}</Text>
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
            Submission Due:{' '}
            <Text style={{ color: colors.error, fontWeight: '600' }}>{detail.dueDate}</Text>
          </Text>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: {},
  metaBox: {},
});
