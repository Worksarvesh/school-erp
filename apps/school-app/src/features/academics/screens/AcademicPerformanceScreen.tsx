import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  ArrowLeft,
  Book,
  Check,
  FileText,
  FlaskConical,
  Globe,
  type LucideIcon,
} from 'lucide-react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TAB_BAR_SPACE } from '@/features/dashboard/components/FloatingTabBar';
import {
  ACADEMIC_FILTERS,
  CLASS_PERFORMANCE_MOCK as DATA,
  STUDENT_MOCK,
  type SubjectIcon,
} from '@/mock/academics';
import { FilterSelect } from '../components/FilterSelect';
import { StudentCard } from '../components/StudentCard';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundles static images only through require().
const TROPHY = require('../../../../assets/academics-trophy.png');

const BLUE = '#2563EB';
/** Removes the black focus ring the browser draws around inputs (web only). */
const NO_OUTLINE = { outlineStyle: 'none', outlineWidth: 0 } as object;
/** Hindi is drawn as the letter, not an icon. */
const ICONS: Record<Exclude<SubjectIcon, 'hindi'>, LucideIcon> = {
  maths: FileText,
  science: FlaskConical,
  english: Book,
  social: Globe,
};

type PerformanceView = 'class' | 'student';

const RING = 64;
const RING_STROKE = 8;

function PassRing({ percent }: { percent: number }) {
  const radius = (RING - RING_STROKE) / 2;
  const length = 2 * Math.PI * radius;
  return (
    <View style={styles.ring} accessible accessibilityLabel={`Pass percentage: ${percent} percent`}>
      <Svg width={RING} height={RING}>
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={radius}
          stroke="#DDE3EC"
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={RING / 2}
          cy={RING / 2}
          r={radius}
          stroke={BLUE}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeDasharray={`${(length * percent) / 100} ${length}`}
          // Start at the top instead of 3 o'clock.
          transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
        />
      </Svg>
      <Text style={styles.ringText}>{percent}%</Text>
    </View>
  );
}

/**
 * SCHOOL-ACADEMIC-PERFORMANCE: exam results for a class or for one student. MOCK: the numbers do
 * not change with the class, section or examination. In the class view the subject filter hides the
 * other rows; in the student view the roll number or name picks the student.
 */
