import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Card, StateView, useTheme } from '@school-erp/ui';
import type { TimetableSlotDto } from '@school-erp/api-client';
import { MockStudentServices } from '../../../core/mocks/mock-services.js';

const DAYS = [
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export function TimetableScreen() {
  const { colors, spacing, typography, radii } = useTheme();
  const router = useRouter();

  const [selectedDay, setSelectedDay] = useState(1);
  const [slots, setSlots] = useState<TimetableSlotDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSlots = async (day: number) => {
    try {
      setLoading(true);
      const data = await MockStudentServices.getTimetable(day);
      setSlots(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots(selectedDay);
  }, [selectedDay]);

  return (
    <Screen
      header={<Header title="Class Timetable" showBack onBack={() => router.back()} />}
      scrollable
      contentContainerStyle={{ padding: spacing.base }}
    >
      {/* Day Selector */}
      <View style={[styles.dayRow, { marginBottom: spacing.base }]}>
        {DAYS.map((day) => {
          const isSelected = selectedDay === day.value;
          return (
            <TouchableOpacity
              key={day.value}
              onPress={() => setSelectedDay(day.value)}
              style={[
                styles.dayButton,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surfaceSubtle,
                  borderRadius: radii.md,
                  paddingVertical: spacing.xs,
                  paddingHorizontal: spacing.sm,
                },
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={{
                  color: isSelected ? '#FFFFFF' : colors.text,
                  fontWeight: isSelected ? '700' : '500',
                  fontSize: typography.fontSizes.sm,
                }}
              >
                {day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <StateView state="loading" title="Loading timetable..." />
      ) : slots.length === 0 ? (
        <StateView
          state="empty"
          title="No classes scheduled"
          description="No timetable entries for this day."
        />
      ) : (
        slots.map((slot) => (
          <Card key={slot.id} variant="elevated" style={styles.slotCard}>
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.periodBadge,
                  { backgroundColor: colors.surfaceSubtle, borderRadius: radii.sm },
                ]}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontWeight: '700',
                    fontSize: typography.fontSizes.xs,
                  }}
                >
                  Period {slot.periodNumber}
                </Text>
              </View>
              <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
                {slot.startTime} - {slot.endTime}
              </Text>
            </View>

            <Text
              style={[
                styles.subject,
                {
                  color: colors.text,
                  fontSize: typography.fontSizes.base,
                  fontWeight: '700',
                  marginTop: 4,
                },
              ]}
            >
              {slot.subjectName}
            </Text>

            <View style={styles.footerRow}>
              <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
                Teacher: {slot.teacherName}
              </Text>
              {slot.roomNumber ? (
                <Text style={{ color: colors.textSecondary, fontSize: typography.fontSizes.xs }}>
                  {slot.roomNumber}
                </Text>
              ) : null}
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    minWidth: 44,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotCard: {
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  subject: {},
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
});
