import { useRouter } from 'expo-router';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  List,
} from 'lucide-react-native';
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
  startOfDay,
} from '../components/ExamKit';

/** Month index counted from year 0, so months compare and step easily. */
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();

/** One colour for every paper, in the list pills and on the calendar. */
const EXAM_COLOR = { bg: '#EDE9FE', fg: '#5016A8' };
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
/** Short subject names that fit in a calendar day. */
const SHORT_SUBJECT: Record<string, string> = {
  Mathematics: 'Maths',
  Science: 'Sci',
  English: 'Eng',
  'Social Science': 'SST',
  Computer: 'Comp',
};
const shortSubject = (s: string) => SHORT_SUBJECT[s] ?? s.slice(0, 5);
const sameDay = (a: Date, b: Date) => startOfDay(a) === startOfDay(b);

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

  const [calendarView, setCalendarView] = useState(false);
  const [picked, setPicked] = useState<Date | null>(null);

  const inMonth = exams.filter((e) => monthKey(e.date) === month);
  const canPrev = month > firstMonth;
  const canNext = month < lastMonth;
  const openExam = (exam: MockExamSlot) => router.push(comingSoon(`${exam.subject} exam`));

  // Calendar view: the picked day, else the next exam in this month, else its first exam.
  const selected =
    picked && monthKey(picked) === month
      ? picked
      : (inMonth.find((e) => startOfDay(e.date) >= startOfDay(today)) ?? inMonth[0])?.date;
  const selectedExams = selected ? inMonth.filter((e) => sameDay(e.date, selected)) : [];

  const year = Math.floor(month / 12);
  const m = month % 12;
  const cells: (Date | null)[] = [
    ...Array.from({ length: new Date(year, m, 1).getDay() }, () => null),
    ...Array.from(
      { length: new Date(year, m + 1, 0).getDate() },
      (_, i) => new Date(year, m, i + 1),
    ),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <ExamHeader
        title="Exam"
        testID="exam-timetable"
        right={
          <Pressable
            testID="exam-timetable-view"
            accessibilityRole="button"
            accessibilityLabel={calendarView ? 'Show list' : 'Show calendar'}
            onPress={() => setCalendarView((v) => !v)}
            style={[styles.viewButton, calendarView && styles.viewButtonActive]}
          >
            {calendarView ? (
              <List size={20} color="#5016A8" />
            ) : (
              <CalendarDays size={20} color="#111827" />
            )}
          </Pressable>
        }
      />

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

      {calendarView ? (
        <>
          <View style={styles.calendar} testID="exam-calendar">
            <View style={styles.week}>
              {WEEKDAYS.map((d, i) => (
                <Text key={`${d}-${i}`} style={styles.weekday}>
                  {d}
                </Text>
              ))}
            </View>
            {weeks.map((week, w) => (
              <View key={w} style={styles.week}>
                {week.map((day, i) => {
                  if (!day) return <View key={`e-${w}-${i}`} style={styles.dayCell} />;
                  const dayExams = inMonth.filter((e) => sameDay(e.date, day));
                  const isSelected = selected ? sameDay(day, selected) : false;
                  const first = dayExams[0];
                  const color = first ? EXAM_COLOR : null;
                  return (
                    <Pressable
                      key={day.getDate()}
                      testID={`exam-day-${day.getDate()}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${day.getDate()} ${LONG_MONTHS[m]}${
                        first ? `, ${dayExams.map((e) => e.subject).join(', ')} exam` : ''
                      }`}
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => setPicked(day)}
                      style={[
                        styles.dayCell,
                        color && {
                          backgroundColor: color.bg,
                          borderWidth: 1.5,
                          borderColor: color.fg,
                        },
                        sameDay(day, today) && !color && styles.dayToday,
                        isSelected && styles.daySelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          color && { color: color.fg, fontFamily: fonts.bold },
                          isSelected && styles.dayTextSelected,
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                      {first && color ? (
                        <View
                          style={[
                            styles.dayChip,
                            { backgroundColor: isSelected ? '#FFFFFF' : color.fg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayChipText,
                              { color: isSelected ? '#5016A8' : '#FFFFFF' },
                            ]}
                            numberOfLines={1}
                          >
                            {shortSubject(first.subject)}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>

          <Text style={styles.selectedTitle}>
            {selected
              ? `${SHORT_DAYS[selected.getDay()]}, ${selected.getDate()} ${SHORT_MONTHS[selected.getMonth()]}`
              : 'No exams this month'}
          </Text>
          <View style={styles.list}>
            {selected && selectedExams.length === 0 ? (
              <Text style={styles.noExam}>No exam on this day</Text>
            ) : (
              selectedExams.map((exam) => (
                <ExamCard
                  key={exam.id}
                  exam={exam}
                  pill={EXAM_COLOR}
                  onPress={() => openExam(exam)}
                />
              ))
            )}
          </View>
        </>
      ) : inMonth.length === 0 ? (
        <StateView state="empty" title="No exams this month" />
      ) : (
        <View style={styles.list}>
          {inMonth.map((exam) => (
            <ExamCard key={exam.id} exam={exam} pill={EXAM_COLOR} onPress={() => openExam(exam)} />
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
  viewButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  viewButtonActive: { backgroundColor: '#F1EBFD' },
  calendar: {
    marginHorizontal: 16,
    padding: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F1F4',
  },
  week: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: fonts.semibold,
    paddingVertical: 6,
  },
  dayCell: {
    flex: 1,
    minHeight: 50,
    alignItems: 'center',
    paddingTop: 5,
    margin: 1,
    borderRadius: 10,
  },
  daySelected: { backgroundColor: '#5016A8', borderColor: '#5016A8' },
  dayToday: { borderWidth: 1.5, borderColor: '#5016A8' },
  dayText: { color: '#111827', fontSize: 12.5, fontFamily: fonts.medium },
  dayTextSelected: { color: '#FFFFFF', fontFamily: fonts.bold },
  dayChip: {
    marginTop: 3,
    maxWidth: '94%',
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 5,
  },
  dayChipText: { fontSize: 8.5, fontFamily: fonts.bold },
  selectedTitle: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    color: '#111827',
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  noExam: { color: '#6B7280', fontSize: 12, fontFamily: fonts.regular },
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
