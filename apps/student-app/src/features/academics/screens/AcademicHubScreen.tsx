import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, useTheme } from '@school-erp/ui';

interface AcademicOption {
  title: string;
  description: string;
  route: Href;
  icon: string;
}

const academicOptions: AcademicOption[] = [
  {
    title: 'Daily & Weekly Timetable',
    description: 'Check period timings, classrooms, and subject teachers',
    route: '/timetable',
    icon: '🗓️',
  },
  {
    title: 'Attendance Records',
    description: 'View monthly attendance logs and session percentage',
    route: '/attendance',
    icon: '📊',
  },
  {
    title: 'Homework & Assignments',
    description: 'Track assigned tasks, deadlines, and completion status',
    route: '/homework',
    icon: '📝',
  },
  {
    title: 'Examinations & Results',
    description: 'Access exam datesheets, term marks, and grade report cards',
    route: '/examinations',
    icon: '🏆',
  },
  {
    title: 'Syllabus Tracker',
    description: 'Subject-wise curriculum progress and chapter checklists',
    route: '/syllabus',
    icon: '📚',
  },
];

export function AcademicHubScreen() {
  const { colors, spacing, typography } = useTheme();
  const router = useRouter();

  return (
    <Screen
      header={<Header title="Academic Hub" />}
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
        Access your curriculum, schedules, performance records, and daily academic tasks.
      </Text>

      {academicOptions.map((opt) => (
        <Card
          key={opt.title}
          variant="elevated"
          onPress={() => router.push(opt.route)}
          style={styles.card}
        >
          <View style={styles.row}>
            <Text style={styles.icon}>{opt.icon}</Text>
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <Text
                style={[
                  styles.title,
                  { color: colors.text, fontSize: typography.fontSizes.base, fontWeight: '700' },
                ]}
              >
                {opt.title}
              </Text>
              <Text
                style={[
                  styles.desc,
                  { color: colors.textSecondary, fontSize: typography.fontSizes.xs, marginTop: 2 },
                ]}
              >
                {opt.description}
              </Text>
            </View>
            <Text style={{ color: colors.primary, fontSize: 18, marginLeft: spacing.sm }}>→</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 28,
  },
  title: {},
  desc: {},
});
