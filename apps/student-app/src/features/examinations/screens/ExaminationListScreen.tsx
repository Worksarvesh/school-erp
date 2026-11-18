import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Badge, Button, StateView, useTheme } from '@school-erp/ui';
import type { ExamScheduleDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services';

export function ExaminationListScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();

  const [exams, setExams] = useState<ExamScheduleDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MockStudentServices.getExamSchedules()
      .then(setExams)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen
      header={<Header title="Examinations & Results" showBack onBack={() => router.back()} />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
    >
      {/* Latest Published Result Banner */}
      <Card variant="elevated" style={[styles.resultBanner, { backgroundColor: colors.primary }]}>
        <Text style={{ color: '#BFDBFE', fontSize: typography.fontSizes.xs }}>
          Published Assessment
        </Text>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: typography.fontSizes.lg,
            fontWeight: '700',
            marginVertical: 2,
          }}
        >
          Mid-Term Assessment 2026
        </Text>
        <Text
          style={{ color: '#E0E7FF', fontSize: typography.fontSizes.xs, marginBottom: spacing.sm }}
        >
          Score: 89.6% • Grade A1
        </Text>
        <Button
          label="View Official Report Card"
          variant="secondary"
          size="sm"
          onPress={() => router.push('/examinations/results')}
        />
      </Card>

      <Text
        style={[
          styles.sectionTitle,
          {
            color: colors.text,
            fontSize: typography.fontSizes.base,
            fontWeight: '700',
            marginVertical: spacing.md,
          },
        ]}
      >
        Exam Schedules & Timetables
      </Text>

      {loading ? (
        <StateView state="loading" title="Loading exam schedules..." />
      ) : (
        exams.map((exam) => (
          <Card key={exam.id} variant="outlined" style={styles.examCard}>
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.examTitle,
                  { color: colors.text, fontSize: typography.fontSizes.base, fontWeight: '600' },
                ]}
              >
                {exam.title}
              </Text>
              <Badge
                label={exam.status.toUpperCase()}
                variant={
                  exam.status === 'upcoming'
                    ? 'info'
                    : exam.status === 'ongoing'
                      ? 'warning'
                      : 'success'
                }
                size="sm"
              />
            </View>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.fontSizes.xs,
                marginTop: 4,
              }}
            >
              Dates: {exam.startDate} to {exam.endDate}
            </Text>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  resultBanner: {
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
  },
  sectionTitle: {},
  examCard: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  examTitle: {
    flex: 1,
    marginRight: 8,
  },
});
