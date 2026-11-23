import {
  BookMarked,
  BookOpen,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react-native';
import { useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '@/theme/fonts';
import { sameDay } from '../submissions';

const PURPLE = '#5016A8';
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Bottom sheet with a dimmed backdrop that closes it. */
export function BottomSheet({
  visible,
  onClose,
  title,
  testID,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  testID: string;
  children: ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        accessibilityRole="button"
        accessibilityLabel={`Close ${title}`}
        onPress={onClose}
      />
      <SafeAreaView edges={['bottom']} style={styles.sheet} testID={testID}>
        <View style={styles.handle} />
        <Text style={styles.sheetTitle}>{title}</Text>
        {children}
      </SafeAreaView>
    </Modal>
  );
}

export type FilterKind = 'calendar' | 'subject' | 'chapter';

const MENU: readonly { key: FilterKind; label: string; hint: string; icon: LucideIcon }[] = [
  { key: 'calendar', label: 'Calendar', hint: 'Assignments due on a date', icon: CalendarDays },
  { key: 'subject', label: 'Subject', hint: 'Assignments of one subject', icon: BookOpen },
  { key: 'chapter', label: 'Chapter', hint: 'Assignments of one chapter', icon: BookMarked },
];

/** The ☰ menu: choose to filter by calendar date, subject or chapter. */
export function FilterMenuSheet({
  visible,
  onClose,
  onPick,
  active,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (kind: FilterKind) => void;
  active?: FilterKind;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filter by" testID="assignment-menu">
      {MENU.map(({ key, label, hint, icon: Icon }) => {
        const on = key === active;
        return (
          <Pressable
            key={key}
            testID={`assignment-menu-${key}`}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${label}`}
            onPress={() => onPick(key)}
            style={styles.menuRow}
          >
            <View style={[styles.menuIcon, on && styles.menuIconActive]}>
              <Icon size={18} color={on ? '#FFFFFF' : PURPLE} />
            </View>
            <View style={styles.menuText}>
              <Text style={[styles.optionText, on && styles.optionActive]}>{label}</Text>
              <Text style={styles.optionSub}>{hint}</Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </Pressable>
        );
      })}
    </BottomSheet>
  );
}

/** A list of choices (subjects or chapters) with the current one ticked. */
export function OptionSheet({
  visible,
  onClose,
  title,
  testID,
  options,
  selected,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  testID: string;
  options: readonly { value: string; label: string; sub?: string }[];
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title} testID={testID}>
      <ScrollView style={styles.optionList}>
        {options.map((o) => {
          const on = o.value === selected;
          return (
            <Pressable
              key={o.value}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onSelect(o.value)}
              style={styles.option}
            >
              <View style={styles.menuText}>
                <Text style={[styles.optionText, on && styles.optionActive]}>{o.label}</Text>
                {o.sub ? <Text style={styles.optionSub}>{o.sub}</Text> : null}
              </View>
              {on ? <Check size={18} color={PURPLE} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </BottomSheet>
  );
}

/**
 * Month calendar to pick a due date. Days that have an assignment due carry a dot; the chosen day
 * is filled purple and today is outlined.
 */
export function CalendarSheet({
  visible,
  onClose,
  today,
  selected,
  markedDays,
  onSelect,
  onClear,
}: {
  visible: boolean;
  onClose: () => void;
  today: Date;
  selected?: Date;
  /** Days with at least one assignment due. */
  markedDays: readonly Date[];
  onSelect: (date: Date) => void;
  onClear: () => void;
}) {
  const start = selected ?? today;
  const [month, setMonth] = useState(() => new Date(start.getFullYear(), start.getMonth(), 1));

  const year = month.getFullYear();
  const m = month.getMonth();
  const firstWeekday = new Date(year, m, 1).getDay();
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, m, i + 1)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7));

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Select due date"
      testID="assignment-calendar-sheet"
    >
      <View style={styles.monthRow}>
        <Pressable
          testID="assignment-calendar-prev"
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() => setMonth(new Date(year, m - 1, 1))}
          style={styles.monthArrow}
        >
          <ChevronLeft size={18} color="#111827" />
        </Pressable>
        <Text style={styles.monthText}>
          {MONTHS[m]} {year}
        </Text>
        <Pressable
          testID="assignment-calendar-next"
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() => setMonth(new Date(year, m + 1, 1))}
          style={styles.monthArrow}
        >
          <ChevronRight size={18} color="#111827" />
        </Pressable>
      </View>

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
            const isSelected = selected ? sameDay(day, selected) : false;
            const isToday = sameDay(day, today);
            const marked = markedDays.some((d) => sameDay(d, day));
            return (
              <Pressable
                key={day.getDate()}
                testID={`assignment-day-${day.getDate()}`}
                accessibilityRole="button"
                accessibilityLabel={`${day.getDate()} ${MONTHS[m]}${marked ? ', assignment due' : ''}`}
                accessibilityState={{ selected: isSelected }}
                onPress={() => onSelect(day)}
                style={styles.dayCell}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isToday && styles.dayToday,
                    isSelected && styles.daySelected,
                  ]}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {day.getDate()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.dot,
                    marked && (isSelected ? styles.dotOnSelected : styles.dotVisible),
                  ]}
                />
              </Pressable>
            );
          })}
        </View>
      ))}

      <View style={styles.calendarFooter}>
        <View style={styles.legend}>
          <View style={[styles.dot, styles.dotVisible]} />
          <Text style={styles.legendText}>Assignment due</Text>
        </View>
        <Pressable
          testID="assignment-calendar-clear"
          accessibilityRole="button"
          accessibilityLabel="Show all dates"
          onPress={onClear}
          hitSlop={10}
        >
          <Text style={styles.clearText}>Show all dates</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
    marginBottom: 10,
  },
  sheetTitle: { color: '#111827', fontSize: 16, fontFamily: fonts.bold, marginBottom: 6 },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F4',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1EBFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIconActive: { backgroundColor: PURPLE },
  menuText: { flex: 1 },
  optionList: { maxHeight: 360 },
  option: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F4',
  },
  optionText: { color: '#111827', fontSize: 15, fontFamily: fonts.medium },
  optionActive: { color: PURPLE, fontFamily: fonts.semibold },
  optionSub: { color: '#6B7280', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  monthArrow: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: '#F4F5F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthText: { color: '#111827', fontSize: 15, fontFamily: fonts.semibold },
  week: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: fonts.semibold,
    paddingVertical: 6,
  },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: 2, minHeight: 44 },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: { borderWidth: 1.5, borderColor: PURPLE },
  daySelected: { backgroundColor: PURPLE, borderColor: PURPLE },
  dayText: { color: '#111827', fontSize: 13, fontFamily: fonts.medium },
  dayTextSelected: { color: '#FFFFFF', fontFamily: fonts.bold },
  dot: { width: 5, height: 5, borderRadius: 999, marginTop: 1, backgroundColor: 'transparent' },
  dotVisible: { backgroundColor: '#E8466D' },
  dotOnSelected: { backgroundColor: '#E8466D' },
  calendarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F1F4',
  },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { color: '#6B7280', fontSize: 11, fontFamily: fonts.regular },
  clearText: { color: PURPLE, fontSize: 13, fontFamily: fonts.semibold },
});
