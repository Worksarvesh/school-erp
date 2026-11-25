import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Screen, useTheme, type ThemeContextValue, StyleSheet, Text, scaled } from '@school-erp/ui';
import { formatLongDate } from '@/features/dashboard/quickActions';
import { mockTimetable, TERM_START, type TimetableSlot } from '@/mock/timetable';
import { fonts } from '@/theme/fonts';
import { homeImages } from '@/theme/images';

const DAY_MS = 86_400_000;
const WEEKDAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DAY_LABEL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DURATION_GREEN = '#2E6B34';
const DURATION_GREEN_BG = '#E3F1E4';
const LUNCH_DOT = '#16A34A';
const SHORT_BREAK_DOT = '#F59E0B';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Today, or the next Monday when today is Sunday (school runs Monday to Saturday). */
export function schoolDayFor(date: Date): Date {
  const d = startOfDay(date);
  return d.getDay() === 0 ? new Date(d.getTime() + DAY_MS) : d;
}

/** Monday to Saturday of the week that contains `date`. */
export function weekDays(date: Date): Date[] {
  const d = startOfDay(date);
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  return [0, 1, 2, 3, 4, 5].map(
    (i) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i),
  );
}

/** Week of the term, counted from TERM_START (week 1). */
export function termWeek(date: Date): number {
  const monday = weekDays(date)[0] ?? startOfDay(date);
  return Math.max(1, Math.floor((monday.getTime() - TERM_START.getTime()) / (7 * DAY_MS)) + 1);
}

/** 480 -> "8:00 AM". */
export function formatClock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = String(minutes % 60).padStart(2, '0');
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "8:00–9:30 AM", "11:45–12:45 PM": one AM/PM marker, taken from the end time (as in the design). */
export function formatRange(start: number, end: number): string {
  const [s] = formatClock(start).split(' ');
  const [e, ep] = formatClock(end).split(' ');
  return `${s}–${e} ${ep}`;
}

