import {
  BookOpen,
  Calculator,
  CalendarDays,
  Check,
  CircleCheck,
  FlaskConical,
  Globe,
  Monitor,
  NotebookText,
  UserRound,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Screen } from '@school-erp/ui';
import { mockExamResults, type MockExamResult } from '@/mock/exams';
import { fonts } from '@/theme/fonts';
import { homeImages } from '@/theme/images';
import { ExamHeader } from '../components/ExamKit';

const PURPLE = '#6D28D9';
const HEADER_PURPLE = '#7C3AED';

/** Icon and tint per subject in the marks table; other subjects use a book icon. */
const SUBJECT_ICONS: Record<string, { icon: LucideIcon; bg: string; fg: string }> = {
  Mathematics: { icon: Calculator, bg: '#EDE9FE', fg: '#7C3AED' },
  Science: { icon: FlaskConical, bg: '#FFEDD5', fg: '#EA580C' },
  Computer: { icon: Monitor, bg: '#DBEAFE', fg: '#2563EB' },
  English: { icon: BookOpen, bg: '#FFEDD5', fg: '#F97316' },
  'Social Science': { icon: Globe, bg: '#CCFBF1', fg: '#0D9488' },
};
const DEFAULT_SUBJECT_ICON = { icon: BookOpen, bg: '#F3F4F6', fg: '#4B5563' };

/** Grade pill colours: A+ green, A blue, anything else amber. */
function gradeColors(grade: string): { bg: string; fg: string } {
  if (grade === 'A+') return { bg: '#DCFCE7', fg: '#15803D' };
  if (grade === 'A') return { bg: '#DBEAFE', fg: '#1D4ED8' };
  return { bg: '#FEF3C7', fg: '#B45309' };
}

export function resultTotals(result: MockExamResult): {
  max: number;
  obtained: number;
  percent: number;
} {
  const max = result.subjects.reduce((s, x) => s + x.maxMarks, 0);
  const obtained = result.subjects.reduce((s, x) => s + x.obtained, 0);
  return { max, obtained, percent: max ? Math.round((obtained / max) * 100) : 0 };
}

/**
 * Exam result, built to the approved design: exam summary card, overall result (score ring, pass
 * status, grade) and the subject-wise marks table. "Previous Exam" switches to another published
 * result. MOCK data only.
 */
