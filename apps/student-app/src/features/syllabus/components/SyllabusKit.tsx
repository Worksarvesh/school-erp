import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  Check,
  FlaskConical,
  Globe,
  Leaf,
  Lock,
  Monitor,
  Play,
  Search,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, TextInput, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme, StyleSheet, Text, scaled, MAX_FONT_SCALE } from '@school-erp/ui';
import type { ChapterStatus } from '@/mock/syllabus';
import { fonts } from '@/theme/fonts';

export const SYLLABUS_BLUE = '#2F6FED';

/** Icon and pill colours per status, shared by chapters and topics. */
export const CHAPTER_STATUS: Record<
  ChapterStatus,
  {
    label: string;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    /** Filled play icon for in-progress and upcoming items. */
    filled: boolean;
    pillBg: string;
    pillFg: string;
    pillIcon: LucideIcon;
  }
> = {
  completed: {
    label: 'Completed',
    icon: Leaf,
    iconBg: '#E3F6EC',
    iconColor: '#22A06B',
    filled: false,
    pillBg: '#E3F6EC',
    pillFg: '#16A34A',
    pillIcon: Check,
  },
  in_progress: {
    label: 'In Progress',
    icon: Play,
    iconBg: SYLLABUS_BLUE,
    iconColor: '#FFFFFF',
    filled: true,
    pillBg: '#E5EEFE',
    pillFg: SYLLABUS_BLUE,
    pillIcon: Play,
  },
  upcoming: {
    label: 'Upcoming',
    icon: Play,
    iconBg: '#4B5563',
    iconColor: '#FFFFFF',
    filled: true,
    pillBg: '#F3F4F6',
    pillFg: '#6B7280',
    pillIcon: Lock,
  },
};

export function StatusPill({ status }: { status: ChapterStatus }) {
  const s = CHAPTER_STATUS[status];
  const PillIcon = s.pillIcon;
  return (
    <View style={[styles.pill, { backgroundColor: s.pillBg }]}>
      <PillIcon
        size={scaled(9)}
        color={s.pillFg}
        fill={status === 'in_progress' ? s.pillFg : 'transparent'}
      />
      <Text style={[styles.pillText, { color: s.pillFg }]}>{s.label}</Text>
    </View>
  );
}

export interface SubjectStyle {
  icon: LucideIcon;
  /** Icon tile colour. */
  tile: string;
  /** Progress bar and ring colour. */
  accent: string;
}

/** Icon and colours per subject, as in the approved design; other subjects get a fallback. */
const SUBJECT_STYLES: Record<string, SubjectStyle> = {
  Mathematics: { icon: Calculator, tile: '#2F6FED', accent: '#2F6FED' },
  Science: { icon: FlaskConical, tile: '#22B07D', accent: '#22B07D' },
  English: { icon: BookOpen, tile: '#E8466D', accent: '#E8466D' },
  'Social Science': { icon: Globe, tile: '#F5871F', accent: '#F5871F' },
  Computer: { icon: Monitor, tile: '#7C4DDB', accent: '#14B8A6' },
};
const FALLBACK_STYLE: SubjectStyle = { icon: BookOpen, tile: '#6366F1', accent: '#6366F1' };

export function subjectStyle(name: string): SubjectStyle {
  return SUBJECT_STYLES[name] ?? FALLBACK_STYLE;
}

/** Circular progress with the percentage in the middle. */
export function ProgressRing({
  percent,
  color,
  size = 40,
  stroke = 3.5,
  fontSize = 10,
  testID,
}: {
  percent: number;
  color: string;
  size?: number;
  stroke?: number;
  fontSize?: number;
  testID?: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const value = Math.max(0, Math.min(100, percent));
  return (
    <View
      style={{ width: scaled(size), height: scaled(size) }}
      accessible
      accessibilityLabel={`${value} percent complete`}
      testID={testID}
    >
      <Svg width={scaled(size)} height={scaled(size)} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#EEF0F4"
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - value / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.ringCenter]}>
        <Text style={[styles.ringText, { fontSize: scaled(fontSize) }]}>{value}%</Text>
      </View>
    </View>
  );
}

/** Thin rounded progress bar. */
export function ProgressBar({ percent, color }: { percent: number; color: string }) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <View style={styles.barTrack}>
      <View style={[styles.barFill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

/**
 * Back arrow, centred purple title and a search button. While searching, the title row turns
 * into a search field; closing it clears the search.
 */
export function SyllabusHeader({
  title,
  testID,
  searching,
  query,
  placeholder,
  onSearchChange,
  onToggleSearch,
}: {
  title: string;
  testID: string;
  searching: boolean;
  query: string;
  placeholder: string;
  onSearchChange: (q: string) => void;
  onToggleSearch: () => void;
}) {
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
        <ArrowLeft size={scaled(22)} color={colors.text} />
      </Pressable>
      {searching ? (
        <TextInput
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          testID={`${testID}-search-input`}
          autoFocus
          value={query}
          onChangeText={onSearchChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={placeholder}
          style={styles.searchInput}
          returnKeyType="search"
        />
      ) : (
        <Text style={[styles.title, { color: colors.primary }]} accessibilityRole="header">
          {title}
        </Text>
      )}
      <Pressable
        testID={`${testID}-search`}
        accessibilityRole="button"
        accessibilityLabel={searching ? 'Close search' : 'Search'}
        onPress={onToggleSearch}
        style={styles.headerButton}
      >
        {searching ? (
          <X size={scaled(20)} color={colors.text} />
        ) : (
          <Search size={scaled(20)} color={colors.text} />
        )}
      </Pressable>
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
  },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontFamily: fonts.semibold },
  searchInput: {
    flex: 1,
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    color: '#111827',
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: { fontSize: 9, fontFamily: fonts.semibold },
  ringCenter: { alignItems: 'center', justifyContent: 'center' },
  ringText: { color: '#111827', fontFamily: fonts.bold },
  barTrack: { height: 5, borderRadius: 999, backgroundColor: '#EEF0F4', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
});
