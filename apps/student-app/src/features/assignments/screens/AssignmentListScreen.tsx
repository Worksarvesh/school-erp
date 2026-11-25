import { useRouter } from 'expo-router';
import { ArrowLeft, CalendarDays, ChevronRight, Menu, Search, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import {
  Screen,
  StateView,
  useTheme,
  type ThemeContextValue,
  StyleSheet,
  Text,
  scaled,
  MAX_FONT_SCALE,
} from '@school-erp/ui';
import { mockAssignments, type MockAssignment } from '@/mock/assignments';
import { fonts } from '@/theme/fonts';
import {
  CalendarSheet,
  FilterMenuSheet,
  OptionSheet,
  type FilterKind,
} from '../components/AssignmentSheets';
import { assignmentTab, sameDay, useSubmissions, type AssignmentTab } from '../submissions';

const TABS: readonly { key: AssignmentTab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'submitted', label: 'Submitted' },
];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const LINK_BLUE = '#2563EB';

/** One active filter at a time, chosen from the ☰ menu or the calendar button. */
export type AssignmentFilter =
  | { kind: 'calendar'; date: Date }
  | { kind: 'subject'; value: string }
  | { kind: 'chapter'; value: string };

export function matchesSearch(a: MockAssignment, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [a.subject, a.chapter, a.title, a.description].some((s) => s.toLowerCase().includes(q));
}

export function matchesFilter(a: MockAssignment, filter: AssignmentFilter | null): boolean {
  if (!filter) return true;
  if (filter.kind === 'calendar') return sameDay(a.dueOn, filter.date);
  if (filter.kind === 'subject') return a.subject === filter.value;
  return a.chapter === filter.value;
}

function filterLabel(filter: AssignmentFilter): string {
  if (filter.kind === 'calendar') {
    return `Due ${filter.date.getDate()} ${MONTHS[filter.date.getMonth()]}`;
  }
  return filter.kind === 'subject' ? `Subject: ${filter.value}` : `Chapter: ${filter.value}`;
}

const dayMonth = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

/**
 * Assignment list, built to the approved design: back and ☰ filter menu (calendar, subject,
 * chapter), search with a calendar button, Upcoming / Past / Submitted tabs, and one card per
 * assignment. A card opens the submission page. MOCK data only.
 */
