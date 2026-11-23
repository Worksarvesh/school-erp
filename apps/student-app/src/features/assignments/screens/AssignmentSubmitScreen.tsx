import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Star,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Screen, StateView } from '@school-erp/ui';
import { mockAssignments } from '@/mock/assignments';
import { fonts } from '@/theme/fonts';
import { assignmentTab, isDriveLink, useSubmissions } from '../submissions';

const PURPLE = '#5016A8';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX_ANSWER = 2000;

/** "20 Nov 2026". */
function fullDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "20 Nov 2026, 4:05 PM". */
function dateTime(d: Date): string {
  const h = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  return `${fullDate(d)}, ${h % 12 === 0 ? 12 : h % 12}:${mins} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Whole days from today until the due date (negative when overdue). */
function daysLeft(due: Date, today: Date): number {
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const b = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
  return Math.round((b - a) / 86_400_000);
}

function dueNote(days: number): string {
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  if (days > 1) return `${days} days left`;
  return `Overdue by ${-days} ${days === -1 ? 'day' : 'days'}`;
}

/**
 * Assignment submission: full assignment details (subject, chapter, dates, marks, description),
 * then an answer box and a Google Drive link to the work. Submitting saves it in app memory and moves the
 * assignment to the Submitted tab. Overdue assignments can still be sent as a late submission.
 * MOCK: nothing is uploaded, there is no API yet.
 */
export function AssignmentSubmitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const today = useMemo(() => new Date(), []);
  const assignment = useMemo(() => mockAssignments(today).find((a) => a.id === id), [id, today]);
  const submission = useSubmissions((s) => (id ? s.submissions[id] : undefined));
  const submit = useSubmissions((s) => s.submit);

  const [answer, setAnswer] = useState('');
  const [driveLink, setDriveLink] = useState('');

  const header = (
    <View style={styles.header}>
      <Pressable
        testID="assignment-submit-back"
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/assignments'))}
        style={styles.headerButton}
      >
        <ArrowLeft size={24} color="#111827" />
      </Pressable>
      <Text style={styles.headerTitle} accessibilityRole="header">
        {submission ? 'Submission' : 'Submit Assignment'}
      </Text>
      <View style={styles.headerButton} />
    </View>
  );

  if (!assignment) {
    return (
      <Screen>
        {header}
        <StateView state="empty" title="Assignment not found" />
      </Screen>
    );
  }

  const days = daysLeft(assignment.dueOn, today);
  const overdue = assignmentTab(assignment, today, false) === 'past';
  const link = driveLink.trim();
  const linkError = link !== '' && !isDriveLink(link);
  const canSubmit = !linkError && (answer.trim().length > 0 || link !== '');

  return (
    <Screen scrollable contentContainerStyle={styles.content}>
      {header}

      <View style={styles.card}>
        <View style={styles.subjectRow}>
          <Text style={styles.subject}>{assignment.subject}</Text>
          {submission ? (
            <StatusPill label="Submitted" bg="#DCFCE7" fg="#15803D" icon={CircleCheck} />
          ) : overdue ? (
            <StatusPill label="Overdue" bg="#FEE2E2" fg="#B91C1C" icon={CircleAlert} />
          ) : (
            <StatusPill label="Pending" bg="#FEF3C7" fg="#B45309" icon={CircleAlert} />
          )}
        </View>
        <Text style={styles.title}>{assignment.title}</Text>
        <Text style={styles.chapter}>Chapter: {assignment.chapter}</Text>

        <View style={styles.facts}>
          <Fact icon={CalendarDays} label="Assigned" value={fullDate(assignment.assignedOn)} />
          <Fact icon={CalendarDays} label="Due Date" value={fullDate(assignment.dueOn)} />
          <Fact icon={Star} label="Total Marks" value={String(assignment.totalMarks)} />
        </View>
        {!submission ? (
          <Text style={[styles.dueNote, overdue && styles.dueNoteLate]}>{dueNote(days)}</Text>
        ) : null}

        <Text style={styles.sectionLabel}>Description</Text>
        <Text style={styles.description}>{assignment.description}</Text>
      </View>

      {submission ? (
        <View style={styles.card} testID="assignment-submitted">
          <View style={styles.doneRow}>
            <CircleCheck size={20} color="#FFFFFF" fill="#16A34A" />
            <View style={styles.flex}>
              <Text style={styles.doneTitle}>Assignment submitted</Text>
              <Text style={styles.doneSub}>On {dateTime(submission.submittedOn)}</Text>
            </View>
          </View>
          {submission.answer ? (
            <>
              <Text style={styles.sectionLabel}>Your Answer</Text>
              <Text style={styles.description}>{submission.answer}</Text>
            </>
          ) : null}
          {submission.driveLink ? (
            <>
              <Text style={styles.sectionLabel}>Google Drive</Text>
              <Pressable
                testID="assignment-drive-open"
                accessibilityRole="link"
                accessibilityLabel="Open Google Drive link"
                onPress={() => void Linking.openURL(submission.driveLink)}
                style={styles.driveRow}
              >
                <DriveLogo />
                <Text style={styles.driveLinkText} numberOfLines={1}>
                  {submission.driveLink}
                </Text>
                <ExternalLink size={16} color={PURPLE} />
              </Pressable>
            </>
          ) : null}
        </View>
      ) : (
        <View style={styles.card}>
          {overdue ? (
            <View style={styles.lateBanner}>
              <CircleAlert size={16} color="#B91C1C" />
              <Text style={styles.lateText}>
                The due date has passed. This will be sent as a late submission.
              </Text>
            </View>
          ) : null}

          <Text style={[styles.sectionLabel, styles.firstLabel]}>Your Answer</Text>
          <TextInput
            testID="assignment-answer"
            value={answer}
            onChangeText={setAnswer}
            placeholder="Write your answer or a note for your teacher..."
            placeholderTextColor="#9CA3AF"
            accessibilityLabel="Your answer"
            multiline
            maxLength={MAX_ANSWER}
            textAlignVertical="top"
            style={styles.answerInput}
          />
          <Text style={styles.counter}>
            {answer.length} / {MAX_ANSWER}
          </Text>

          <Text style={styles.sectionLabel}>Google Drive link</Text>
          <Text style={styles.driveHint}>
            Upload your work to Google Drive, share it with your teacher and paste the link here.
          </Text>
          <View style={[styles.driveInput, linkError && styles.driveInputError]}>
            <DriveLogo />
            <TextInput
              testID="assignment-drive-link"
              value={driveLink}
              onChangeText={setDriveLink}
              placeholder="https://drive.google.com/..."
              placeholderTextColor="#9CA3AF"
              accessibilityLabel="Google Drive link"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.driveField}
            />
            {driveLink ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear link"
                onPress={() => setDriveLink('')}
                hitSlop={10}
              >
                <X size={16} color="#6B7280" />
              </Pressable>
            ) : null}
          </View>
          {linkError ? (
            <Text style={styles.linkError}>
              Enter a Google Drive link (drive.google.com or docs.google.com).
            </Text>
          ) : null}

          <Pressable
            testID="assignment-submit"
            accessibilityRole="button"
            accessibilityLabel={overdue ? 'Submit late' : 'Submit assignment'}
            accessibilityState={{ disabled: !canSubmit }}
            disabled={!canSubmit}
            onPress={() => submit(assignment.id, answer.trim(), link)}
            style={[styles.submit, !canSubmit && styles.submitDisabled]}
          >
            <Text style={styles.submitText}>{overdue ? 'Submit Late' : 'Submit Assignment'}</Text>
          </Pressable>
          {!canSubmit && !linkError ? (
            <Text style={styles.hint}>Write an answer or add a Drive link to submit.</Text>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function StatusPill({
  label,
  bg,
  fg,
  icon: Icon,
}: {
  label: string;
  bg: string;
  fg: string;
  icon: LucideIcon;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Icon size={11} color={fg} />
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

function Fact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Icon size={14} color={PURPLE} />
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

/** Drive-style triangle in Google's green, yellow and blue. */
function DriveLogo() {
  return (
    <Svg width={20} height={18} viewBox="0 0 24 22">
      <Line x1={12} y1={3} x2={3} y2={18} stroke="#0F9D58" strokeWidth={4} strokeLinecap="round" />
      <Line x1={12} y1={3} x2={21} y2={18} stroke="#F4B400" strokeWidth={4} strokeLinecap="round" />
      <Line x1={3} y1={19} x2={21} y2={19} stroke="#4285F4" strokeWidth={4} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginHorizontal: -8,
  },
  headerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: PURPLE, fontSize: 20, fontFamily: fonts.semibold },
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  subjectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subject: { flexShrink: 1, color: '#111827', fontSize: 18, fontFamily: fonts.bold },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  pillText: { fontSize: 10.5, fontFamily: fonts.semibold },
  title: { color: '#374151', fontSize: 14, fontFamily: fonts.semibold, marginTop: 4 },
  chapter: { color: PURPLE, fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  facts: { flexDirection: 'row', gap: 8, marginTop: 14 },
  fact: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F4F5F7',
  },
  factValue: { color: '#111827', fontSize: 12, fontFamily: fonts.bold, textAlign: 'center' },
  factLabel: { color: '#6B7280', fontSize: 9.5, fontFamily: fonts.medium },
  dueNote: { color: '#B45309', fontSize: 12, fontFamily: fonts.semibold, marginTop: 10 },
  dueNoteLate: { color: '#B91C1C' },
  sectionLabel: { color: '#111827', fontSize: 13, fontFamily: fonts.bold, marginTop: 16 },
  firstLabel: { marginTop: 0 },
  description: {
    color: '#4B5563',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    marginTop: 6,
  },
  lateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    marginBottom: 14,
    borderRadius: 10,
    backgroundColor: '#FEF2F2',
  },
  lateText: { flex: 1, color: '#B91C1C', fontSize: 12, fontFamily: fonts.medium },
  answerInput: {
    marginTop: 8,
    minHeight: 120,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    color: '#111827',
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
  },
  counter: {
    alignSelf: 'flex-end',
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: fonts.regular,
    marginTop: 4,
  },
  driveHint: { color: '#6B7280', fontSize: 11, fontFamily: fonts.regular, marginTop: 2 },
  driveInput: {
    marginTop: 8,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4D4D8',
    backgroundColor: '#FFFFFF',
  },
  driveInputError: { borderColor: '#DC2626' },
  driveField: {
    flex: 1,
    paddingVertical: 10,
    color: '#111827',
    fontSize: 13,
    fontFamily: fonts.regular,
  },
  linkError: { color: '#B91C1C', fontSize: 11, fontFamily: fonts.medium, marginTop: 6 },
  driveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8F7FB',
  },
  driveLinkText: { flex: 1, color: '#1D4ED8', fontSize: 12, fontFamily: fonts.medium },
  submit: {
    marginTop: 18,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { backgroundColor: '#C4B5FD' },
  submitText: { color: '#FFFFFF', fontSize: 15, fontFamily: fonts.bold },
  hint: {
    color: '#6B7280',
    fontSize: 11,
    fontFamily: fonts.regular,
    textAlign: 'center',
    marginTop: 6,
  },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  doneTitle: { color: '#15803D', fontSize: 14, fontFamily: fonts.bold },
  doneSub: { color: '#6B7280', fontSize: 11.5, fontFamily: fonts.regular, marginTop: 1 },
});
