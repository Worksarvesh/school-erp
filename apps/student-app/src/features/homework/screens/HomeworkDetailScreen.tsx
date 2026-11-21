import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen, Card, Button, StateView, useTheme } from '@school-erp/ui';
import type { HomeworkDto } from '@school-erp/api-client';
import { ProfileTopBar } from '../../profile/components/ProfileTopBar';
import { PagesCarousel } from '../components/PagesCarousel';
import { MockStudentServices } from '../../../core/mocks/mock-services.js';

/** Larger status chip than the shared Badge (its biggest size is still small for this screen). */
function Pill({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

/**
 * Homework detail: pages carousel, then subject, status, title, description, assigned by,
 * assigned date and due date, and a "Done" button that marks the homework completed (on screen
 * only for now). MOCK data only.
 */
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

  const markDone = () => setDetail((d) => (d ? { ...d, status: 'completed' } : d));
  const back = () => (router.canGoBack() ? router.back() : router.replace('/homework'));
  const header = <ProfileTopBar title="Homework" onBack={back} />;

  if (loading) {
    return (
      <Screen header={header}>
        <StateView state="loading" title="Loading assignment..." />
      </Screen>
    );
  }

  if (!detail) {
    return (
      <Screen header={header}>
        <StateView
          state="error"
          title="Assignment not found"
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const done = detail.status === 'completed';
  const label = { color: colors.textSecondary, fontSize: typography.fontSizes.sm };
  const value = { color: colors.text, fontWeight: '600' as const };

  return (
    <Screen header={header} scrollable contentContainerStyle={{ padding: spacing.base }}>
      <View style={{ marginBottom: spacing.base }}>
        <PagesCarousel title={detail.title} />
      </View>

      <Card variant="elevated" style={styles.card}>
        <View style={styles.badges}>
          <Pill label={detail.subjectName} bg={colors.infoBg} color={colors.info} />
          <Pill
            label={done ? 'Completed' : 'Pending'}
            bg={done ? colors.successBg : colors.errorBg}
            color={done ? colors.success : colors.error}
          />
        </View>

        <Text
          style={{
            color: colors.text,
            fontSize: typography.fontSizes.lg,
            fontWeight: '700',
            marginTop: spacing.md,
          }}
        >
          {detail.title}
        </Text>

        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSizes.sm,
            lineHeight: typography.lineHeights.relaxed,
            marginTop: spacing.sm,
          }}
        >
          {detail.description}
        </Text>

        <View
          style={{
            backgroundColor: colors.surfaceSubtle,
            marginTop: spacing.base,
            paddingVertical: spacing.base,
            paddingHorizontal: spacing.base,
            borderRadius: 10,
            gap: 12,
          }}
        >
          <Text style={label}>
            Assigned by - <Text style={value}>{detail.teacherName}</Text>
          </Text>
          <Text style={label}>
            Assigned Date: <Text style={value}>{detail.assignedDate}</Text>
          </Text>
          <Text style={label}>
            Submission Due: <Text style={[value, { color: colors.error }]}>{detail.dueDate}</Text>
          </Text>
        </View>
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <Button
          testID="done-homework"
          label={done ? 'Done ✓' : 'Done'}
          size="lg"
          disabled={done}
          onPress={markDone}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  badges: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pill: { borderRadius: 999, paddingVertical: 6, paddingHorizontal: 14 },
  pillText: { fontSize: 16, fontWeight: '600' },
});
