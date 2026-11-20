import type { HomeworkDto } from '@school-erp/api-client';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, StateView, useTheme, type ThemeContextValue } from '@school-erp/ui';
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

export function subjectColor(subject: string): string {
  const known = SUBJECT_COLORS[subject];
  if (known) return known;
  let hash = 0;
  for (const ch of subject) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length] ?? '#8B5CF6';
}

const STATUS = {
  completed: { label: 'Complete', color: '#E11D2E' },
  pending: { label: 'Incomplete', color: '#F97316' },
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
          <Text style={styles.rowTitle} numberOfLines={1}>
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
          <ArrowLeft size={24} color={colors.text} />
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
              onPress={() => setView(v.key)}
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
      ) : (
        groupBySubject(homework).map(([subject, items]) => (
          <View key={subject} style={styles.group}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupDot, { backgroundColor: subjectColor(subject) }]} />
              <Text style={styles.groupTitle}>{subject}</Text>
              <Text style={styles.groupCount}>{items.length}</Text>
            </View>
            <View style={styles.list}>{items.map(renderRow)}</View>
          </View>
        ))
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
    group: { marginTop: spacing.sm },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingHorizontal: spacing.base,
    },
    groupDot: { width: 8, height: 8, borderRadius: radii.full },
    groupTitle: { flex: 1, color: colors.text, fontSize: 14, fontFamily: fonts.semibold },
    groupCount: { color: colors.textSecondary, fontSize: 12, fontFamily: fonts.medium },
  });
}
