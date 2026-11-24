import { CalendarDays, ChevronLeft, ChevronRight, List } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts } from '@/theme/fonts';
import { LONG_MONTHS, SHORT_DAYS, SHORT_MONTHS, formatTimeRange, startOfDay } from './ExamKit';

/** Month index counted from year 0, so months compare and step easily. */
const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth();
const sameDay = (a: Date, b: Date) => startOfDay(a) === startOfDay(b);
/** "Wed, 25 Nov". */
export const dayLabel = (d: Date) =>
  `${SHORT_DAYS[d.getDay()]}, ${d.getDate()} ${SHORT_MONTHS[d.getMonth()]}`;

const PURPLE = '#5016A8';
const DAY_BG = '#EDE9FE';
const MUTED = '#9CA3AF';
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

interface CalendarItem {
  date: Date;
  subject: string;
}

/**
 * Month and selected-day state for an exam calendar. `next` is the first item from today on; the
 * calendar opens on its month. The selected day is the picked one, else the next item in the
 * month, else its first item.
 */
export function useExamCalendar<T extends CalendarItem>(sorted: readonly T[], today: Date) {
  const firstMonth = sorted[0] ? monthKey(sorted[0].date) : monthKey(today);
  const last = sorted[sorted.length - 1];
  const lastMonth = last ? monthKey(last.date) : monthKey(today);
  const next = sorted.find((e) => startOfDay(e.date) >= startOfDay(today));
  const [month, setMonth] = useState(() =>
    next ? monthKey(next.date) : Math.min(Math.max(monthKey(today), firstMonth), lastMonth),
  );
  const [picked, setPicked] = useState<Date | null>(null);

  const inMonth = sorted.filter((e) => monthKey(e.date) === month);
  const selected =
    picked && monthKey(picked) === month
      ? picked
      : (inMonth.find((e) => startOfDay(e.date) >= startOfDay(today)) ?? inMonth[0])?.date;
  return {
    next,
    month,
    setMonth,
    canPrev: month > firstMonth,
    canNext: month < lastMonth,
    inMonth,
    selected,
    selectedItems: selected ? inMonth.filter((e) => sameDay(e.date, selected)) : [],
    setPicked,
  };
}

/** Header button that switches between the list and the calendar. */
export function CalendarToggle({
  on,
  onToggle,
  testID,
}: {
  on: boolean;
  onToggle: () => void;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={on ? 'Show list' : 'Show calendar'}
      onPress={onToggle}
      style={[styles.toggle, on && styles.toggleOn]}
    >
      {on ? <List size={20} color={PURPLE} /> : <CalendarDays size={20} color="#111827" />}
    </Pressable>
  );
}

/** "‹ November 2026 ›" month switcher. */
export function MonthSwitcher({
  month,
  canPrev,
  canNext,
  onChange,
  testID,
}: {
  month: number;
  canPrev: boolean;
  canNext: boolean;
  onChange: (month: number) => void;
  testID: string;
}) {
  return (
    <View style={styles.monthRow}>
      <Pressable
        testID={`${testID}-prev`}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        accessibilityState={{ disabled: !canPrev }}
        disabled={!canPrev}
        onPress={() => onChange(month - 1)}
        style={styles.arrow}
      >
        <ChevronLeft size={18} color={canPrev ? '#111827' : '#D1D5DB'} />
      </Pressable>
      <Text style={styles.monthText}>
        {LONG_MONTHS[month % 12]} {Math.floor(month / 12)}
      </Text>
      <Pressable
        testID={`${testID}-next`}
        accessibilityRole="button"
        accessibilityLabel="Next month"
        accessibilityState={{ disabled: !canNext }}
        disabled={!canNext}
        onPress={() => onChange(month + 1)}
        style={styles.arrow}
      >
        <ChevronRight size={18} color={canNext ? '#111827' : '#D1D5DB'} />
      </Pressable>
    </View>
  );
}