export function AssignmentListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const today = useMemo(() => new Date(), []);
  const all = useMemo(() => mockAssignments(today), [today]);
  const submissions = useSubmissions((s) => s.submissions);

  const [tab, setTab] = useState<AssignmentTab>('upcoming');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<AssignmentFilter | null>(null);
  const [sheet, setSheet] = useState<'menu' | FilterKind | null>(null);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const subjects = useMemo(() => [...new Set(all.map((a) => a.subject))].sort(), [all]);
  const chapters = useMemo(
    () =>
      [...new Map(all.map((a) => [a.chapter, a.subject])).entries()]
        .map(([chapter, subject]) => ({ value: chapter, label: chapter, sub: subject }))
        .sort((x, y) => x.label.localeCompare(y.label)),
    [all],
  );

  const visible = all
    .filter((a) => assignmentTab(a, today, Boolean(submissions[a.id])) === tab)
    .filter((a) => matchesSearch(a, query))
    .filter((a) => matchesFilter(a, filter))
    .sort((x, y) =>
      tab === 'upcoming'
        ? x.dueOn.getTime() - y.dueOn.getTime()
        : y.dueOn.getTime() - x.dueOn.getTime(),
    );

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const applyFilter = (next: AssignmentFilter | null) => {
    setFilter(next);
    setSheet(null);
  };

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable
          testID="assignment-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={styles.headerButton}
        >
          <ArrowLeft size={scaled(24)} color={colors.text} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Assignment
        </Text>
        <Pressable
          testID="assignment-menu-button"
          accessibilityRole="button"
          accessibilityLabel="Filter menu"
          onPress={() => setSheet('menu')}
          style={styles.headerButton}
        >
          <Menu size={scaled(22)} color={filter ? colors.primary : colors.text} />
        </Pressable>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Search size={scaled(18)} color={colors.textSecondary} />
          <TextInput
            maxFontSizeMultiplier={MAX_FONT_SCALE}
            testID="assignment-search"
            value={query}
            onChangeText={setQuery}
            placeholder="Search subjects, records"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Search assignments"
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
        <Pressable
          testID="assignment-calendar"
          accessibilityRole="button"
          accessibilityLabel="Open calendar"
          onPress={() => setSheet('calendar')}
          style={[
            styles.calendarButton,
            filter?.kind === 'calendar' && styles.calendarButtonActive,
          ]}
        >
          <CalendarDays
            size={scaled(20)}
            color={filter?.kind === 'calendar' ? colors.primary : colors.text}
          />
        </Pressable>
      </View>

      {filter ? (
        <View style={styles.chipRow}>
          <Pressable
            testID="assignment-filter-chip"
            accessibilityRole="button"
            accessibilityLabel={`${filterLabel(filter)}, remove filter`}
            onPress={() => setFilter(null)}
            style={styles.chip}
          >
            <Text style={styles.chipText}>{filterLabel(filter)}</Text>
            <X size={scaled(13)} color={colors.primary} />
          </Pressable>
        </View>
      ) : null}

      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable
              key={t.key}
              testID={`assignment-tab-${t.key}`}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setTab(t.key)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <StateView
          state="empty"
          title={tab === 'submitted' ? 'Nothing submitted yet' : 'No assignments'}
          description={query || filter ? 'Try another search or filter.' : undefined}
        />
      ) : (
        <View style={styles.list}>
          {visible.map((a) => {
            const open = expanded.has(a.id);
            const submission = submissions[a.id];
            return (
              <View key={a.id} style={styles.card}>
                {/* Only the top opens the assignment: View More is a button of its own, and buttons cannot nest on web. */}
                <Pressable
                  style={({ pressed }) => pressed && styles.cardPressed}
                  testID={`assignment-${a.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${a.subject}, ${a.title}, due ${dayMonth(a.dueOn)}`}
                  onPress={() =>
                    router.push({ pathname: '/assignments/[id]', params: { id: a.id } })
                  }
                >
                  <View style={styles.cardTop}>
                    <View style={styles.dateBox}>
                      <Text style={styles.dateDay}>{a.assignedOn.getDate()}</Text>
                      <Text style={styles.dateMonth}>{MONTHS[a.assignedOn.getMonth()]}</Text>
                    </View>
                    <View style={styles.infoBox}>
                      <Text style={styles.infoValue}>{dayMonth(a.dueOn)}</Text>
                      <Text style={styles.infoLabel}>Due Date</Text>
                    </View>
                    <View style={styles.spacer} />
                    <View style={[styles.infoBox, styles.marksBox]}>
                      <Text style={styles.infoValue}>{a.totalMarks}</Text>
                      <Text style={styles.infoLabel}>Total Marks</Text>
                    </View>
                  </View>

                  <View style={styles.subjectRow}>
                    <Text style={styles.subject}>{a.subject}</Text>
                    {submission ? (
                      <View style={[styles.status, styles.statusDone]}>
                        <Text style={[styles.statusText, styles.statusTextDone]}>
                          Submitted {dayMonth(submission.submittedOn)}
                        </Text>
                      </View>
                    ) : tab === 'past' ? (
                      <View style={[styles.status, styles.statusLate]}>
                        <Text style={[styles.statusText, styles.statusTextLate]}>Overdue</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.chapter}>{a.chapter}</Text>
                </Pressable>
                <View style={styles.descriptionRow}>
                  <Text style={styles.description} numberOfLines={open ? undefined : 2}>
                    {a.description}
                  </Text>
                  <Pressable
                    testID={`assignment-more-${a.id}`}
                    accessibilityRole="button"
                    accessibilityLabel={open ? 'View less' : `View more about ${a.subject}`}
                    onPress={() => toggle(a.id)}
                    hitSlop={12}
                    style={styles.viewMore}
                  >
                    <Text style={styles.viewMoreText}>{open ? 'View Less' : 'View More'}</Text>
                    <ChevronRight
                      size={scaled(14)}
                      color={LINK_BLUE}
                      style={open ? { transform: [{ rotate: '-90deg' }] } : undefined}
                    />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <FilterMenuSheet
        visible={sheet === 'menu'}
        onClose={() => setSheet(null)}
        onPick={(kind) => setSheet(kind)}
        active={filter?.kind}
      />
      <CalendarSheet
        visible={sheet === 'calendar'}
        onClose={() => setSheet(null)}
        today={today}
        selected={filter?.kind === 'calendar' ? filter.date : undefined}
        markedDays={all
          .filter((a) => assignmentTab(a, today, Boolean(submissions[a.id])) === 'upcoming')
          .map((a) => a.dueOn)}
        onSelect={(date) => applyFilter({ kind: 'calendar', date })}
        onClear={() => applyFilter(null)}
      />
      <OptionSheet
        visible={sheet === 'subject'}
        onClose={() => setSheet(null)}
        title="Choose subject"
        testID="assignment-subject-sheet"
        options={subjects.map((s) => ({ value: s, label: s }))}
        selected={filter?.kind === 'subject' ? filter.value : undefined}
        onSelect={(value) => applyFilter({ kind: 'subject', value })}
      />
      <OptionSheet
        visible={sheet === 'chapter'}
        onClose={() => setSheet(null)}
        title="Choose chapter"
        testID="assignment-chapter-sheet"
        options={chapters}
        selected={filter?.kind === 'chapter' ? filter.value : undefined}
        onSelect={(value) => applyFilter({ kind: 'chapter', value })}
      />
    </Screen>
  );
}

function makeStyles({ colors, spacing, radii }: ThemeContextValue) {
  const boxBg = '#F4F5F7';
  return StyleSheet.create({
    content: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      marginHorizontal: -8,
    },
    headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    title: { color: colors.primary, fontSize: 20, fontFamily: fonts.semibold },
    searchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
    search: {
      flex: 1,
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: '#D4D4D8',
    },
    searchInput: {
      flex: 1,
      paddingVertical: 8,
      color: colors.text,
      fontSize: 12,
      fontFamily: fonts.regular,
    },
    calendarButton: {
      width: 40,
      height: 40,
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: '#D4D4D8',
      alignItems: 'center',
      justifyContent: 'center',
    },
    calendarButtonActive: { borderColor: colors.primary, backgroundColor: colors.surfaceSubtle },
    chipRow: { flexDirection: 'row', marginTop: spacing.sm },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radii.full,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: '#E1D3FA',
    },
    chipText: { color: colors.primary, fontSize: 12, fontFamily: fonts.semibold },
    tabs: { flexDirection: 'row', marginTop: spacing.base },
    tab: {
      flex: 1,
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },
    tabActive: { borderBottomColor: colors.primary },
    tabText: { color: colors.text, fontSize: 14, fontFamily: fonts.medium },
    tabTextActive: { color: colors.primary, fontFamily: fonts.semibold },
    list: { marginTop: spacing.base, gap: spacing.md },
    card: {
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: '#E4E4E7',
      backgroundColor: colors.surface,
      padding: spacing.md,
    },
    cardPressed: { backgroundColor: '#FAFAFB' },
    cardTop: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm },
    dateBox: {
      minWidth: 36,
      paddingHorizontal: 6,
      paddingVertical: 4,
      borderRadius: radii.sm,
      backgroundColor: boxBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateDay: { color: colors.text, fontSize: 12, fontFamily: fonts.semibold },
    dateMonth: { color: colors.text, fontSize: 9, fontFamily: fonts.bold },
    infoBox: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radii.sm,
      backgroundColor: boxBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    marksBox: { minWidth: 70 },
    infoValue: { color: colors.text, fontSize: 12, fontFamily: fonts.bold },
    infoLabel: { color: colors.textSecondary, fontSize: 9, fontFamily: fonts.medium },
    spacer: { flex: 1 },
    subjectRow: {
      marginTop: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    subject: { flexShrink: 1, color: colors.text, fontSize: 16, fontFamily: fonts.bold },
    status: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.full },
    statusDone: { backgroundColor: '#DCFCE7' },
    statusLate: { backgroundColor: '#FEE2E2' },
    statusText: { fontSize: 10, fontFamily: fonts.semibold },
    statusTextDone: { color: '#15803D' },
    statusTextLate: { color: '#B91C1C' },
    chapter: { color: colors.primary, fontSize: 11, fontFamily: fonts.medium, marginTop: 1 },
    descriptionRow: { marginTop: 4, flexDirection: 'row', alignItems: 'flex-end' },
    description: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 18,
      fontFamily: fonts.regular,
    },
    viewMore: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      minHeight: 18,
      paddingLeft: spacing.xs,
    },
    viewMoreText: { color: LINK_BLUE, fontSize: 12, fontFamily: fonts.semibold },
  });
}