export function ExamResultScreen() {
  const [resultId, setResultId] = useState(mockExamResults[0]?.id ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const result = mockExamResults.find((r) => r.id === resultId) ?? mockExamResults[0];
  const totals = useMemo(() => (result ? resultTotals(result) : null), [result]);

  if (!result || !totals) {
    return (
      <Screen>
        <ExamHeader title="Result" testID="exam-result" />
      </Screen>
    );
  }

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      <ExamHeader title="Result" testID="exam-result" />

      <View style={styles.summaryCard}>
        <View style={styles.summaryTop}>
          <View style={styles.artBox}>
            <Image source={homeImages.books} style={styles.books} resizeMode="contain" />
            <Image source={homeImages.gradcap} style={styles.cap} resizeMode="contain" />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.examTitle}>{result.title}</Text>
            <Text style={styles.examYear}>
              Academic Year : <Text style={styles.examYearValue}>{result.academicYear}</Text>
            </Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <InfoItem icon={UserRound} label="Class" value={result.className} />
          <View style={styles.infoDivider} />
          <InfoItem icon={NotebookText} label="Semester" value={result.semester} />
          <View style={styles.infoDivider} />
          <Pressable
            testID="exam-result-previous"
            accessibilityRole="button"
            accessibilityLabel="Previous exam"
            onPress={() => setPickerOpen(true)}
            style={styles.infoItem}
          >
            <View style={styles.infoIcon}>
              <CalendarDays size={13} color={PURPLE} />
            </View>
            <Text style={styles.previousText}>Previous{'\n'}Exam</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Overall Result</Text>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>Official Status</Text>
          </View>
        </View>
        <View style={styles.overallBody}>
          <ScoreRing percent={totals.percent} />
          <View style={styles.statusCol}>
            <View style={[styles.statusPill, !result.passed && styles.statusPillFail]}>
              <CircleCheck size={16} color="#FFFFFF" fill={result.passed ? '#16A34A' : '#DC2626'} />
              <Text style={[styles.statusText, !result.passed && styles.statusTextFail]}>
                {result.passed ? 'Pass' : 'Fail'}
              </Text>
            </View>
            <Text style={styles.remark}>{result.remark}</Text>
          </View>
          <View style={styles.gradeBox}>
            <Text style={styles.gradeLabel}>GRADE</Text>
            <Text style={styles.gradeValue}>{result.overallGrade}</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Subject-Wise Marks</Text>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>{result.subjects.length} Subjects</Text>
          </View>
        </View>
        <View style={[styles.tableRow, styles.tableHead]}>
          <Text style={[styles.th, styles.subjectCol]}>SUBJECT</Text>
          <Text style={[styles.th, styles.numCol]}>MAX{'\n'}MARKS</Text>
          <Text style={[styles.th, styles.numCol]}>OBTAINED</Text>
          <Text style={[styles.th, styles.gradeCol]}>GRADE</Text>
        </View>
        {result.subjects.map((s) => {
          const meta = SUBJECT_ICONS[s.subject] ?? DEFAULT_SUBJECT_ICON;
          const Icon = meta.icon;
          const grade = gradeColors(s.grade);
          return (
            <View key={s.subject} style={styles.tableRow}>
              <View style={[styles.subjectCol, styles.subjectCell]}>
                <View style={[styles.subjectIcon, { backgroundColor: meta.bg }]}>
                  <Icon size={11} color={meta.fg} />
                </View>
                <Text style={styles.subjectName} numberOfLines={2}>
                  {s.subject}
                </Text>
              </View>
              <Text style={[styles.td, styles.numCol]}>{s.maxMarks}</Text>
              <Text style={[styles.td, styles.tdBold, styles.numCol]}>{s.obtained}</Text>
              <View style={styles.gradeCol}>
                <View style={[styles.gradePill, { backgroundColor: grade.bg }]}>
                  <Text style={[styles.gradePillText, { color: grade.fg }]}>{s.grade}</Text>
                </View>
              </View>
            </View>
          );
        })}
        <View style={[styles.tableRow, styles.totalRow]}>
          <Text style={[styles.totalLabel, styles.subjectCol]}>Total Aggregated</Text>
          <Text style={[styles.td, styles.numCol]}>{totals.max}</Text>
          <Text style={[styles.td, styles.tdBold, styles.numCol]}>{totals.obtained}</Text>
          <View style={styles.gradeCol}>
            <View style={styles.percentPill}>
              <Text style={styles.percentPillText}>{totals.percent}%</Text>
            </View>
          </View>
        </View>
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Close exam list"
          onPress={() => setPickerOpen(false)}
        />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <Text style={styles.sheetTitle}>Choose exam</Text>
          {mockExamResults.map((r) => {
            const active = r.id === result.id;
            return (
              <Pressable
                key={r.id}
                testID={`exam-result-option-${r.id}`}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  setResultId(r.id);
                  setPickerOpen(false);
                }}
                style={styles.sheetOption}
              >
                <View>
                  <Text style={[styles.sheetOptionText, active && styles.sheetOptionActive]}>
                    {r.title}
                  </Text>
                  <Text style={styles.sheetOptionSub}>Academic Year {r.academicYear}</Text>
                </View>
                {active ? <Check size={18} color={PURPLE} /> : null}
              </Pressable>
            );
          })}
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.infoIcon}>
        <Icon size={13} color={PURPLE} />
      </View>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const RING_SIZE = 66;
const RING_STROKE = 7;