export function AcademicPerformanceScreen() {
  const router = useRouter();
  const [view, setView] = useState<PerformanceView>('class');
  const [filters, setFilters] = useState({
    class: '10th',
    section: 'A',
    subject: 'All',
    examination: 'Annual Exam',
  });

  const [query, setQuery] = useState('');

  const set = (key: keyof typeof filters) => (value: string) =>
    setFilters((f) => ({ ...f, [key]: value }));

  const isStudent = view === 'student';
  const subjects = DATA.subjects.filter(
    (s) => isStudent || filters.subject === 'All' || s.name === filters.subject,
  );
  // Empty shows the design's student; otherwise match the exact roll number or part of the name.
  const wanted = query.trim().toLowerCase();
  const found =
    !wanted ||
    (/^\d+$/.test(wanted)
      ? Number(wanted) === STUDENT_MOCK.roll
      : STUDENT_MOCK.name.toLowerCase().includes(wanted));

  const toggle = (key: PerformanceView, label: string) => {
    const selected = view === key;
    return (
      <Pressable
        testID={`performance-${key}`}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        onPress={() => setView(key)}
        style={[
          styles.toggle,
          key === 'class' ? styles.toggleClass : styles.toggleStudent,
          selected && styles.toggleSelected,
        ]}
      >
        <Text style={[styles.toggleText, selected && styles.toggleTextSelected]}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          testID="academics-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={() => router.navigate('/(tabs)')}
          style={styles.back}
        >
          <ArrowLeft size={24} color="#1E293B" strokeWidth={2.2} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          Academic Performance
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.toggles}>
          {toggle('class', 'Class Performance')}
          {toggle('student', 'Student Performance')}
        </View>

        <View style={styles.filters}>
          <FilterSelect
            testID="filter-class"
            label="Class"
            value={filters.class}
            options={ACADEMIC_FILTERS.class}
            onChange={set('class')}
          />
          <FilterSelect
            testID="filter-section"
            label="Section"
            value={filters.section}
            options={ACADEMIC_FILTERS.section}
            onChange={set('section')}
          />
          {isStudent ? (
            <View style={styles.search}>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.searchLabel}>
                Roll No./Name
              </Text>
              <TextInput
                testID="student-search"
                accessibilityLabel="Roll number or name"
                autoCorrect={false}
                maxLength={60}
                value={query}
                onChangeText={setQuery}
                style={[styles.searchInput, NO_OUTLINE]}
              />
            </View>
          ) : (
            <FilterSelect
              testID="filter-subject"
              label="Subject"
              value={filters.subject}
              options={ACADEMIC_FILTERS.subject}
              onChange={set('subject')}
            />
          )}
          <FilterSelect
            testID="filter-examination"
            label="Examination"
            value={filters.examination}
            options={ACADEMIC_FILTERS.examination}
            onChange={set('examination')}
          />
        </View>

        {isStudent && !found ? (
          <Text style={styles.empty}>No student found.</Text>
        ) : (
          <>
            {isStudent ? <StudentCard student={STUDENT_MOCK} /> : null}
            <View style={[styles.summary, isStudent && styles.summaryStudent]}>
              <Image source={TROPHY} style={styles.trophy} />
              <View style={styles.summaryDivider} />
              <View style={styles.marks}>
                <Text style={styles.marksLabel}>Total Marks</Text>
                <Text style={styles.marksValue}>{DATA.totalMarks}</Text>
                <Text style={[styles.marksLabel, styles.obtained]}>Obtained Marks</Text>
                <Text style={styles.marksValue}>{DATA.obtainedMarks}</Text>
              </View>
              <View style={styles.pass}>
                <PassRing percent={DATA.passPercentage} />
                <Text numberOfLines={1} style={styles.passLabel}>
                  Pass Percentage
                </Text>
              </View>
            </View>

            <View style={styles.status}>
              <View style={styles.statusLeft}>
                <View style={styles.tick}>
                  <Check size={16} color="#FFFFFF" strokeWidth={4} />
                </View>
                <Text style={styles.statusText}>
                  Status : <Text style={styles.passed}>{DATA.status}</Text>
                </Text>
              </View>
              <View style={styles.statusDivider} />
              <View style={styles.rank}>
                <Text style={styles.rankLabel}>Class Performance</Text>
                <View
                  style={styles.rankRow}
                  accessible
                  accessibilityLabel={`${DATA.rank.number}${DATA.rank.suffix} rank`}
                >
                  <Text style={styles.rankText}>{DATA.rank.number}</Text>
                  <Text style={styles.rankSuffix}>{DATA.rank.suffix}</Text>
                  <Text style={styles.rankText}> Rank 👑</Text>
                </View>
              </View>
            </View>

            <View style={styles.subjects}>
              <View style={styles.subjectsHeading}>
                <Svg width={17} height={16}>
                  <Rect x={0} y={7} width={4} height={9} rx={1} fill={BLUE} />
                  <Rect x={6} y={0} width={4} height={16} rx={1} fill={BLUE} />
                  <Rect x={12} y={4} width={4} height={12} rx={1} fill={BLUE} />
                </Svg>
                <Text style={styles.subjectsTitle}>Subject Performance</Text>
              </View>
              {subjects.map((s) => {
                const percent = Math.round((s.marks / s.outOf) * 100);
                const Icon = s.icon === 'hindi' ? null : ICONS[s.icon];
                return (
                  <View
                    key={s.name}
                    testID={`subject-${s.name}`}
                    style={styles.subject}
                    accessible
                    accessibilityLabel={`${s.name}: ${s.marks} of ${s.outOf}, ${percent} percent`}
                  >
                    <View style={styles.subjectIcon}>
                      {Icon ? (
                        <Icon size={13} color="#FFFFFF" strokeWidth={2.4} />
                      ) : (
                        <Text style={styles.hindi}>अ</Text>
                      )}
                    </View>
                    <Text numberOfLines={1} style={styles.subjectName}>
                      {s.name}
                    </Text>
                    <Text style={styles.subjectMarks}>
                      <Text style={styles.subjectScore}>{s.marks}</Text> / {s.outOf}
                    </Text>
                    <Text style={styles.subjectPercent}>{percent}%</Text>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${percent}%` }]} />
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const soft = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.07,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { height: 48, marginTop: -2, justifyContent: 'center' },
  back: { position: 'absolute', left: 18, zIndex: 1 },
  title: {
    textAlign: 'center',
    color: '#1E293B',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    paddingLeft: 8,
  },
  toggles: {
    marginTop: 11,
    paddingLeft: 20,
    paddingRight: 29,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggle: {
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#A3A3A3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleClass: { width: 141 },
  toggleStudent: { width: 153 },
  toggleSelected: { backgroundColor: '#1D4ED8', borderColor: '#1D4ED8' },
  toggleText: { color: '#475569', fontSize: 12.5, fontWeight: '500' },
  toggleTextSelected: { color: '#FFFFFF' },
  empty: { marginTop: 60, textAlign: 'center', color: '#555555', fontSize: 14 },
  search: { flex: 1 },
  searchLabel: { marginLeft: 4, color: '#444444', fontSize: 11, lineHeight: 17 },
  searchInput: {
    marginTop: 1,
    height: 22,
    minWidth: 0,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 0,
    color: '#334155',
    fontSize: 11.5,
    fontWeight: '600',
  },
  filters: {
    ...soft,
    marginTop: 16,
    marginLeft: 20,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 9,
    paddingBottom: 10,
    flexDirection: 'row',
    gap: 6,
  },
  summary: {
    marginTop: 6,
    marginHorizontal: 20,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#E7F0FD',
    flexDirection: 'row',
  },
  summaryStudent: { marginTop: 13 },
  trophy: { marginLeft: 20, marginTop: 23, width: 93, height: 94 },
  summaryDivider: {
    marginLeft: 1,
    marginTop: 38,
    width: 1,
    height: 64,
    backgroundColor: '#CBD5E1',
  },
  marks: { flex: 1, marginLeft: 10, marginTop: 19 },
  marksLabel: { color: '#475569', fontSize: 11.5, lineHeight: 18, fontWeight: '500' },
  obtained: { marginTop: 8 },
  marksValue: { color: '#0F2847', fontSize: 24, lineHeight: 32, fontWeight: '800' },
  pass: { marginRight: 3, marginTop: 28, alignItems: 'center' },
  ring: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  ringText: { position: 'absolute', color: '#0F2847', fontSize: 13, fontWeight: '800' },
  passLabel: { marginTop: 4, color: '#334155', fontSize: 10.5, fontWeight: '600' },
  status: {
    marginTop: 15,
    marginLeft: 20,
    marginRight: 23,
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D1EFE1',
    backgroundColor: '#EBF8F3',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLeft: { flex: 190, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 18 },
  tick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { color: '#334155', fontSize: 15, fontWeight: '700' },
  passed: { color: '#059669' },
  statusDivider: { width: 1, height: 28, backgroundColor: '#D5DEE0' },
  rank: { flex: 167, paddingLeft: 35 },
  rankLabel: { color: '#475569', fontSize: 12.5, lineHeight: 17 },
  rankRow: { flexDirection: 'row', alignItems: 'flex-start' },
  rankText: { color: '#0F2847', fontSize: 16, lineHeight: 22, fontWeight: '800' },
  rankSuffix: { color: '#0F2847', fontSize: 10, lineHeight: 14, fontWeight: '800' },
  subjects: {
    ...soft,
    marginTop: 14,
    marginLeft: 20,
    marginRight: 23,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingTop: 13,
    paddingBottom: 8,
    paddingLeft: 14,
    paddingRight: 20,
  },
  subjectsHeading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 7 },
  subjectsTitle: { color: '#0F2847', fontSize: 14.5, lineHeight: 20, fontWeight: '700' },
  subject: { height: 30, flexDirection: 'row', alignItems: 'center' },
  subjectIcon: {
    width: 20,
    height: 20,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hindi: { color: '#FFFFFF', fontSize: 12, lineHeight: 16, fontWeight: '700' },
  subjectName: { width: 100, paddingLeft: 8, color: '#334155', fontSize: 12.5 },
  subjectMarks: { width: 61, color: '#475569', fontSize: 11.5 },
  subjectScore: { fontWeight: '700' },
  subjectPercent: { width: 40, color: '#0F172A', fontSize: 11.5, fontWeight: '800' },
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DBEAFE',
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4, backgroundColor: BLUE },
});