/** 90 -> "1.5 HRS", 30 -> "30 MIN", 60 -> "1 HR", 105 -> "1h 45m". */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} MIN`;
  if (minutes % 60 === 0) return minutes === 60 ? '1 HR' : `${minutes / 60} HRS`;
  if (minutes % 30 === 0) return `${minutes / 60} HRS`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

/**
 * Time Table, built to the approved design: back arrow, centred title and photo, date with week
 * number and "Today" or the selected day's name, Monday-Saturday strip, and a Time / Subject / Teacher table with breaks
 * and a NOW marker on the running period. MOCK data only.
 */
export function TimetableScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const [now, setNow] = useState(() => new Date());
  const [selected, setSelected] = useState(() => schoolDayFor(new Date()));

  useEffect(() => {
    // Moves the NOW marker as periods change.
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const days = weekDays(selected);
  const slots: TimetableSlot[] = mockTimetable[selected.getDay()] ?? [];
  const isToday = startOfDay(now).getTime() === selected.getTime();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const classCount = slots.filter((s) => s.kind === 'class').length;
  const breakCount = slots.length - classCount;

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          testID="timetable-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.headerButton}
        >
          <ArrowLeft size={scaled(24)} color={colors.text} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Time Table
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile"
          onPress={() => router.push('/profile')}
          style={styles.headerButton}
        >
          <View style={styles.photo}>
            <Image source={homeImages.avatar} style={styles.photoImage} resizeMode="contain" />
          </View>
        </Pressable>
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.date} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
          {formatLongDate(selected)}
        </Text>
        <View testID="timetable-day-pill" style={styles.todayButton}>
          <Text style={styles.todayText}>{isToday ? 'Today' : DAY_LABEL[selected.getDay()]}</Text>
        </View>
      </View>
      <Text style={styles.week}>• Week {termWeek(selected)}</Text>

      <View style={styles.weekStrip} accessibilityRole="tablist">
        {days.map((d) => {
          const active = d.getTime() === selected.getTime();
          return (
            <Pressable
              key={d.getTime()}
              testID={`day-${WEEKDAY_SHORT[d.getDay()]}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={formatLongDate(d)}
              onPress={() => setSelected(d)}
              style={[styles.dayCard, active && styles.dayCardActive]}
            >
              <Text style={[styles.dayName, active && styles.dayTextActive]}>
                {WEEKDAY_SHORT[d.getDay()]}
              </Text>
              <Text style={[styles.dayNumber, active && styles.dayTextActive]}>{d.getDate()}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.table}>
        <View style={styles.row}>
          {['TIME', 'SUBJECT', 'TEACHER'].map((h, i) => (
            <View
              key={h}
              style={[styles.headCell, i === 0 && styles.timeCol, i === 2 && styles.wideCol]}
            >
              <Text style={styles.headText}>{h}</Text>
            </View>
          ))}
        </View>

        {slots.map((slot) => {
          const current = isToday && nowMinutes >= slot.start && nowMinutes < slot.end;
          return (
            <View key={slot.id} style={styles.row} testID={`slot-${slot.id}`}>
              <View
                style={[styles.cell, styles.timeCol, styles.timeCell, current && styles.cellNow]}
              >
                <Text style={styles.timeText} numberOfLines={1}>
                  {formatRange(slot.start, slot.end)}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.durationPill}>
                    <Text style={styles.durationText}>{formatDuration(slot.end - slot.start)}</Text>
                  </View>
                  {current ? (
                    <View style={styles.nowPill}>
                      <View style={styles.nowDot} />
                      <Text style={styles.nowText}>NOW</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {slot.kind === 'class' ? (
                <>
                  <View style={[styles.cell, styles.centerCell, current && styles.cellNow]}>
                    <Text style={styles.subject} numberOfLines={2}>
                      {slot.subject}
                    </Text>
                    {slot.code ? <Text style={styles.code}>{slot.code}</Text> : null}
                  </View>
                  <View style={[styles.cell, styles.wideCol, current && styles.cellNow]}>
                    <Text style={styles.teacher} numberOfLines={1}>
                      T: {slot.teacher}
                    </Text>
                    <Text style={styles.teacher} numberOfLines={1}>
                      <Text style={styles.label}>Rm:</Text> {slot.room}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={[styles.cell, styles.breakCell, current && styles.cellNow]}>
                    <View
                      style={[
                        styles.breakDot,
                        {
                          backgroundColor: slot.variant === 'lunch' ? LUNCH_DOT : SHORT_BREAK_DOT,
                        },
                      ]}
                    />
                    <Text
                      style={styles.breakTitle}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {slot.title}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.cell,
                      styles.wideCol,
                      styles.breakPlaceCell,
                      current && styles.cellNow,
                    ]}
                  >
                    {slot.place ? (
                      <Text style={styles.place} numberOfLines={2}>
                        {slot.place}
                      </Text>
                    ) : null}
                    {slot.tag ? (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>{slot.tag}</Text>
                      </View>
                    ) : null}
                  </View>
                </>
              )}
            </View>
          );
        })}

        <View style={styles.footer}>
          <View style={styles.footerDot} />
          <Text style={styles.footerText}>
            {classCount} Classes • {breakCount} Breaks
          </Text>
        </View>
      </View>
    </Screen>
  );
}

