import type { HomeworkDto } from '@school-erp/api-client';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Globe,
  Laptop,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Screen,
  StateView,
  useTheme,
  type ThemeContextValue,
  StyleSheet,
  Text,
  scaled,
} from '@school-erp/ui';
import { MockStudentServices } from '../../../core/mocks/mock-services';
import { fonts } from '@/theme/fonts';

type HomeworkView = 'all' | 'subject';

const VIEWS: readonly { key: HomeworkView; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'subject', label: 'Subject' },
];

/** Left-bar colour per subject, as in the approved design; other subjects use a fallback. */
const SUBJECT_COLORS: Record<string, string> = {
  English: '#12A6D9',
  Chemistry: '#F5A623',
  Geometry: '#45C27D',
  Health: '#A855F7',
  Mathematics: '#6366F1',
  Science: '#F5A623',
};
const FALLBACK_COLORS = ['#EC4899', '#14B8A6', '#8B5CF6', '#F97316', '#0EA5E9'];

interface SubjectCard {
  name: string;
  icon: LucideIcon;
  /** Icon square colour, card border tint and chevron colour (from the approved design). */
  color: string;
  border: string;
  /** Subject names in the homework data that belong to this card. */
  matches: readonly string[];
}

/** The Subject view: one card per subject, in design order. */
const SUBJECT_CARDS: readonly SubjectCard[] = [
  {
    name: 'Mathematics',
    icon: Calculator,
    color: '#2F80ED',
    border: '#D6E4FA',
    matches: ['Mathematics', 'Geometry'],
  },
  {
    name: 'Science',
    icon: FlaskConical,
    color: '#2DB36B',
    border: '#D2F1E1',
    matches: ['Science', 'Chemistry'],
  },
  { name: 'English', icon: BookOpen, color: '#F43F5E', border: '#FADADF', matches: ['English'] },
  {
    name: 'Social Science',
    icon: Globe,
    color: '#FB923C',
    border: '#FBE3CC',
    matches: ['Social Science', 'Social Studies'],
  },
  {
    name: 'Computer',
    icon: Laptop,
    color: '#8B5CF6',
    border: '#E4DBFB',
    matches: ['Computer', 'Computer Science'],
  },
  {
    name: 'General Knowledge',
    icon: Calculator,
    color: '#2F80ED',
    border: '#D6E4FA',
    matches: ['General Knowledge'],
  },
];

export function subjectColor(subject: string): string {
  const known = SUBJECT_COLORS[subject];
  if (known) return known;
  let hash = 0;
  for (const ch of subject) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length] ?? '#8B5CF6';
}

const STATUS = {
  completed: { label: 'Complete', color: '#16A34A' },
  pending: { label: 'Incomplete', color: '#E11D2E' },
} as const;

/** Groups homework by subject, keeping the order in which subjects first appear. */
export function groupBySubject(list: readonly HomeworkDto[]): [string, HomeworkDto[]][] {
  const groups = new Map<string, HomeworkDto[]>();
  for (const hw of list) {
    const group = groups.get(hw.subjectName);
    if (group) group.push(hw);
    else groups.set(hw.subjectName, [hw]);
  }
  return [...groups.entries()];
}

/**
 * Home Work list, built to the approved design: back arrow and centred title, All / Subject
 * switch, and one row per homework with a subject-coloured bar and a Complete / Incomplete
 * label. Rows open the homework detail. MOCK data only.
 */
