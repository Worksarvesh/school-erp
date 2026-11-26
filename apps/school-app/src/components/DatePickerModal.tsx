import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';

const BLUE = '#1D4ED8';
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
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

interface Props {
  visible: boolean;
  value: Date | null;
  /** Days before this or after `maxDate` cannot be picked. */
  minDate: Date;
  maxDate: Date;
  title: string;
  onSelect: (date: Date) => void;
  onClose: () => void;
}

/**
 * Calendar in a pop-up. Arrows move one month; tapping the "Month Year" title shows a list of
 * years, so a birth year is a couple of taps away. Works the same on phone and web.
 */
export function DatePickerModal(props: Props) {
  // Remount on every open so the calendar starts on the current value.
  return (
    <Modal visible={props.visible} transparent animationType="fade" onRequestClose={props.onClose}>
      {props.visible ? <Calendar {...props} /> : null}
    </Modal>
  );
}

function Calendar({ value, minDate, maxDate, title, onSelect, onClose }: Props) {
  const start = value ?? maxDate;
  const [month, setMonth] = useState(new Date(start.getFullYear(), start.getMonth(), 1));
  const [pickingYear, setPickingYear] = useState(false);

  const year = month.getFullYear();
  const index = month.getMonth();
  const firstWeekday = new Date(year, index, 1).getDay();
  const days = new Date(year, index + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const canPrev = new Date(year, index, 0) >= minDate;
  const canNext = new Date(year, index + 1, 1) <= maxDate;

  const years: number[] = [];
  for (let y = maxDate.getFullYear(); y >= minDate.getFullYear(); y -= 1) years.push(y);

  /** Keeps the month inside the allowed range after a year change. */
  const chooseYear = (y: number) => {
    let next = new Date(y, index, 1);
    if (next > maxDate) next = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
    if (new Date(y, index + 1, 0) < minDate) {
      next = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    }
    setMonth(next);
    setPickingYear(false);
  };

  const isSelected = (day: number) =>
    !!value &&
    value.getFullYear() === year &&
    value.getMonth() === index &&
    value.getDate() === day;

  return (
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.card} accessibilityViewIsModal onPress={() => undefined}>
        <Text style={styles.heading}>{title}</Text>

        <View style={styles.nav}>
          <Pressable
            testID="cal-prev"
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            disabled={!canPrev || pickingYear}
            hitSlop={8}
            onPress={() => setMonth(new Date(year, index - 1, 1))}
            style={[styles.arrow, (!canPrev || pickingYear) && styles.faded]}
          >
            <ChevronLeft size={22} color="#222233" />
          </Pressable>
          <Pressable
            testID="cal-title"
            accessibilityRole="button"
            accessibilityLabel="Choose year"
            onPress={() => setPickingYear((v) => !v)}
            style={styles.monthButton}
          >
            <Text style={styles.monthText}>
              {MONTHS[index]} {year}
            </Text>
            <ChevronDown size={18} color={BLUE} />
          </Pressable>
          <Pressable
            testID="cal-next"
            accessibilityRole="button"
            accessibilityLabel="Next month"
            disabled={!canNext || pickingYear}
            hitSlop={8}
            onPress={() => setMonth(new Date(year, index + 1, 1))}
            style={[styles.arrow, (!canNext || pickingYear) && styles.faded]}
          >
            <ChevronRight size={22} color="#222233" />
          </Pressable>
        </View>

        {pickingYear ? (
          <ScrollView style={styles.yearList} contentContainerStyle={styles.yearGrid}>
            {years.map((y) => (
              <Pressable
                key={y}
                testID={`cal-year-${y}`}
                accessibilityRole="button"
                onPress={() => chooseYear(y)}
                style={[styles.yearCell, y === year && styles.cellSelected]}
              >
                <Text style={[styles.yearText, y === year && styles.cellTextSelected]}>{y}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View>
            <View style={styles.week}>
              {WEEKDAYS.map((d) => (
                <Text key={d} style={styles.weekday}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.grid}>
              {cells.map((day, i) => {
                if (!day) return <View key={`e${i}`} style={styles.cell} />;
                const date = new Date(year, index, day);
                const disabled = date < minDate || date > maxDate;
                const selected = isSelected(day);
                return (
                  <View key={day} style={styles.cell}>
                    <Pressable
                      testID={`cal-day-${day}`}
                      accessibilityRole="button"
                      accessibilityLabel={`${day} ${MONTHS[index]} ${year}`}
                      accessibilityState={{ disabled, selected }}
                      disabled={disabled}
                      onPress={() => onSelect(date)}
                      style={[styles.day, selected && styles.cellSelected]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          disabled && styles.dayDisabled,
                          selected && styles.cellTextSelected,
                        ]}
                      >
                        {day}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <Pressable
          testID="cal-cancel"
          accessibilityRole="button"
          onPress={onClose}
          style={styles.cancel}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  heading: { color: '#555566', fontSize: 13, marginBottom: 8 },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  faded: { opacity: 0.25 },
  monthButton: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 36 },
  monthText: { color: '#111111', fontSize: 17, fontWeight: '700' },
  week: { flexDirection: 'row', marginTop: 8 },
  weekday: { flex: 1, textAlign: 'center', color: '#8A8A99', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  cell: { width: `${100 / 7}%`, height: 40, alignItems: 'center', justifyContent: 'center' },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayText: { color: '#222233', fontSize: 14 },
  dayDisabled: { color: '#C4C4CC' },
  cellSelected: { backgroundColor: BLUE },
  cellTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  yearList: { height: 264, marginTop: 8 },
  yearGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  yearCell: {
    width: '25%',
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearText: { color: '#222233', fontSize: 15 },
  cancel: { alignSelf: 'flex-end', paddingHorizontal: 12, paddingVertical: 8, marginTop: 8 },
  cancelText: { color: BLUE, fontSize: 15, fontWeight: '600' },
});