function makeStyles({ colors, spacing, radii }: ThemeContextValue) {
  const cellBorder = '#E4E4E7';
  return StyleSheet.create({
    content: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
    pressed: { opacity: 0.75 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { color: colors.primary, fontSize: 22, fontFamily: fonts.semibold },
    photo: {
      width: 38,
      height: 38,
      borderRadius: radii.full,
      backgroundColor: '#E3EEF9',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    photoImage: { width: 30, height: 30 },
    dateRow: {
      marginTop: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    date: { flex: 1, color: colors.text, fontSize: 20, fontFamily: fonts.semibold },
    week: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
    todayButton: {
      minHeight: 32,
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      backgroundColor: '#F4F4F5',
      borderWidth: 1,
      borderColor: cellBorder,
      justifyContent: 'center',
    },
    todayText: { color: colors.text, fontSize: 13, fontFamily: fonts.medium },
    weekStrip: { marginTop: spacing.md, flexDirection: 'row', gap: 6 },
    dayCard: {
      flex: 1,
      minHeight: 56,
      borderRadius: radii.lg,
      backgroundColor: '#F4F4F5',
      borderWidth: 1,
      borderColor: cellBorder,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    dayCardActive: {
      backgroundColor: colors.primary,
      borderColor: '#1E0A45',
      borderWidth: 2,
    },
    dayName: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.semibold },
    dayNumber: { color: colors.text, fontSize: 17, fontFamily: fonts.semibold },
    dayTextActive: { color: colors.primaryForeground },
    table: { marginTop: spacing.lg, gap: 5 },
    row: { flexDirection: 'row', gap: 5 },
    timeCol: { flex: 1.15 },
    wideCol: { flex: 1.1 },
    headCell: {
      flex: 1,
      minHeight: 36,
      borderRadius: radii.lg,
      borderWidth: 1.5,
      borderColor: '#1F1F1F',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headText: {
      color: colors.primary,
      fontSize: 11,
      fontFamily: fonts.bold,
      letterSpacing: 0.6,
    },
    cell: {
      flex: 1,
      minHeight: 52,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: cellBorder,
      backgroundColor: colors.surface,
      paddingHorizontal: 5,
      paddingVertical: spacing.sm,
      justifyContent: 'center',
    },
    cellNow: { borderColor: '#111111', borderWidth: 1.5 },
    timeCell: { alignItems: 'center', backgroundColor: '#FAFAFA', gap: 5 },
    timeText: { color: colors.text, fontSize: 11.5, fontFamily: fonts.semibold },
    badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    durationPill: {
      backgroundColor: DURATION_GREEN_BG,
      borderRadius: radii.sm,
      paddingHorizontal: 7,
      paddingVertical: 2,
    },
    durationText: { color: DURATION_GREEN, fontSize: 10, fontFamily: fonts.bold },
    nowPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: '#111111',
      borderRadius: radii.full,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    nowDot: { width: 5, height: 5, borderRadius: radii.full, backgroundColor: '#22C55E' },
    nowText: { color: '#FFFFFF', fontSize: 9, fontFamily: fonts.bold },
    centerCell: { alignItems: 'center' },
    subject: { color: colors.text, fontSize: 13, fontFamily: fonts.regular, textAlign: 'center' },
    code: { color: colors.textMuted, fontSize: 10, fontFamily: fonts.semibold, marginTop: 1 },
    teacher: { color: colors.text, fontSize: 11.5, fontFamily: fonts.regular, lineHeight: 16 },
    label: { fontFamily: fonts.semibold },
    breakCell: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      backgroundColor: '#FAFAFA',
    },
    breakDot: { width: 7, height: 7, borderRadius: radii.full },
    breakTitle: {
      flexShrink: 1,
      color: colors.textSecondary,
      fontSize: 12,
      fontFamily: fonts.medium,
    },
    breakPlaceCell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#FAFAFA',
    },
    place: {
      flexShrink: 1,
      color: colors.textSecondary,
      fontSize: 10.5,
      fontFamily: fonts.regular,
    },
    tag: {
      backgroundColor: '#E4E4E7',
      borderRadius: radii.xs,
      paddingHorizontal: 4,
      paddingVertical: 1,
    },
    tagText: { color: colors.textSecondary, fontSize: 9, fontFamily: fonts.semibold },
    footer: {
      marginTop: 2,
      minHeight: 40,
      borderRadius: radii.md,
      backgroundColor: '#F4F4F5',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    footerDot: { width: 8, height: 8, borderRadius: radii.full, backgroundColor: LUNCH_DOT },
    footerText: { color: colors.text, fontSize: 13, fontFamily: fonts.semibold },
  });
}
