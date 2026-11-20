import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Clock, FileText } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, StateView } from '@school-erp/ui';
import { comingSoon } from '@/features/dashboard/quickActions';
import { mockExamTimetable, type MockExamSlot } from '@/mock/exams';
import { fonts } from '@/theme/fonts';
import {
  ExamHeader,
  LONG_MONTHS,
  SHORT_DAYS,
  SHORT_MONTHS,
  formatTimeRange,
  pillColors,
  startOfDay,
} from '../components/ExamKit';

/** Month index counted from year 0, so months compare and step easily. */
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();

/** Order in which the design colours the "Main Exam" pills: red, blue, purple, green. */
const PILL_ORDER = [0, 4, 1, 2, 3];

/**
 * Exam timetable, built to the approved design: month switcher and one card per exam with date,
 * subject, exam type, time and marks. Opens on the month of the next exam. MOCK data only.
 */
export function ExamTimetableScreen() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const exams = useMemo(
    () => mockExamTimetable(today).sort((a, b) => a.date.getTime() - b.date.getTime()),
    [today],
  );

  const first = exams[0];
  const last = exams[exams.length - 1];
  const firstMonth = first ? monthKey(first.date) : monthKey(today);
  const lastMonth = last ? monthKey(last.date) : monthKey(today);
  const nextExam = exams.find((e) => startOfDay(e.date) >= startOfDay(today));
  const [month, setMonth] = useState(() =>
    nextExam ? monthKey(nextExam.date) : Math.min(Math.max(monthKey(today), firstMonth), lastMonth),
  );

  const inMonth = exams.filter((e) => monthKey(e.date) === month);
  const canPrev = month > firstMonth;
  const canNext = month < lastMonth;

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <ExamHeader title="Exam" testID="exam-timetable" />

      <View style={styles.monthRow}>
        <Pressable
          testID="exam-timetable-prev"
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          accessibilityState={{ disabled: !canPrev }}
          disabled={!canPrev}
          onPress={() => setMonth((m) => m - 1)}
          style={styles.arrow}
        >
          <ChevronLeft size={18} color={canPrev ? '#111827' : '#D1D5DB'} />
        </Pressable>
        <Text style={styles.monthText}>
          {LONG_MONTHS[month % 12]} {Math.floor(month / 12)}
        </Text>
        <Pressable
          testID="exam-timetable-next"
          accessibilityRole="button"
          accessibilityLabel="Next month"
          accessibilityState={{ disabled: !canNext }}
          disabled={!canNext}
          onPress={() => setMonth((m) => m + 1)}
          style={styles.arrow}
        >
          <ChevronRight size={18} color={canNext ? '#111827' : '#D1D5DB'} />
        </Pressable>
      </View>

      {inMonth.length === 0 ? (
        <StateView state="empty" title="No exams this month" />
      ) : (
        <View style={styles.list}>
          {inMonth.map((exam, i) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              pill={pillColors(PILL_ORDER[i % PILL_ORDER.length] ?? 0)}
              onPress={() => router.push(comingSoon(`${exam.subject} exam`))}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function ExamCard({
  exam,
  pill,
  onPress,
}: {
  exam: MockExamSlot;
  pill: { bg: string; fg: string };
  onPress: () => void;
}) {
  return (
    <Pressable
      testID={`exam-${exam.id}`}
      accessibilityRole="button"
      accessibilityLabel={`${exam.subject}, ${exam.kind}, ${exam.date.getDate()} ${
        SHORT_MONTHS[exam.date.getMonth()]
      }`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.dateCol}>
        <Text style={styles.dateDay}>{exam.date.getDate()}</Text>
        <Text style={styles.dateMonth}>{SHORT_MONTHS[exam.date.getMonth()]}</Text>
        <Text style={styles.dateWeekday}>{SHORT_DAYS[exam.date.getDay()]}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.subject} numberOfLines={1}>
            {exam.subject}
          </Text>
          <View style={[styles.pill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.pillText, { color: pill.fg }]}>{exam.kind}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Clock size={12} color="#6B7280" />
          <Text style={styles.meta}>{formatTimeRange(exam.start, exam.end)}</Text>
        </View>
        <View style={styles.metaRow}>
          <FileText size={12} color="#6B7280" />
          <Text style={styles.meta}>{exam.maxMarks} Marks</Text>
        </View>
      </View>
      <ChevronRight size={16} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  arrow: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  monthText: { color: '#111827', fontSize: 14, fontFamily: fonts.semibold },
  list: { paddingHorizontal: 16, paddingTop: 4, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
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
  dateCol: { width: 40, alignItems: 'center' },
  dateDay: { color: '#111827', fontSize: 20, lineHeight: 24, fontFamily: fonts.bold },
  dateMonth: { color: '#111827', fontSize: 11, fontFamily: fonts.semibold },
  dateWeekday: { color: '#9CA3AF', fontSize: 10, fontFamily: fonts.regular, marginTop: 2 },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: '#EEF0F3', marginHorizontal: 12 },
  body: { flex: 1, gap: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subject: { flexShrink: 1, color: '#111827', fontSize: 14, fontFamily: fonts.bold },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 9, fontFamily: fonts.semibold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { color: '#6B7280', fontSize: 11, fontFamily: fonts.regular },
});
