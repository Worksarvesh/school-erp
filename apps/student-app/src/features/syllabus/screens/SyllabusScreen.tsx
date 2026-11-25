import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Screen, StateView, StyleSheet, Text, scaled } from '@school-erp/ui';
import { mockSyllabusSubjects, syllabusProgress, type MockSyllabusSubject } from '@/mock/syllabus';
import { fonts } from '@/theme/fonts';
import { homeImages } from '@/theme/images';
import { ProgressBar, ProgressRing, SyllabusHeader, subjectStyle } from '../components/SyllabusKit';

/** Matches subject name or teacher, ignoring case. */
export function matchesSubject(subject: MockSyllabusSubject, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [subject.name, subject.teacher].some((s) => s.toLowerCase().includes(q));
}

/**
 * Syllabus home, built to the approved design: "Learn, Grow, Achieve" banner and one card per
 * subject with teacher, chapter progress bar and percentage ring. Cards open the chapter list.
 * MOCK data only.
 */
export function SyllabusScreen() {
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const subjects = mockSyllabusSubjects.filter((s) => matchesSubject(s, query));

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <SyllabusHeader
        title="Syllabus"
        testID="syllabus"
        searching={searching}
        query={query}
        placeholder="Search subjects or teachers"
        onSearchChange={setQuery}
        onToggleSearch={() => {
          if (searching) setQuery('');
          setSearching((s) => !s);
        }}
      />

      <View style={styles.banner}>
        <View style={styles.bannerArt}>
          <Image source={homeImages.books} style={styles.books} resizeMode="contain" />
        </View>
        <View style={styles.bannerTextBox}>
          <Text style={styles.bannerText}>Learn</Text>
          <Text style={styles.bannerText}>Grow</Text>
          <Text style={styles.bannerText}>Achieve 💜</Text>
        </View>
      </View>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>Subjects</Text>
        <Text style={styles.sectionCount}>{subjects.length} Subjects</Text>
      </View>

      {subjects.length === 0 ? (
        <StateView state="empty" title="No subjects found" description="Try another search." />
      ) : (
        <View style={styles.list}>
          {subjects.map((s) => {
            const { done, total, percent } = syllabusProgress(s);
            const look = subjectStyle(s.name);
            const Icon = look.icon;
            return (
              <Pressable
                key={s.id}
                testID={`syllabus-subject-${s.id}`}
                accessibilityRole="button"
                accessibilityLabel={`${s.name}, ${done} of ${total} chapters, ${percent} percent`}
                onPress={() => router.push({ pathname: '/syllabus/[id]', params: { id: s.id } })}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={[styles.tile, { backgroundColor: look.tile }]}>
                  <Icon size={scaled(20)} color="#FFFFFF" />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.subject}>{s.name}</Text>
                  <Text style={styles.teacher}>Teacher: {s.teacher}</Text>
                  <View style={styles.bar}>
                    <ProgressBar percent={percent} color={look.accent} />
                  </View>
                  <Text style={styles.chapters}>
                    {done} / {total} Chapters
                  </Text>
                </View>
                <ProgressRing percent={percent} color={look.accent} />
                <ChevronRight size={scaled(18)} color="#6B7280" />
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  banner: {
    marginHorizontal: 16,
    marginTop: 4,
    height: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: '#E3EEFC',
  },
  bannerArt: { width: 72, height: 80, alignItems: 'center', justifyContent: 'center' },
  books: { width: 72, height: 72 },
  bannerTextBox: { flex: 1 },
  bannerText: {
    color: '#1E3A8A',
    fontSize: 16,
    lineHeight: 21,
    fontFamily: fonts.semibold,
    fontStyle: 'italic',
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 18,
  },
  sectionTitle: { color: '#111827', fontSize: 15, fontFamily: fonts.bold },
  sectionCount: { color: '#6B7280', fontSize: 11, fontFamily: fonts.regular },
  list: { paddingHorizontal: 16, paddingTop: 10, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F1F4',
    shadowColor: '#1F2937',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pressed: { backgroundColor: '#FAFAFB' },
  tile: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: { flex: 1 },
  subject: { color: '#111827', fontSize: 14, fontFamily: fonts.bold },
  teacher: { color: '#6B7280', fontSize: 10.5, fontFamily: fonts.regular, marginTop: 1 },
  bar: { marginTop: 6 },
  chapters: { color: '#6B7280', fontSize: 9.5, fontFamily: fonts.regular, marginTop: 4 },
});
