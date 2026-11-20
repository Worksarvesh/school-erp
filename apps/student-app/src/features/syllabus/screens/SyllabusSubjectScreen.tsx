import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  BookMarked,
  Check,
  ChevronRight,
  Download,
  Leaf,
  Lock,
  Play,
  type LucideIcon,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen, StateView } from '@school-erp/ui';
import { comingSoon } from '@/features/dashboard/quickActions';
import {
  mockSyllabusSubjects,
  syllabusProgress,
  type ChapterStatus,
  type MockChapter,
} from '@/mock/syllabus';
import { fonts } from '@/theme/fonts';
import { ProgressBar, ProgressRing, SyllabusHeader } from '../components/SyllabusKit';

const BLUE = '#2F6FED';

const STATUS: Record<
  ChapterStatus,
  {
    label: string;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
    /** Filled play icon for in-progress and upcoming chapters. */
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
    iconBg: BLUE,
    iconColor: '#FFFFFF',
    filled: true,
    pillBg: '#E5EEFE',
    pillFg: BLUE,
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

function chapterSubtitle(c: MockChapter): string {
  if (c.status === 'completed') return `${c.topics} Topics`;
  return c.status === 'in_progress' ? 'In Progress' : 'Upcoming';
}

/** Matches chapter title, ignoring case. */
export function matchesChapter(c: MockChapter, query: string): boolean {
  const q = query.trim().toLowerCase();
  return !q || c.title.toLowerCase().includes(q);
}

/**
 * One subject's syllabus, built to the approved design: teacher and progress summary, then each
 * chapter with its status and a download button, and a "Keep going!" card at the end.
 * MOCK data only.
 */
export function SyllabusSubjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const subject = mockSyllabusSubjects.find((s) => s.id === id);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const header = (
    <SyllabusHeader
      title={subject?.name ?? 'Syllabus'}
      testID="syllabus-subject"
      searching={searching}
      query={query}
      placeholder="Search chapters"
      onSearchChange={setQuery}
      onToggleSearch={() => {
        if (searching) setQuery('');
        setSearching((s) => !s);
      }}
    />
  );

  if (!subject) {
    return (
      <Screen>
        {header}
        <StateView state="empty" title="Subject not found" />
      </Screen>
    );
  }

  const { done, total, percent } = syllabusProgress(subject);
  const chapters = subject.chapters.filter((c) => matchesChapter(c, query));

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {header}

      <View style={styles.summary}>
        <View style={styles.summaryText}>
          <Text style={styles.teacher}>Teacher: {subject.teacher}</Text>
          <View style={styles.summaryBar}>
            <ProgressBar percent={percent} color={BLUE} />
          </View>
          <Text style={styles.summaryChapters}>
            {done} / {total} Chapters
          </Text>
        </View>
        <ProgressRing
          percent={percent}
          color={BLUE}
          size={48}
          stroke={4}
          fontSize={11}
          testID="syllabus-subject-progress"
        />
      </View>

      {chapters.length === 0 ? (
        <StateView state="empty" title="No chapters found" description="Try another search." />
      ) : (
        <View style={styles.list}>
          {chapters.map((c) => {
            const s = STATUS[c.status];
            const Icon = s.icon;
            const PillIcon = s.pillIcon;
            const locked = c.status === 'upcoming';
            return (
              <View key={c.id} style={styles.card} testID={`chapter-${c.id}`}>
                <View style={[styles.chapterIcon, { backgroundColor: s.iconBg }]}>
                  <Icon
                    size={14}
                    color={s.iconColor}
                    fill={s.filled ? s.iconColor : 'transparent'}
                  />
                </View>
                <View style={styles.chapterText}>
                  <Text style={styles.chapterTitle} numberOfLines={1}>
                    {c.title}
                  </Text>
                  <Text style={styles.chapterSub}>{chapterSubtitle(c)}</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: s.pillBg }]}>
                  <PillIcon
                    size={9}
                    color={s.pillFg}
                    fill={c.status === 'in_progress' ? s.pillFg : 'transparent'}
                  />
                  <Text style={[styles.pillText, { color: s.pillFg }]}>{s.label}</Text>
                </View>
                <Pressable
                  testID={`chapter-download-${c.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Download ${c.title}`}
                  accessibilityState={{ disabled: locked }}
                  disabled={locked}
                  onPress={() => router.push(comingSoon('Chapter downloads'))}
                  hitSlop={8}
                  style={styles.download}
                >
                  <Download size={15} color={locked ? '#C4C8CF' : '#374151'} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      <Pressable
        testID="syllabus-keep-going"
        accessibilityRole="button"
        accessibilityLabel="Keep going! You're doing great!"
        onPress={() => router.push(comingSoon('Study tips'))}
        style={({ pressed }) => [styles.keepGoing, pressed && styles.keepGoingPressed]}
      >
        <View style={styles.keepIcon}>
          <BookMarked size={18} color="#FFFFFF" />
        </View>
        <View style={styles.keepText}>
          <Text style={styles.keepTitle}>Keep going!</Text>
          <Text style={styles.keepSub}>You&apos;re doing great! 💜</Text>
        </View>
        <ChevronRight size={18} color="#5B21B6" />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginHorizontal: 16,
    marginTop: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F4',
  },
  summaryText: { flex: 1 },
  teacher: { color: '#111827', fontSize: 13, fontFamily: fonts.semibold },
  summaryBar: { marginTop: 8 },
  summaryChapters: { color: '#6B7280', fontSize: 10.5, fontFamily: fonts.regular, marginTop: 5 },
  list: { paddingHorizontal: 16, paddingTop: 14, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F1F4',
    shadowColor: '#1F2937',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  chapterIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterText: { flex: 1 },
  chapterTitle: { color: '#111827', fontSize: 12, fontFamily: fonts.semibold },
  chapterSub: { color: '#6B7280', fontSize: 10, fontFamily: fonts.regular, marginTop: 2 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: { fontSize: 9, fontFamily: fonts.semibold },
  download: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  keepGoing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 22,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#EFE7FC',
    borderWidth: 1,
    borderColor: '#E1D3FA',
  },
  keepGoingPressed: { opacity: 0.85 },
  keepIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#6D28D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keepText: { flex: 1 },
  keepTitle: { color: '#3B0F8C', fontSize: 13, fontFamily: fonts.bold },
  keepSub: { color: '#5B21B6', fontSize: 11, fontFamily: fonts.regular, marginTop: 1 },
});
