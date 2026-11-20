import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@school-erp/ui';
import { fonts } from '@/theme/fonts';

export const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const SHORT_MONTHS = [
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
export const LONG_MONTHS = [
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

/** Pill colours used in turn on exam cards, as in the approved design. */
export const PILL_PALETTE: readonly { bg: string; fg: string }[] = [
  { bg: '#FEE2E2', fg: '#DC2626' },
  { bg: '#EDE9FE', fg: '#7C3AED' },
  { bg: '#DCFCE7', fg: '#16A34A' },
  { bg: '#FFEDD5', fg: '#EA580C' },
  { bg: '#DBEAFE', fg: '#2563EB' },
];

export function pillColors(index: number): { bg: string; fg: string } {
  return PILL_PALETTE[index % PILL_PALETTE.length] ?? { bg: '#EDE9FE', fg: '#7C3AED' };
}

function clock(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** "10:00 AM - 12:00 PM (2 hrs)". */
export function formatTimeRange(start: number, end: number): string {
  const mins = end - start;
  const hours = mins / 60;
  const length = Number.isInteger(hours)
    ? `${hours} ${hours === 1 ? 'hr' : 'hrs'}`
    : `${mins} mins`;
  return `${clock(start)} - ${clock(end)} (${length})`;
}

export function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Back arrow, centred purple title, and an empty slot on the right to keep it centred. */
export function ExamHeader({ title, testID }: { title: string; testID: string }) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <Pressable
        testID={`${testID}-back`}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={styles.headerButton}
      >
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>
      <Text style={[styles.title, { color: colors.primary }]} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.headerButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F4',
  },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontFamily: fonts.semibold },
});
