import React, { useEffect, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Badge, StateView, useTheme, StyleSheet, Text } from '@school-erp/ui';
import type {
  StudentRecordDto,
  AttendanceSummaryDto,
  TimetableSlotDto,
  HomeworkDto,
  NoticeDto,
} from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services.js';

export function DashboardScreen() {
  const { colors, spacing, typography, radii } = useTheme();
  const router = useRouter();

  const [student, setStudent] = useState<StudentRecordDto | null>(null);
  const [attendance, setAttendance] = useState<AttendanceSummaryDto | null>(null);
  const [timetable, setTimetable] = useState<TimetableSlotDto[]>([]);
  const [homework, setHomework] = useState<HomeworkDto[]>([]);
  const [notices, setNotices] = useState<NoticeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [stu, att, tt, hw, not] = await Promise.all([
        MockStudentServices.getStudentRecord(),
        MockStudentServices.getAttendanceSummary(),
        MockStudentServices.getTimetable(1), // Monday
        MockStudentServices.getHomeworkList(),
        MockStudentServices.getNotices(),
      ]);
      setStudent(stu);
      setAttendance(att);
      setTimetable(tt.slice(0, 3)); // Top 3
      setHomework(hw.filter((h) => h.status === 'pending').slice(0, 2));
      setNotices(not.slice(0, 2));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Screen header={<Header title="Student Home" />}>
        <StateView state="loading" title="Loading your dashboard..." />
      </Screen>
    );
  }

  if (error || !student) {
    return (
      <Screen header={<Header title="Student Home" />}>
        <StateView
          state="error"
          title="Could not load dashboard"
          description={error || undefined}
          actionLabel="Try Again"
          onAction={loadDashboardData}
        />
      </Screen>
    );
  }

  return (
    <Screen
      header={
        <Header
          title="Student Home"
          subtitle={`${student.className} • ${student.sectionName}`}
          rightAction={
            <TouchableOpacity
              onPress={() => router.push('/notifications')}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="View notifications"
              style={styles.notifButton}
            >
              <Text style={{ fontSize: 20 }}>🔔</Text>
            </TouchableOpacity>
          }
        />
      }
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
      onRefresh={loadDashboardData}
      refreshing={loading}
    >
      {/* Student Greeting Card */}
      <Card
        variant="elevated"
        style={[
          styles.greetingCard,
          {
            backgroundColor: colors.primary,
            borderRadius: radii.xl,
            padding: spacing.lg,
          },
        ]}
      >
        <Text style={[styles.greetingSub, { color: '#BFDBFE', fontSize: typography.fontSizes.sm }]}>
          Welcome back,
        </Text>
        <Text
          style={[
            styles.greetingName,
            { color: '#FFFFFF', fontSize: typography.fontSizes['2xl'], fontWeight: '700' },
          ]}
        >
          {student.fullName}
        </Text>
        <View style={styles.badgeRow}>
          <Text style={{ color: '#E0E7FF', fontSize: typography.fontSizes.xs, marginRight: 8 }}>
            Roll No: {student.rollNumber}
          </Text>
          <Text style={{ color: '#E0E7FF', fontSize: typography.fontSizes.xs }}>
            Adm: {student.admissionNumber}
          </Text>
        </View>
      </Card>

      {/* Attendance & Stats Widget */}
      {attendance ? (
        <Card variant="outlined" style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Text
              style={[
                styles.sectionTitle,
                { color: colors.text, fontSize: typography.fontSizes.base, fontWeight: '600' },
              ]}
            >
              Attendance Summary
            </Text>
            <Badge
              label={`${attendance.percentage}% Present`}
              variant={attendance.percentage >= 75 ? 'success' : 'error'}
              size="md"
            />
          </View>
          <Text
            style={[
              styles.statText,
              { color: colors.textSecondary, fontSize: typography.fontSizes.sm, marginTop: 4 },
            ]}
          >
            {attendance.presentDays} days attended out of {attendance.totalDays} academic days.
          </Text>
        </Card>
      ) : null}

      {/* Today's Schedule Preview */}
      <Card variant="outlined" style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: typography.fontSizes.base, fontWeight: '600' },
            ]}
          >
            Today's Schedule
          </Text>
          <TouchableOpacity onPress={() => router.push('/timetable')}>
            <Text
              style={{
                color: colors.primary,
                fontSize: typography.fontSizes.sm,
                fontWeight: '500',
              }}
            >
              View All →
            </Text>
          </TouchableOpacity>
        </View>
        {timetable.map((slot) => (
          <View key={slot.id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
            <View>
              <Text
                style={{ color: colors.text, fontWeight: '600', fontSize: typography.fontSizes.sm }}
              >
                Period {slot.periodNumber}: {slot.subjectName}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
                {slot.teacherName} {slot.roomNumber ? `• ${slot.roomNumber}` : ''}
              </Text>
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
              {slot.startTime}
            </Text>
          </View>
        ))}
      </Card>

      {/* Pending Homework Preview */}
      <Card variant="outlined" style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: typography.fontSizes.base, fontWeight: '600' },
            ]}
          >
            Pending Homework ({homework.length})
          </Text>
          <TouchableOpacity onPress={() => router.push('/homework')}>
            <Text
              style={{
                color: colors.primary,
                fontSize: typography.fontSizes.sm,
                fontWeight: '500',
              }}
            >
              View All →
            </Text>
          </TouchableOpacity>
        </View>
        {homework.length === 0 ? (
          <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.sm }}>
            No pending homework assignments.
          </Text>
        ) : (
          homework.map((hw) => (
            <TouchableOpacity
              key={hw.id}
              onPress={() => router.push({ pathname: '/homework/[id]', params: { id: hw.id } })}
              style={[styles.itemRow, { borderBottomColor: colors.border }]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: '600',
                    fontSize: typography.fontSizes.sm,
                  }}
                >
                  {hw.subjectName}: {hw.title}
                </Text>
                <Text style={{ color: colors.error, fontSize: typography.fontSizes.xs }}>
                  Due by {hw.dueDate}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Recent School Notices */}
      <Card variant="outlined" style={styles.sectionCard}>
        <View style={styles.cardHeaderRow}>
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.text, fontSize: typography.fontSizes.base, fontWeight: '600' },
            ]}
          >
            School Notices
          </Text>
          <TouchableOpacity onPress={() => router.push('/notices')}>
            <Text
              style={{
                color: colors.primary,
                fontSize: typography.fontSizes.sm,
                fontWeight: '500',
              }}
            >
              View All →
            </Text>
          </TouchableOpacity>
        </View>
        {notices.map((notice) => (
          <TouchableOpacity
            key={notice.id}
            onPress={() => router.push({ pathname: '/notices/[id]', params: { id: notice.id } })}
            style={[styles.itemRow, { borderBottomColor: colors.border }]}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{ color: colors.text, fontWeight: '600', fontSize: typography.fontSizes.sm }}
              >
                {notice.title}
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
                {notice.authorName}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  greetingCard: {
    marginBottom: 16,
  },
  greetingSub: {},
  greetingName: {
    marginVertical: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  sectionCard: {
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {},
  statText: {},
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  notifButton: {
    padding: 6,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
