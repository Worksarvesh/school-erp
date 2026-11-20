import { useRouter } from 'expo-router';
import { CalendarDays, ChevronRight, Clock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, StateView } from '@school-erp/ui';
import { comingSoon } from '@/features/dashboard/quickActions';
import { mockUnitTests, type MockUnitTest } from '@/mock/exams';
import { fonts } from '@/theme/fonts';
import {
  ExamHeader,
  SHORT_DAYS,
  SHORT_MONTHS,
  formatTimeRange,
  pillColors,
  startOfDay,
} from '../components/ExamKit';

type Filter = 'upcoming' | 'completed' | 'all';

const FILTERS: readonly { key: Filter; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All' },
];
const SEGMENT_BLUE = '#1D63ED';
const COMPLETED_PILL = { bg: '#DCFCE7', fg: '#16A34A' };

/** Completed: the date has passed or marks are in. Upcoming: everything else. */
export function isCompleted(t: MockUnitTest, today: Date): boolean {
  return t.obtained !== undefined || startOfDay(t.date) < startOfDay(today);
}

/**
 * Unit tests, built to the approved design: Upcoming / Completed / All switch and one card per
 * test with a date box, status pill, subject, time and maximum marks. Completed tests also show
 * the marks scored. MOCK data only.
 */
export function UnitTestsScreen() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const tests = useMemo(() => mockUnitTests(today), [today]);
  const [filter, setFilter] = useState<Filter>('upcoming');

  const visible = tests
    .filter((t) => filter === 'all' || isCompleted(t, today) === (filter === 'completed'))
    .sort((a, b) =>
      filter === 'completed'
        ? b.date.getTime() - a.date.getTime()
        : a.date.getTime() - b.date.getTime(),
    );

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <ExamHeader title="Unit Test" testID="unit-tests" />

      <View style={styles.segment} accessibilityRole="tablist">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              testID={`unit-tests-${f.key}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(f.key)}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <StateView state="empty" title="No unit tests" />
      ) : (
        <View style={styles.list}>
          {visible.map((t, i) => {
            const done = isCompleted(t, today);
            const pill = done ? COMPLETED_PILL : pillColors(i);
            return (
              <Pressable
                key={t.id}
                testID={`unit-test-${t.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${t.name}, ${t.subject}, ${done ? 'Completed' : 'Upcoming'}`}
                onPress={() => router.push(comingSoon(`${t.subject} ${t.name}`))}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.dateBox}>
                  <Text style={styles.dateDay}>{String(t.date.getDate()).padStart(2, '0')}</Text>
                  <Text style={styles.dateMonth}>{SHORT_MONTHS[t.date.getMonth()]}</Text>
                  <Text style={styles.dateWeekday}>{SHORT_DAYS[t.date.getDay()]}</Text>
                </View>
                <View style={styles.body}>
                  <View style={styles.titleRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {t.name}
                    </Text>
                    <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                      <Text style={[styles.pillText, { color: pill.fg }]}>
                        {done ? 'Completed' : 'Upcoming'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.subject}>{t.subject}</Text>
                  <View style={styles.metaRow}>
                    <Clock size={11} color="#6B7280" />
                    <Text style={styles.meta}>{formatTimeRange(t.start, t.end)}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <CalendarDays size={11} color="#6B7280" />
                    <Text style={styles.meta}>
                      {t.obtained !== undefined
                        ? `Marks: ${t.obtained} / ${t.maxMarks}`
                        : `Max Marks: ${t.maxMarks}`}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={18} color="#374151" />
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  segment: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  segmentItem: {
    flex: 1,
    minHeight: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentItemActive: { backgroundColor: SEGMENT_BLUE },
  segmentText: { color: '#4B5563', fontSize: 12, fontFamily: fonts.medium },
  segmentTextActive: { color: '#FFFFFF', fontFamily: fonts.semibold },
  list: { paddingHorizontal: 16, paddingTop: 14, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F1F4',
    shadowColor: '#1F2937',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: { backgroundColor: '#FAFAFB' },
  dateBox: {
    width: 42,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  dateDay: { color: '#111827', fontSize: 16, lineHeight: 20, fontFamily: fonts.bold },
  dateMonth: { color: '#6B7280', fontSize: 10, fontFamily: fonts.medium },
  dateWeekday: { color: '#6B7280', fontSize: 10, fontFamily: fonts.regular },
  body: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, color: '#111827', fontSize: 13, fontFamily: fonts.semibold },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 9, fontFamily: fonts.semibold },
  subject: { color: '#6B7280', fontSize: 11, fontFamily: fonts.regular },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { color: '#6B7280', fontSize: 10, fontFamily: fonts.regular },
});
