import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, StateView } from '@school-erp/ui';
import { chapterTopics, findChapter, type MockTopic } from '@/mock/syllabus';
import { fonts } from '@/theme/fonts';
import {
  CHAPTER_STATUS,
  ProgressBar,
  ProgressRing,
  StatusPill,
  SYLLABUS_BLUE,
  SyllabusHeader,
} from '../components/SyllabusKit';

const TOPIC_NOTE = {
  completed: 'Completed',
  in_progress: 'Being taught now',
  upcoming: 'Coming up',
} as const;

/**
 * One chapter: subject, teacher and topic progress, then the completed topics and the remaining
 * ones (current and upcoming) in two groups. MOCK sample topics only.
 */
export function SyllabusChapterScreen() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const found = chapterId ? findChapter(chapterId) : undefined;
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');

  const header = (
    <SyllabusHeader
      title={found ? (found.chapter.title.split(' - ')[0] ?? 'Chapter') : 'Chapter'}
      testID="syllabus-chapter"
      searching={searching}
      query={query}
      placeholder="Search topics"
      onSearchChange={setQuery}
      onToggleSearch={() => {
        if (searching) setQuery('');
        setSearching((s) => !s);
      }}
    />
  );

  if (!found) {
    return (
      <Screen>
        {header}
        <StateView state="empty" title="Chapter not found" />
      </Screen>
    );
  }

  const { subject, chapter } = found;
  const topics = chapterTopics(chapter);
  const doneCount = topics.filter((t) => t.status === 'completed').length;
  const percent = topics.length ? Math.round((doneCount / topics.length) * 100) : 0;
  const q = query.trim().toLowerCase();
  const shown = topics.filter((t) => !q || t.title.toLowerCase().includes(q));
  const completed = shown.filter((t) => t.status === 'completed');
  const remaining = shown.filter((t) => t.status !== 'completed');

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {header}

      <View style={styles.summary}>
        <View style={styles.summaryText}>
          <Text style={styles.subject}>{subject.name}</Text>
          <Text style={styles.chapterTitle}>{chapter.title.split(' - ')[1] ?? chapter.title}</Text>
          <Text style={styles.teacher}>Teacher: {subject.teacher}</Text>
          <View style={styles.statusRow}>
            <StatusPill status={chapter.status} />
          </View>
          <View style={styles.bar}>
            <ProgressBar percent={percent} color={SYLLABUS_BLUE} />
          </View>
          <Text style={styles.count}>
            {doneCount} / {topics.length} Topics completed
          </Text>
        </View>
        <ProgressRing
          percent={percent}
          color={SYLLABUS_BLUE}
          size={52}
          stroke={4.5}
          fontSize={12}
          testID="syllabus-chapter-progress"
        />
      </View>

      {shown.length === 0 ? (
        <StateView state="empty" title="No topics found" description="Try another search." />
      ) : (
        <>
          {completed.length > 0 ? (
            <TopicGroup title="Completed Topics" topics={completed} testID="topics-completed" />
          ) : null}
          {remaining.length > 0 ? (
            <TopicGroup title="Remaining Topics" topics={remaining} testID="topics-remaining" />
          ) : null}
        </>
      )}
    </Screen>
  );
}

function TopicGroup({
  title,
  topics,
  testID,
}: {
  title: string;
  topics: readonly MockTopic[];
  testID: string;
}) {
  return (
    <View testID={testID}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{title}</Text>
        <Text style={styles.groupCount}>{topics.length}</Text>
      </View>
      <View style={styles.list}>
        {topics.map((t) => {
          const s = CHAPTER_STATUS[t.status];
          const Icon = s.icon;
          return (
            <View
              key={t.id}
              style={styles.card}
              testID={`topic-${t.id}`}
              accessible
              accessibilityLabel={`${t.title}, ${s.label}`}
            >
              <View style={[styles.icon, { backgroundColor: s.iconBg }]}>
                <Icon size={13} color={s.iconColor} fill={s.filled ? s.iconColor : 'transparent'} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.topicTitle}>{t.title}</Text>
                <Text style={styles.topicNote}>{TOPIC_NOTE[t.status]}</Text>
              </View>
              <StatusPill status={t.status} />
            </View>
          );
        })}
      </View>
    </View>
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
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F5F8FF',
    borderWidth: 1,
    borderColor: '#E3EBFD',
  },
  summaryText: { flex: 1 },
  subject: { color: SYLLABUS_BLUE, fontSize: 12, fontFamily: fonts.semibold },
  chapterTitle: { color: '#111827', fontSize: 17, fontFamily: fonts.bold, marginTop: 2 },
  teacher: { color: '#6B7280', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },
  statusRow: { flexDirection: 'row', marginTop: 8 },
  bar: { marginTop: 10 },
  count: { color: '#6B7280', fontSize: 10.5, fontFamily: fonts.regular, marginTop: 5 },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 20,
  },
  groupTitle: { color: '#111827', fontSize: 14, fontFamily: fonts.bold },
  groupCount: { color: '#6B7280', fontSize: 12, fontFamily: fonts.medium },
  list: { paddingHorizontal: 16, paddingTop: 10, gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F1F4',
  },
  icon: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1 },
  topicTitle: { color: '#111827', fontSize: 12.5, fontFamily: fonts.semibold },
  topicNote: { color: '#6B7280', fontSize: 10, fontFamily: fonts.regular, marginTop: 2 },
});
