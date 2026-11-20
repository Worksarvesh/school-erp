import { useRouter } from 'expo-router';
import { ArrowLeft, CalendarDays, Check, ChevronRight, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Screen, StateView, useTheme, type ThemeContextValue } from '@school-erp/ui';
import { mockAssignments, type MockAssignment } from '@/mock/assignments';
import { fonts } from '@/theme/fonts';

type Tab = 'upcoming' | 'past';
type DueFilter = 'all' | 'week' | 'month';

const TABS: readonly { key: Tab; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
];
const DUE_FILTERS: readonly { key: DueFilter; label: string }[] = [
  { key: 'all', label: 'All dates' },
  { key: 'week', label: 'Due within 7 days of today' },
  { key: 'month', label: 'Due this month' },
];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const LINK_BLUE = '#2563EB';
const DAY_MS = 86_400_000;

/** Upcoming: due today or later. Past: due before today. */
export function isUpcoming(a: MockAssignment, today: Date): boolean {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return a.dueOn.getTime() >= t;
}

export function matchesSearch(a: MockAssignment, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [a.subject, a.title, a.description].some((s) => s.toLowerCase().includes(q));
}

export function matchesDueFilter(a: MockAssignment, filter: DueFilter, today: Date): boolean {
  if (filter === 'all') return true;
  if (filter === 'month') {
    return a.dueOn.getMonth() === today.getMonth() && a.dueOn.getFullYear() === today.getFullYear();
  }
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.abs(a.dueOn.getTime() - t) <= 7 * DAY_MS;
}

/**
 * Assignment list, built to the approved design: search with a calendar filter, Upcoming / Past
 * tabs, and one card per assignment with assigned date, due date, total marks, subject and a
 * two-line description that expands with "View More". MOCK data only.
 */
export function AssignmentListScreen() {
  const router = useRouter();
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;

  const today = useMemo(() => new Date(), []);
  const all = useMemo(() => mockAssignments(today), [today]);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [query, setQuery] = useState('');
  const [dueFilter, setDueFilter] = useState<DueFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());

  const visible = all
    .filter((a) => isUpcoming(a, today) === (tab === 'upcoming'))
    .filter((a) => matchesSearch(a, query))
    .filter((a) => matchesDueFilter(a, dueFilter, today))
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
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title} accessibilityRole="header">
          Assignment
        </Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.search}>
          <Search size={18} color={colors.textSecondary} />
          <TextInput
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
          accessibilityLabel="Filter by due date"
          onPress={() => setFilterOpen(true)}
          style={[styles.calendarButton, dueFilter !== 'all' && styles.calendarButtonActive]}
        >
          <CalendarDays size={20} color={dueFilter !== 'all' ? colors.primary : colors.text} />
        </Pressable>
      </View>

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
          title="No assignments"
          description={
            query || dueFilter !== 'all' ? 'Try another search or date filter.' : undefined
          }
        />
      ) : (
        <View style={styles.list}>
          {visible.map((a) => {
            const open = expanded.has(a.id);
            return (
              <View key={a.id} style={styles.card} testID={`assignment-${a.id}`}>
                <View style={styles.cardTop}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateDay}>{a.assignedOn.getDate()}</Text>
                    <Text style={styles.dateMonth}>{MONTHS[a.assignedOn.getMonth()]}</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoValue}>
                      {a.dueOn.getDate()} {MONTHS[a.dueOn.getMonth()]}
                    </Text>
                    <Text style={styles.infoLabel}>Due Date</Text>
                  </View>
                  <View style={styles.spacer} />
                  <View style={[styles.infoBox, styles.marksBox]}>
                    <Text style={styles.infoValue}>{a.totalMarks}</Text>
                    <Text style={styles.infoLabel}>Total Marks</Text>
                  </View>
                </View>

                <Text style={styles.subject}>{a.subject}</Text>
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
                      size={14}
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

      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Close date filter"
          onPress={() => setFilterOpen(false)}
        />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <Text style={styles.sheetTitle}>Filter by due date</Text>
          {DUE_FILTERS.map((f) => {
            const active = f.key === dueFilter;
            return (
              <Pressable
                key={f.key}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setDueFilter(f.key);
                  setFilterOpen(false);
                }}
                style={styles.sheetOption}
              >
                <Text style={[styles.sheetOptionText, active && styles.sheetOptionActive]}>
                  {f.label}
                </Text>
                {active ? <Check size={18} color={colors.primary} /> : null}
              </Pressable>
            );
          })}
        </SafeAreaView>
      </Modal>
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
    subject: { marginTop: spacing.md, color: colors.text, fontSize: 16, fontFamily: fonts.bold },
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
    backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
    sheet: {
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
    sheetOptionActive: { color: colors.primary, fontFamily: fonts.semibold },
  });
}
