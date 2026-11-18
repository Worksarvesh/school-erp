import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, Badge, StateView, useTheme } from '@school-erp/ui';
import type { AttendanceSummaryDto, AttendanceRecordDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services';

export function AttendanceDetailScreen() {
  const { colors, spacing, typography, radii } = useTheme();
  const router = useRouter();

  const [summary, setSummary] = useState<AttendanceSummaryDto | null>(null);
  const [history, setHistory] = useState<AttendanceRecordDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const [sum, rec] = await Promise.all([
        MockStudentServices.getAttendanceSummary(),
        MockStudentServices.getAttendanceHistory(),
      ]);
      setSummary(sum);
      setHistory(rec);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  return (
    <Screen
      header={<Header title="Attendance Record" showBack onBack={() => router.back()} />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
      onRefresh={loadAttendance}
      refreshing={loading}
    >
      {loading ? (
        <StateView state="loading" title="Loading attendance..." />
      ) : summary ? (
        <>
          {/* Summary Card */}
          <Card
            variant="elevated"
            style={[
              styles.summaryCard,
              { backgroundColor: colors.primary, borderRadius: radii.xl },
            ]}
          >
            <Text style={{ color: '#BFDBFE', fontSize: typography.fontSizes.sm }}>
              Academic Session {summary.academicYear}
            </Text>
            <Text
              style={{
                color: '#FFFFFF',
                fontSize: typography.fontSizes['3xl'],
                fontWeight: '700',
                marginVertical: 4,
              }}
            >
              {summary.percentage}%
            </Text>
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={{ color: '#E0E7FF', fontSize: typography.fontSizes.xs }}>
                  Total Working Days
                </Text>
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontWeight: '700',
                    fontSize: typography.fontSizes.base,
                  }}
                >
                  {summary.totalDays}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={{ color: '#E0E7FF', fontSize: typography.fontSizes.xs }}>Present</Text>
                <Text
                  style={{
                    color: '#86EFAC',
                    fontWeight: '700',
                    fontSize: typography.fontSizes.base,
                  }}
                >
                  {summary.presentDays}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={{ color: '#E0E7FF', fontSize: typography.fontSizes.xs }}>Absent</Text>
                <Text
                  style={{
                    color: '#FCA5A5',
                    fontWeight: '700',
                    fontSize: typography.fontSizes.base,
                  }}
                >
                  {summary.absentDays}
                </Text>
              </View>
            </View>
          </Card>

          {/* Recent Attendance Logs */}
          <Text
            style={[
              styles.logTitle,
              {
                color: colors.text,
                fontSize: typography.fontSizes.base,
                fontWeight: '700',
                marginVertical: spacing.md,
              },
            ]}
          >
            Recent Attendance Logs
          </Text>

          {history.map((record) => (
            <Card key={record.date} variant="outlined" style={styles.logCard}>
              <View style={styles.logRow}>
                <View>
                  <Text
                    style={{
                      color: colors.text,
                      fontWeight: '600',
                      fontSize: typography.fontSizes.sm,
                    }}
                  >
                    {record.date}
                  </Text>
                  {record.remarks ? (
                    <Text
                      style={{
                        color: colors.textSecondary,
                        fontSize: typography.fontSizes.xs,
                        marginTop: 2,
                      }}
                    >
                      {record.remarks}
                    </Text>
                  ) : null}
                </View>
                <Badge
                  label={record.status.toUpperCase()}
                  variant={
                    record.status === 'present'
                      ? 'success'
                      : record.status === 'late'
                        ? 'warning'
                        : 'error'
                  }
                  size="sm"
                />
              </View>
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    padding: 20,
    marginBottom: 16,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  metricBox: {
    alignItems: 'center',
  },
  logTitle: {},
  logCard: {
    marginBottom: 8,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
