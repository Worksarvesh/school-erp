import { useLocalSearchParams, useRouter } from 'expo-router';
import { BookMarked, ChevronRight, Lock } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Screen, StateView, StyleSheet, Text, scaled } from '@school-erp/ui';
import { comingSoon } from '@/features/dashboard/quickActions';
import { mockSyllabusSubjects, syllabusProgress, type MockChapter } from '@/mock/syllabus';
import { fonts } from '@/theme/fonts';
import {
  CHAPTER_STATUS as STATUS,
  ProgressBar,
  ProgressRing,
  StatusPill,
  SYLLABUS_BLUE as BLUE,
  SyllabusHeader,
} from '../components/SyllabusKit';

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
 * chapter with its status and a lock on chapters not yet completed, and a "Keep going!" card at the end.
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
            const locked = c.status !== 'completed';
            return (
              <View key={c.id} style={styles.card}>
                <Pressable
                  testID={`chapter-${c.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${c.title}, ${s.label}`}
                  onPress={() =>
                    router.push({
                      pathname: '/syllabus/chapter/[chapterId]',
                      params: { chapterId: c.id },
                    })
                  }
                  style={({ pressed }) => [styles.cardMain, pressed && styles.cardPressed]}
                >
                  <View style={[styles.chapterIcon, { backgroundColor: s.iconBg }]}>
                    <Icon
                      size={scaled(14)}
                      color={s.iconColor}
                      fill={s.filled ? s.iconColor : 'transparent'}
                    />
                  </View>
                  <View style={styles.chapterText}>
                    <Text style={styles.chapterTitle} numberOfLines={2}>
                      {c.title}
                    </Text>
                    <Text style={styles.chapterSub}>{chapterSubtitle(c)}</Text>
                  </View>
                  <StatusPill status={c.status} />
                </Pressable>
                <View style={styles.lockSlot}>
                  {locked ? (
                    <Lock
                      testID={`chapter-lock-${c.id}`}
                      accessibilityLabel="Locked"
                      size={scaled(15)}
                      color="#9CA3AF"
                    />
                  ) : null}
                </View>
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
          <BookMarked size={scaled(18)} color="#FFFFFF" />
        </View>
        <View style={styles.keepText}>
          <Text style={styles.keepTitle}>Keep going!</Text>
          <Text style={styles.keepSub}>You&apos;re doing great! 💜</Text>
        </View>
        <ChevronRight size={scaled(18)} color="#5B21B6" />
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
    gap: 6,
    paddingRight: 10,
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
  cardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingLeft: 12,
    borderRadius: 12,
  },
  cardPressed: { backgroundColor: '#FAFAFB' },
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
  lockSlot: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
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
