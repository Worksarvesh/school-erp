import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Badge, StateView, useTheme } from '@school-erp/ui';
import type { HomeworkDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services';

export function HomeworkListScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();

  const [homeworkList, setHomeworkList] = useState<HomeworkDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHomework = async () => {
    try {
      setLoading(true);
      const data = await MockStudentServices.getHomeworkList();
      setHomeworkList(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, []);

  return (
    <Screen
      header={<Header title="Homework & Assignments" showBack onBack={() => router.back()} />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
      onRefresh={loadHomework}
      refreshing={loading}
    >
      {loading ? (
        <StateView state="loading" title="Loading homework assignments..." />
      ) : homeworkList.length === 0 ? (
        <StateView
          state="empty"
          title="No assignments"
          description="You have no homework assigned."
        />
      ) : (
        homeworkList.map((hw) => (
          <Card
            key={hw.id}
            variant="elevated"
            onPress={() => router.push({ pathname: '/homework/[id]', params: { id: hw.id } })}
            style={styles.card}
          >
            <View style={styles.cardTop}>
              <Badge label={hw.subjectName} variant="info" size="sm" />
              <Badge
                label={hw.status === 'completed' ? 'Completed' : 'Pending'}
                variant={hw.status === 'completed' ? 'success' : 'warning'}
                size="sm"
              />
            </View>

            <Text
              style={[
                styles.title,
                {
                  color: colors.text,
                  fontSize: typography.fontSizes.base,
                  fontWeight: '700',
                  marginTop: 6,
                },
              ]}
            >
              {hw.title}
            </Text>

            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.fontSizes.xs,
                marginTop: 4,
              }}
              numberOfLines={2}
            >
              {hw.description}
            </Text>

            <View style={styles.cardBottom}>
              <Text style={{ color: colors.textMuted, fontSize: typography.fontSizes.xs }}>
                Assigned: {hw.assignedDate}
              </Text>
              <Text
                style={{
                  color: colors.error,
                  fontSize: typography.fontSizes.xs,
                  fontWeight: '600',
                }}
              >
                Due: {hw.dueDate}
              </Text>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {},
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
});