/** Compact month grid: upcoming exam days are tinted, past ones greyed; tapping a day selects it. */
export function ExamMonthGrid({
  month,
  today,
  items,
  selected,
  onSelect,
  label,
}: {
  month: number;
  today: Date;
  items: readonly CalendarItem[];
  selected: Date | undefined;
  onSelect: (day: Date) => void;
  /** Word after the subject in a day's accessibility label, e.g. "exam" or "unit test". */
  label: string;
}) {
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
            const dayItems = items.filter((e) => sameDay(e.date, day));
            const isSelected = selected ? sameDay(day, selected) : false;
            const first = dayItems[0];
            const past = startOfDay(day) < startOfDay(today);
            return (
              <Pressable
                key={day.getDate()}
                testID={`exam-day-${day.getDate()}`}
                accessibilityRole="button"
                accessibilityLabel={`${day.getDate()} ${LONG_MONTHS[m]}${
                  first ? `, ${dayItems.map((e) => e.subject).join(', ')} ${label}` : ''
                }`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(day)}
                style={[
                  styles.dayCell,
                  first && !past && styles.dayExam,
                  first && past && styles.dayDone,
                  sameDay(day, today) && styles.dayToday,
                  isSelected && styles.daySelected,
                ]}
              >
                <Text
                  style={[
                    styles.dayText,
                    first && (past ? styles.dayTextDone : styles.dayTextExam),
                    isSelected && styles.dayTextSelected,
                  ]}
                >
                  {day.getDate()}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/** "Next paper" countdown card: title, day and time, and days left (Today / 1 day / N days). */
export function NextPaperCard({
  title,
  paper,
  today,
}: {
  title: string;
  paper: { date: Date; start: number; end: number };
  today: Date;
}) {
  const days = Math.round((startOfDay(paper.date) - startOfDay(today)) / 86_400_000);
  const count = days === 0 ? 'Today' : String(days);
  const unit = days === 0 ? '' : days === 1 ? 'day' : 'days';
  const when = `${dayLabel(paper.date)} · ${formatTimeRange(paper.start, paper.end)}`;
  return (
    <View
      style={styles.next}
      testID="next-paper"
      accessible
      accessibilityLabel={`Next paper ${title}, ${when}, ${days === 0 ? 'today' : `in ${days} ${unit}`}`}
    >
      <View style={styles.nextText}>
        <Text style={styles.nextLabel}>Next paper</Text>
        <Text style={styles.nextTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.nextWhen}>{when}</Text>
      </View>
      <View style={styles.nextCount}>
        <Text style={styles.nextCountValue}>{count}</Text>
        {unit ? <Text style={styles.nextCountUnit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  toggleOn: { backgroundColor: '#F1EBFD' },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  arrow: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  monthText: { color: '#111827', fontSize: 14.5, fontFamily: fonts.bold },
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
    color: MUTED,
    fontSize: 11,
    fontFamily: fonts.semibold,
    paddingVertical: 6,
  },
  dayCell: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
    borderRadius: 9,
  },
  dayExam: { backgroundColor: DAY_BG },
  dayDone: { backgroundColor: '#F3F4F6' },
  daySelected: { backgroundColor: PURPLE, borderWidth: 0 },
  dayToday: { borderWidth: 1.5, borderColor: PURPLE },
  dayText: { color: '#111827', fontSize: 12.5, fontFamily: fonts.medium },
  dayTextExam: { color: PURPLE, fontFamily: fonts.bold },
  dayTextDone: { color: MUTED, fontFamily: fonts.semibold },
  dayTextSelected: { color: '#FFFFFF', fontFamily: fonts.bold },
  next: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    backgroundColor: PURPLE,
  },
  nextText: { flex: 1 },
  nextLabel: { color: '#D9CCF7', fontSize: 11, fontFamily: fonts.medium },
  nextTitle: { color: '#FFFFFF', fontSize: 15, fontFamily: fonts.bold, marginTop: 1 },
  nextWhen: { color: '#D9CCF7', fontSize: 11.5, fontFamily: fonts.regular, marginTop: 2 },
  nextCount: {
    minWidth: 58,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#3B0F8C',
    alignItems: 'center',
  },
  nextCountValue: { color: '#FFFFFF', fontSize: 20, lineHeight: 24, fontFamily: fonts.bold },
  nextCountUnit: { color: '#D9CCF7', fontSize: 10.5, fontFamily: fonts.medium },
});
