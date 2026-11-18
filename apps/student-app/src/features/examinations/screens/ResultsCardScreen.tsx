import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Badge, StateView, useTheme } from '@school-erp/ui';
import type { ExamResultDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services.js';

export function ResultsCardScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();

  const [result, setResult] = useState<ExamResultDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MockStudentServices.getExamResult('result-midterm-2026')
      .then(setResult)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Screen
        header={<Header title="Official Report Card" showBack onBack={() => router.back()} />}
      >
        <StateView state="loading" title="Loading report card..." />
      </Screen>
    );
  }

  if (!result) {
    return (
      <Screen
        header={<Header title="Official Report Card" showBack onBack={() => router.back()} />}
      >
        <StateView
          state="error"
          title="Report card not available"
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={<Header title="Official Report Card" showBack onBack={() => router.back()} />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
    >
      <Card variant="elevated" style={styles.summaryCard}>
        <Text
          style={[
            styles.examTitle,
            { color: colors.text, fontSize: typography.fontSizes.lg, fontWeight: '700' },
          ]}
        >
          {result.examTitle}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSizes.xs,
            marginBottom: spacing.md,
          }}
        >
          {result.term} • Session {result.academicYear}
        </Text>

        <View
          style={[
            styles.statsRow,
            { backgroundColor: colors.surfaceSubtle, padding: spacing.md, borderRadius: 8 },
          ]}
        >
          <View>
            <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
              Total Score
            </Text>
            <Text
              style={{
                color: colors.primary,
                fontSize: typography.fontSizes.xl,
                fontWeight: '700',
              }}
            >
              {result.totalMarks} / {result.maxTotalMarks}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
              Grade & Percentage
            </Text>
            <Text
              style={{
                color: colors.success,
                fontSize: typography.fontSizes.xl,
                fontWeight: '700',
              }}
            >
              {result.percentage}% ({result.grade})
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.subjectHeader,
            {
              color: colors.text,
              fontSize: typography.fontSizes.base,
              fontWeight: '700',
              marginTop: spacing.lg,
              marginBottom: spacing.sm,
            },
          ]}
        >
          Subject Breakdown
        </Text>

        {result.subjects.map((sub) => (
          <View
            key={sub.subjectName}
            style={[styles.subjectRow, { borderBottomColor: colors.border }]}
          >
            <Text
              style={{
                color: colors.text,
                fontWeight: '600',
                fontSize: typography.fontSizes.sm,
                flex: 1,
              }}
            >
              {sub.subjectName}
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: typography.fontSizes.sm,
                marginRight: spacing.md,
              }}
            >
              {sub.marksObtained}/{sub.maxMarks}
            </Text>
            {sub.grade ? <Badge label={sub.grade} variant="success" size="sm" /> : null}
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    padding: 16,
  },
  examTitle: {},
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectHeader: {},
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
