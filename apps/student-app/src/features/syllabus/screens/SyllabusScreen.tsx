import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Badge, StateView, useTheme } from '@school-erp/ui';
import type { SyllabusSubjectDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services.js';

export function SyllabusScreen() {
  const { colors, spacing, typography, radii } = useTheme();
  const router = useRouter();

  const [syllabusList, setSyllabusList] = useState<SyllabusSubjectDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MockStudentServices.getSyllabus()
      .then(setSyllabusList)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Screen
      header={<Header title="Syllabus Tracker" showBack onBack={() => router.back()} />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
    >
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.fontSizes.sm,
          marginBottom: spacing.md,
        }}
      >
        Curriculum progress and chapter completion checklists for the current academic session.
      </Text>

      {loading ? (
        <StateView state="loading" title="Loading syllabus..." />
      ) : (
        syllabusList.map((subject) => (
          <Card key={subject.id} variant="elevated" style={styles.subjectCard}>
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.subjectTitle,
                  { color: colors.text, fontSize: typography.fontSizes.base, fontWeight: '700' },
                ]}
              >
                {subject.subjectName}
              </Text>
              <Badge
                label={`${subject.completionPercentage}% Completed`}
                variant="info"
                size="sm"
              />
            </View>

            {/* Progress Bar */}
            <View
              style={[
                styles.progressTrack,
                {
                  backgroundColor: colors.surfaceSubtle,
                  borderRadius: radii.full,
                  marginVertical: spacing.sm,
                },
              ]}
            >
              <View
                style={[
                  styles.progressBar,
                  {
                    backgroundColor: colors.primary,
                    borderRadius: radii.full,
                    width: `${subject.completionPercentage}%`,
                  },
                ]}
              />
            </View>

            <View style={{ marginTop: spacing.xs }}>
              {subject.topics.map((topic) => (
                <View key={topic.id} style={styles.topicRow}>
                  <Text
                    style={{
                      color: topic.isCompleted ? colors.success : colors.textMuted,
                      marginRight: 8,
                      fontSize: 14,
                    }}
                  >
                    {topic.isCompleted ? '✓' : '○'}
                  </Text>
                  <Text
                    style={{
                      color: topic.isCompleted ? colors.textSecondary : colors.text,
                      fontSize: typography.fontSizes.xs,
                      flex: 1,
                      textDecorationLine: topic.isCompleted ? 'line-through' : 'none',
                    }}
                  >
                    {topic.title}
                  </Text>
                  {topic.expectedDate ? (
                    <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                      Est: {topic.expectedDate}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  subjectCard: {
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectTitle: {},
  progressTrack: {
    height: 8,
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
  },
});