function ScoreRing({ percent }: { percent: number }) {
  const r = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <View
      style={styles.ring}
      accessible
      accessibilityLabel={`Total score ${clamped} percent`}
      testID="exam-result-score"
    >
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={r}
          stroke="#EDE9FE"
          strokeWidth={RING_STROKE}
          fill="none"
        />
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={r}
          stroke={PURPLE}
          strokeWidth={RING_STROKE}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped / 100)}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>{clamped}%</Text>
        <Text style={styles.ringLabel}>TOTAL SCORE</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 28 },
  summaryCard: {
    marginHorizontal: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#F7F3FF',
    borderWidth: 1,
    borderColor: '#EDE7FB',
  },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  artBox: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#E9E1FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  books: { width: 46, height: 46 },
  cap: { position: 'absolute', top: 4, right: 6, width: 26, height: 26 },
  summaryText: { flex: 1 },
  examTitle: { color: '#111827', fontSize: 17, fontFamily: fonts.bold },
  examYear: { color: '#6B7280', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },
  examYearValue: { color: '#111827', fontFamily: fonts.semibold },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  infoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 36 },
  infoDivider: { width: 1, height: 26, backgroundColor: '#EEE8FA', marginHorizontal: 4 },
  infoIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#F1EBFD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { color: '#9CA3AF', fontSize: 9, fontFamily: fonts.regular },
  infoValue: { color: '#111827', fontSize: 11, fontFamily: fonts.semibold },
  previousText: { color: '#111827', fontSize: 10, lineHeight: 13, fontFamily: fonts.semibold },
  panel: {
    marginHorizontal: 12,
    marginTop: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEE8FA',
    overflow: 'hidden',
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: HEADER_PURPLE,
  },
  panelTitle: { color: '#FFFFFF', fontSize: 13, fontFamily: fonts.bold },
  headerPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  headerPillText: { color: '#FFFFFF', fontSize: 9, fontFamily: fonts.medium },
  overallBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 8,
  },
  ring: { width: RING_SIZE, height: RING_SIZE },
  ringCenter: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringValue: { color: '#111827', fontSize: 14, fontFamily: fonts.bold },
  ringLabel: { color: '#6B7280', fontSize: 6, fontFamily: fonts.semibold },
  statusCol: { alignItems: 'center', gap: 6 },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#DCFCE7',
  },
  statusPillFail: { backgroundColor: '#FEE2E2' },
  statusText: { color: '#15803D', fontSize: 14, fontFamily: fonts.bold },
  statusTextFail: { color: '#B91C1C' },
  remark: { color: '#111827', fontSize: 11, fontFamily: fonts.semibold },
  gradeBox: {
    width: 68,
    height: 62,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4DAFB',
    backgroundColor: '#F7F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeLabel: { color: '#6B7280', fontSize: 8, fontFamily: fonts.semibold, letterSpacing: 0.5 },
  gradeValue: { color: '#3B0F8C', fontSize: 22, fontFamily: fonts.bold },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableHead: { minHeight: 36, backgroundColor: '#FFFFFF' },
  th: { color: '#374151', fontSize: 8.5, fontFamily: fonts.bold, textAlign: 'center' },
  subjectCol: { flex: 2.3, textAlign: 'left' },
  numCol: { flex: 1.1, textAlign: 'center' },
  gradeCol: { flex: 1, alignItems: 'center' },
  subjectCell: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subjectIcon: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectName: { flexShrink: 1, color: '#111827', fontSize: 11, fontFamily: fonts.medium },
  td: { color: '#374151', fontSize: 11, fontFamily: fonts.regular },
  tdBold: { color: '#111827', fontFamily: fonts.bold },
  gradePill: { minWidth: 26, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  gradePillText: { fontSize: 9, fontFamily: fonts.bold, textAlign: 'center' },
  totalRow: { backgroundColor: '#F5F3FF', borderBottomWidth: 0 },
  totalLabel: { color: '#111827', fontSize: 10, fontFamily: fonts.semibold },
  percentPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: '#4C1D95',
  },
  percentPillText: { color: '#FFFFFF', fontSize: 9, fontFamily: fonts.bold },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sheetTitle: { color: '#111827', fontSize: 16, fontFamily: fonts.bold, marginBottom: 8 },
  sheetOption: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F4',
  },
  sheetOptionText: { color: '#111827', fontSize: 15, fontFamily: fonts.medium },
  sheetOptionActive: { color: PURPLE, fontFamily: fonts.semibold },
  sheetOptionSub: { color: '#6B7280', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },
});
