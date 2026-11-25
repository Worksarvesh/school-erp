import { useRouter } from 'expo-router';
import { ArrowLeft, CalendarDays } from 'lucide-react-native';
import { useMemo } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Screen, useTheme, type ThemeContextValue, StyleSheet, Text, scaled } from '@school-erp/ui';
import {
  ATTENDANCE_COLORS,
  AttendanceSummary,
} from '@/features/attendance/components/AttendanceSummary';
import { mockHomeworkDue, type MockHomeworkDue } from '@/mock/academic';
import { fonts } from '@/theme/fonts';
import { homeImages } from '@/theme/images';

const DUE_RED = '#C81E1E';

/** "Due today, 11:59 PM" / "Due tomorrow, 5:00 PM" / "Due 24 Nov, 5:00 PM". */
export function formatDue(dueAt: Date, now: Date = new Date()): string {
  const hours = dueAt.getHours();
  const minutes = String(dueAt.getMinutes()).padStart(2, '0');
  const time = `${hours % 12 === 0 ? 12 : hours % 12}:${minutes} ${hours < 12 ? 'AM' : 'PM'}`;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(dueAt) - startOfDay(now)) / 86_400_000);
  if (days === 0) return `Due today, ${time}`;
  if (days === 1) return `Due tomorrow, ${time}`;
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `Due ${dueAt.getDate()} ${months[dueAt.getMonth()]}, ${time}`;
}

/**
 * Academic tab, built to the approved Academic design: centered title with menu and photo,
 * Homework Due card, attendance with Daily / Weekly / Monthly tabs and a progress ring.
 * MOCK data only.
 */
export function AcademicHubScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const homework = useMemo(() => mockHomeworkDue(), []);

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          testID="academic-back"
          accessibilityRole="button"
          accessibilityLabel="Go back to Home"
          onPress={() => router.navigate('/')}
          style={styles.headerButton}
        >
          <ArrowLeft size={scaled(22)} color={colors.text} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Academic
        </Text>
        <Pressable
          testID="academic-profile"
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

      <Pressable
        testID="homework-due"
        accessibilityRole="button"
        accessibilityLabel={`Homework due, ${homework.length} tasks`}
        onPress={() => router.push('/homework')}
        style={({ pressed }) => [styles.card, styles.homeworkCard, pressed && styles.pressed]}
      >
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Homework Due</Text>
          <View style={styles.tasksPill}>
            <Text style={styles.tasksPillText}>{homework.length} TASKS</Text>
          </View>
        </View>
        {homework.map((hw: MockHomeworkDue) => (
          <View key={hw.id} style={styles.homeworkItem}>
            <Text style={styles.homeworkTitle} numberOfLines={1}>
              {hw.title}
            </Text>
            <Text style={styles.homeworkDue}>{formatDue(hw.dueAt)}</Text>
          </View>
        ))}
      </Pressable>

      <View style={[styles.rowBetween, styles.sectionHeader]}>
        <Text style={styles.sectionTitle}>Attendance</Text>
        <Pressable
          testID="attendance-calendar"
          accessibilityRole="button"
          accessibilityLabel="Open attendance calendar"
          onPress={() => router.push('/attendance')}
          style={styles.iconButton}
        >
          <CalendarDays size={scaled(22)} color={ATTENDANCE_COLORS.holiday} />
        </Pressable>
      </View>

      <AttendanceSummary showRemark />
    </Screen>
  );
}

function makeStyles({ colors, spacing, radii }: ThemeContextValue) {
  return StyleSheet.create({
    content: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
    },
    headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { color: colors.primary, fontSize: 24, fontFamily: fonts.semibold },
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
    pressed: { opacity: 0.75 },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radii.xl,
      borderWidth: 1,
      borderColor: colors.border,
    },
    homeworkCard: { marginTop: spacing.sm, padding: spacing.base, gap: spacing.md },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { color: colors.text, fontSize: 20, fontFamily: fonts.semibold },
    tasksPill: {
      backgroundColor: '#FDE2E2',
      borderRadius: radii.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    tasksPillText: { color: DUE_RED, fontSize: 11, fontFamily: fonts.bold, letterSpacing: 1 },
    homeworkItem: { gap: 2 },
    homeworkTitle: { color: colors.text, fontSize: 14, fontFamily: fonts.semibold },
    homeworkDue: { color: DUE_RED, fontSize: 13, fontFamily: fonts.medium },
    sectionHeader: { marginTop: spacing.lg },
    sectionTitle: { color: colors.text, fontSize: 18, fontFamily: fonts.semibold },
    iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  });
}
