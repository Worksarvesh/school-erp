import { Clock, FileText } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Screen, StateView, StyleSheet, Text, scaled } from '@school-erp/ui';
import { mockExamTimetable, type MockExamSlot } from '@/mock/exams';
import { fonts } from '@/theme/fonts';
import {
  CalendarToggle,
  ExamMonthGrid,
  MonthSwitcher,
  NextPaperCard,
  dayLabel,
  useExamCalendar,
} from '../components/ExamCalendar';
import { ExamHeader, SHORT_DAYS, SHORT_MONTHS, formatTimeRange } from '../components/ExamKit';

/** One colour for every paper pill. */
const EXAM_COLOR = { bg: '#EDE9FE', fg: '#5016A8' };

/**
 * Exam timetable, built to the approved design: month switcher and one card per exam with date,
 * subject, exam type, time and marks. Opens on the month of the next exam. MOCK data only.
 */
export function ExamTimetableScreen() {
  const today = useMemo(() => new Date(), []);
  const exams = useMemo(
    () => mockExamTimetable(today).sort((a, b) => a.date.getTime() - b.date.getTime()),
    [today],
  );

  const cal = useExamCalendar(exams, today);
  const [calendarView, setCalendarView] = useState(false);

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <ExamHeader
        title="Exam Timetable"
        testID="exam-timetable"
        right={
          <CalendarToggle
            on={calendarView}
            onToggle={() => setCalendarView((v) => !v)}
            testID="exam-timetable-view"
          />
        }
      />

      {calendarView && cal.next ? (
        <NextPaperCard
          title={`${cal.next.subject} · ${cal.next.kind}`}
          paper={cal.next}
          today={today}
        />
      ) : null}

      <MonthSwitcher
        month={cal.month}
        canPrev={cal.canPrev}
        canNext={cal.canNext}
        onChange={cal.setMonth}
        testID="exam-timetable"
      />

      {calendarView ? (
        <>
          <ExamMonthGrid
            month={cal.month}
            today={today}
            items={cal.inMonth}
            selected={cal.selected}
            onSelect={cal.setPicked}
            label="exam"
          />

          <Text style={styles.selectedTitle}>
            {cal.selected ? dayLabel(cal.selected) : 'No exams this month'}
          </Text>
          <View style={styles.list}>
            {cal.selected && cal.selectedItems.length === 0 ? (
              <Text style={styles.noExam}>No exam on this day</Text>
            ) : (
              cal.selectedItems.map((exam) => (
                <ExamCard key={exam.id} exam={exam} pill={EXAM_COLOR} />
              ))
            )}
          </View>
        </>
      ) : cal.inMonth.length === 0 ? (
        <StateView state="empty" title="No exams this month" />
      ) : (
        <View style={styles.list}>
          {cal.inMonth.map((exam) => (
            <ExamCard key={exam.id} exam={exam} pill={EXAM_COLOR} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function ExamCard({ exam, pill }: { exam: MockExamSlot; pill: { bg: string; fg: string } }) {
  return (
    <View
      testID={`exam-${exam.id}`}
      accessibilityLabel={`${exam.subject}, ${exam.kind}, ${exam.date.getDate()} ${
        SHORT_MONTHS[exam.date.getMonth()]
      }`}
      style={styles.card}
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
          <Clock size={scaled(12)} color="#6B7280" />
          <Text style={styles.meta}>{formatTimeRange(exam.start, exam.end)}</Text>
        </View>
        <View style={styles.metaRow}>
          <FileText size={scaled(12)} color="#6B7280" />
          <Text style={styles.meta}>{exam.maxMarks} Marks</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  selectedTitle: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    color: '#111827',
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  noExam: { color: '#6B7280', fontSize: 12, fontFamily: fonts.regular },
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
  dateCol: { width: 40, alignItems: 'center' },
  dateDay: { color: '#111827', fontSize: 20, lineHeight: 24, fontFamily: fonts.semibold },
  dateMonth: { color: '#111827', fontSize: 11, fontFamily: fonts.bold },
  dateWeekday: { color: '#9CA3AF', fontSize: 10, fontFamily: fonts.regular, marginTop: 2 },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: '#EEF0F3', marginHorizontal: 12 },
  body: { flex: 1, gap: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subject: { flexShrink: 1, color: '#111827', fontSize: 14, fontFamily: fonts.semibold },
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 9, fontFamily: fonts.semibold },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { color: '#6B7280', fontSize: 11, fontFamily: fonts.regular },
});
