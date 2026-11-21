import { useRouter, type Href } from 'expo-router';
import { CalendarCheck, ChartColumn, ClipboardList, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@school-erp/ui';
import { fonts } from '@/theme/fonts';
import { ExamHeader } from '../components/ExamKit';

interface ExamEntry {
  key: string;
  label: string;
  href: Href;
  icon: LucideIcon;
  /** Card background, card border, icon box background, icon colour. */
  tint: { bg: string; border: string; box: string; icon: string };
}

const ENTRIES: readonly ExamEntry[] = [
  {
    key: 'timetable',
    label: 'Exam\nTimetable',
    href: '/examinations/timetable',
    icon: CalendarCheck,
    tint: { bg: '#FFF1F2', border: '#FFE0E4', box: '#FFE4E8', icon: '#E11D48' },
  },
  {
    key: 'unit-tests',
    label: 'Unit Tests',
    href: '/examinations/unit-tests',
    icon: ClipboardList,
    tint: { bg: '#F0FDF4', border: '#DCFCE7', box: '#D1FAE5', icon: '#16A34A' },
  },
  {
    key: 'results',
    label: 'Results',
    href: '/examinations/results',
    icon: ChartColumn,
    tint: { bg: '#EFF6FF', border: '#DBEAFE', box: '#DBEAFE', icon: '#2563EB' },
  },
];

/** Exam home, built to the approved design: three tinted cards that open each exam page. */
export function ExamHubScreen() {
  const router = useRouter();
  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <ExamHeader title="Exam" testID="exam-hub" />
      <View style={styles.list}>
        {ENTRIES.map(({ key, label, href, icon: Icon, tint }) => (
          <Pressable
            key={key}
            testID={`exam-hub-${key}`}
            accessibilityRole="button"
            accessibilityLabel={label.replace('\n', ' ')}
            onPress={() => router.push(href)}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: tint.bg, borderColor: tint.border },
              pressed && styles.pressed,
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: tint.box }]}>
              <Icon size={20} color={tint.icon} />
            </View>
            <Text style={styles.label}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  list: { paddingHorizontal: 16, paddingTop: 12, gap: 14 },
  card: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  pressed: { opacity: 0.85 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: '#1F2937', fontSize: 13, lineHeight: 17, fontFamily: fonts.semibold },
});
