import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen, useTheme, type ThemeContextValue } from '@school-erp/ui';
import { AttendanceInsights } from '@/features/attendance/components/AttendanceInsights';
import { ACADEMIC_YEAR_START, mockDayStatus, type DayStatus } from '@/mock/attendance';
import { fonts } from '@/theme/fonts';

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
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_LABEL: Record<DayStatus, string> = {
  present: 'Present',
  absent: 'Absent',
  holiday: 'Holiday',
};
const DOT_COLOR: Record<DayStatus, string> = {
  present: '#16A34A',
  absent: '#E11D2E',
  holiday: '#2F80ED',
};
const STATUS_PILL: Record<DayStatus, { fg: string; bg: string; border: string }> = {
  present: { fg: '#15803D', bg: '#DCFCE7', border: '#86EFAC' },
  absent: { fg: '#B91C1C', bg: '#FEE2E2', border: '#FCA5A5' },
  holiday: { fg: '#1D4ED8', bg: '#DBEAFE', border: '#93C5FD' },
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** 6 x 7 grid of dates for the month view, starting on Sunday (days of other months included). */
export function monthGrid(month: Date): Date[] {
  const first = firstOfMonth(month);
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const weeks = Math.ceil((first.getDay() + lastDay) / 7);
  return Array.from(
    { length: weeks * 7 },
    (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i),
  );
}

/** All 12 months of the calendar year (January to December), in order. */
export function pickerMonths(): Date[] {
  return Array.from({ length: 12 }, (_, i) => new Date(ACADEMIC_YEAR_START.getFullYear(), i, 1));
}

const monthLabel = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const shortDate = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;

/**
 * Attendance, built to the approved design: month picker on a lavender band, month calendar with
 * the status of the chosen day, and the Weekly / Monthly / Yearly ring with chart.
 * MOCK data only.
 */
export function AttendanceDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const today = useMemo(() => startOfDay(new Date()), []);
  const [month, setMonth] = useState(() => firstOfMonth(today));
  const [selected, setSelected] = useState(today);
  const [pickerOpen, setPickerOpen] = useState(false);

  const months = useMemo(() => pickerMonths(), []);
  const grid = useMemo(() => monthGrid(month), [month]);
  const canPrev = firstOfMonth(month) > (months[0] ?? ACADEMIC_YEAR_START);
  const lastMonth = months[months.length - 1] ?? firstOfMonth(today);
  const canNext = firstOfMonth(month) < lastMonth;
  const selectedStatus = mockDayStatus(selected, today);

  const showMonth = (m: Date) => {
    setMonth(firstOfMonth(m));
    setPickerOpen(false);
  };
  const shiftMonth = (delta: number) =>
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <View style={styles.band} />

      <View style={styles.header}>
        <Pressable
          testID="attendance-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.headerButton}
        >
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Attendance
        </Text>
        <View style={styles.headerButton} />
      </View>

      <Pressable
        testID="month-picker"
        accessibilityRole="button"
        accessibilityLabel={`Month: ${monthLabel(month)}`}
        accessibilityHint="Opens a list of months"
        onPress={() => setPickerOpen(true)}
        style={({ pressed }) => [styles.monthPill, pressed && styles.pressed]}
      >
        <CalendarDays size={16} color={colors.primary} />
        <Text style={styles.monthPillText}>{monthLabel(month)}</Text>
        <ChevronDown size={16} color={colors.textSecondary} />
      </Pressable>

      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <Pressable
            testID="month-prev"
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            disabled={!canPrev}
            onPress={() => shiftMonth(-1)}
            style={[styles.arrow, !canPrev && styles.arrowDisabled]}
          >
            <ChevronLeft size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.calendarTitle}>{monthLabel(month)}</Text>
          <Pressable
            testID="month-next"
            accessibilityRole="button"
            accessibilityLabel="Next month"
            disabled={!canNext}
            onPress={() => shiftMonth(1)}
            style={[styles.arrow, !canNext && styles.arrowDisabled]}
          >
            <ChevronRight size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAYS.map((w) => (
            <Text key={w} style={styles.weekday}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {grid.map((d) => {
            const inMonth = d.getMonth() === month.getMonth();
            const status = inMonth ? mockDayStatus(d, today) : null;
            const isSelected = inMonth && d.getTime() === selected.getTime();
            const isToday = inMonth && d.getTime() === today.getTime();
            return (
              <Pressable
                key={d.getTime()}
                testID={inMonth ? `day-${d.getDate()}` : undefined}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled: !inMonth }}
                accessibilityLabel={`${shortDate(d)}${status ? `, ${STATUS_LABEL[status]}` : ''}`}
                disabled={!inMonth}
                onPress={() => setSelected(d)}
                style={styles.cell}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isToday && styles.dayCircleToday,
                    isSelected && styles.dayCircleSelected,
                  ]}
                >
                  <Text
                    allowFontScaling={false}
                    style={[
                      styles.dayText,
                      !inMonth && styles.dayTextMuted,
                      isSelected && styles.dayTextSelected,
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.dot,
                    status ? { backgroundColor: DOT_COLOR[status] } : styles.dotNone,
                  ]}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.legendRow}>
          {(['present', 'absent', 'holiday'] as const).map((k) => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: DOT_COLOR[k] }]} />
              <Text style={styles.legendText}>{STATUS_LABEL[k]}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.statusCard} testID="attendance-status">
        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>Attendance Status</Text>
          <Text style={styles.statusDate}>({shortDate(selected)})</Text>
        </View>
        {selectedStatus ? (
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: STATUS_PILL[selectedStatus].bg,
                borderColor: STATUS_PILL[selectedStatus].border,
              },
            ]}
          >
            <CircleCheck size={16} color={STATUS_PILL[selectedStatus].fg} />
            <Text style={[styles.statusPillText, { color: STATUS_PILL[selectedStatus].fg }]}>
              {STATUS_LABEL[selectedStatus]}
            </Text>
          </View>
        ) : (
          <View style={[styles.statusPill, styles.statusPillNone]}>
            <Text style={[styles.statusPillText, { color: colors.textSecondary }]}>Not marked</Text>
          </View>
        )}
      </View>

      <View style={styles.summary}>
        <AttendanceInsights selected={selected} month={month} today={today} />
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Close month list"
          onPress={() => setPickerOpen(false)}
        />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <Text style={styles.sheetTitle}>Select month</Text>
          <ScrollView>
            {months.map((m) => {
              const active = m.getTime() === month.getTime();
              const isCurrent = m.getTime() === firstOfMonth(today).getTime();
              return (
                <Pressable
                  key={m.getTime()}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => showMonth(m)}
                  style={styles.sheetOption}
                >
                  <Text
                    style={[
                      styles.sheetOptionText,
                      (active || isCurrent) && styles.sheetOptionActive,
                      isCurrent && styles.sheetOptionCurrent,
                    ]}
                  >
                    {monthLabel(m)}
                  </Text>
                  {active ? <Check size={18} color={colors.primary} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

function makeStyles({ colors, spacing, radii }: ThemeContextValue) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
    pressed: { opacity: 0.75 },
    band: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      height: 230,
      backgroundColor: '#EEE7FB',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { color: colors.primary, fontSize: 22, fontFamily: fonts.semibold },
    monthPill: {
      marginTop: spacing.lg,
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 36,
      paddingHorizontal: spacing.md,
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
    },
    monthPillText: { color: colors.text, fontSize: 13, fontFamily: fonts.semibold },
    calendarCard: {
      marginTop: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: spacing.base,
      shadowColor: '#4B18AA',
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    calendarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    arrow: {
      width: 32,
      height: 32,
      borderRadius: radii.full,
      backgroundColor: '#F4F4F5',
      alignItems: 'center',
      justifyContent: 'center',
    },
    arrowDisabled: { opacity: 0.35 },
    calendarTitle: { color: colors.text, fontSize: 16, fontFamily: fonts.bold },
    weekRow: { flexDirection: 'row', marginTop: spacing.md },
    weekday: {
      width: `${100 / 7}%`,
      textAlign: 'center',
      color: colors.textSecondary,
      fontSize: 12,
      fontFamily: fonts.medium,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: spacing.xs },
    cell: {
      width: `${100 / 7}%`,
      alignItems: 'center',
      paddingVertical: 4,
      minHeight: 56,
    },
    dayCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
    dotNone: { backgroundColor: 'transparent' },
    legendRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { color: colors.text, fontSize: 12, fontFamily: fonts.medium },
    dayCircleToday: { borderWidth: 1.5, borderColor: colors.primary },
    dayCircleSelected: { backgroundColor: colors.primary },
    dayText: {
      color: colors.text,
      fontSize: 15,
      lineHeight: 20,
      textAlign: 'center',
      includeFontPadding: false,
      fontFamily: fonts.medium,
    },
    dayTextMuted: { color: '#C4C4CC' },
    dayTextSelected: { color: colors.primaryForeground, fontFamily: fonts.semibold },
    statusCard: {
      marginTop: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      padding: spacing.base,
      borderRadius: radii.xl,
      backgroundColor: '#F4EFFC',
      borderWidth: 1,
      borderColor: '#E2D6F7',
    },
    statusText: { flex: 1 },
    statusTitle: { color: colors.text, fontSize: 15, fontFamily: fonts.bold },
    statusDate: {
      color: colors.textSecondary,
      fontSize: 12,
      fontFamily: fonts.medium,
      marginTop: 2,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radii.md,
      borderWidth: 1,
    },
    statusPillNone: { backgroundColor: '#F4F4F5', borderColor: '#E4E4E7' },
    statusPillText: { fontSize: 13, fontFamily: fonts.semibold },
    summary: { marginTop: spacing.md },
    backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
    sheet: {
      maxHeight: '88%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      paddingHorizontal: spacing.base,
      paddingTop: spacing.base,
    },
    sheetTitle: {
      color: colors.text,
      fontSize: 16,
      fontFamily: fonts.bold,
      marginBottom: spacing.sm,
    },
    sheetOption: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sheetOptionText: { color: colors.text, fontSize: 15, fontFamily: fonts.medium },
    sheetOptionCurrent: { fontFamily: fonts.bold },
    sheetOptionActive: { color: colors.primary, fontFamily: fonts.semibold },
  });
}