export function HomeworkListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const [view, setView] = useState<HomeworkView>('all');
  const [subject, setSubject] = useState<SubjectCard | null>(null);
  const [homework, setHomework] = useState<HomeworkDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    MockStudentServices.getHomeworkList()
      .then(setHomework)
      .finally(() => setLoading(false));
  }, []);

  const renderRow = (hw: HomeworkDto) => {
    const status = STATUS[hw.status];
    return (
      <Pressable
        key={hw.id}
        testID={`homework-${hw.id}`}
        accessibilityRole="button"
        accessibilityLabel={`${hw.title}, ${hw.subjectName}, ${status.label}`}
        onPress={() => router.push({ pathname: '/homework/[id]', params: { id: hw.id } })}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={[styles.bar, { backgroundColor: subjectColor(hw.subjectName) }]} />
        <View style={styles.rowText}>
          <Text
            style={styles.rowTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {hw.title}
          </Text>
          <Text style={styles.rowSubject} numberOfLines={1}>
            {hw.subjectName}
          </Text>
        </View>
        <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
      </Pressable>
    );
  };

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          testID="homework-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.headerButton}
        >
          <ArrowLeft size={scaled(24)} color={colors.text} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Home Work
        </Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.segment} accessibilityRole="tablist">
        {VIEWS.map((v) => {
          const active = v.key === view;
          return (
            <Pressable
              key={v.key}
              testID={`homework-view-${v.key}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setView(v.key);
                setSubject(null);
              }}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {v.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <StateView state="loading" title="Loading homework..." />
      ) : homework.length === 0 ? (
        <StateView state="empty" title="No homework" description="You're all caught up." />
      ) : view === 'all' ? (
        <View style={styles.list}>{homework.map(renderRow)}</View>
      ) : subject ? (
        <View>
          <Pressable
            testID="subject-back"
            accessibilityRole="button"
            accessibilityLabel="Back to subjects"
            onPress={() => setSubject(null)}
            style={styles.subjectHead}
          >
            <ChevronLeft size={scaled(20)} color={subject.color} />
            <Text style={[styles.subjectHeadText, { color: subject.color }]}>{subject.name}</Text>
          </Pressable>
          {homework.filter((hw) => subject.matches.includes(hw.subjectName)).length === 0 ? (
            <StateView
              state="empty"
              title="No homework"
              description={`There is no ${subject.name} homework right now.`}
            />
          ) : (
            <View style={styles.list}>
              {homework.filter((hw) => subject.matches.includes(hw.subjectName)).map(renderRow)}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.cards}>
          {SUBJECT_CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <Pressable
                key={c.name}
                testID={`subject-${c.name}`}
                accessibilityRole="button"
                accessibilityLabel={c.name}
                onPress={() => setSubject(c)}
                style={({ pressed }) => [
                  styles.card,
                  { borderColor: c.border },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.cardIcon, { backgroundColor: c.color }]}>
                  <Icon size={scaled(24)} color="#FFFFFF" />
                </View>
                <Text style={styles.cardTitle}>{c.name}</Text>
                <ChevronRight size={scaled(22)} color={c.color} />
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

function makeStyles({ colors, spacing, radii }: ThemeContextValue) {
  return StyleSheet.create({
    content: { paddingBottom: spacing.xl },
    pressed: { backgroundColor: colors.surfaceSubtle },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F1F4',
    },
    headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { color: colors.primary, fontSize: 20, fontFamily: fonts.semibold },
    segment: {
      marginTop: spacing.base,
      marginHorizontal: spacing.base,
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: '#C9D6F5',
      borderRadius: radii.md,
      padding: 2,
      backgroundColor: colors.surface,
    },
    segmentItem: {
      flex: 1,
      minHeight: 30,
      borderRadius: radii.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentItemActive: { backgroundColor: colors.primary },
    segmentText: { color: colors.text, fontSize: 12, fontFamily: fonts.medium },
    segmentTextActive: { color: colors.primaryForeground },
    list: { marginTop: spacing.base, paddingLeft: spacing.xs },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 56,
      paddingRight: spacing.base,
      borderBottomWidth: 1,
      borderBottomColor: '#F1F1F4',
    },
    bar: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginVertical: 2 },
    rowText: { flex: 1, paddingLeft: spacing.md, paddingVertical: spacing.sm, gap: 3 },
    rowTitle: { color: '#1F2937', fontSize: 13, fontFamily: fonts.regular },
    rowSubject: { color: colors.textSecondary, fontSize: 11, fontFamily: fonts.regular },
    status: { fontSize: 11, fontFamily: fonts.semibold, marginLeft: spacing.sm },
    cards: { marginTop: spacing.lg, paddingHorizontal: spacing.base, gap: 12 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.base,
      minHeight: 76,
      paddingHorizontal: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: colors.surface,
    },
    cardIcon: {
      width: 48,
      height: 48,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: { flex: 1, color: '#111827', fontSize: 16, fontFamily: fonts.medium },
    subjectHead: {
      marginTop: spacing.base,
      paddingHorizontal: spacing.sm,
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    subjectHeadText: { fontSize: 15, fontFamily: fonts.semibold },
  });
}
