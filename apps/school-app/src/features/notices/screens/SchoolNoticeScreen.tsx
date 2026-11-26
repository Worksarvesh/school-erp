import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft, Calendar, ChevronDown, ChevronUp, Trash2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DatePickerModal } from '@/components/DatePickerModal';
import { usePermission } from '@/core/permissions';
import { NOTICE_AUDIENCES, NOTICE_DRAFT_MOCK } from '@/mock/notice';
import { formatDate } from '../format';
import { DESCRIPTION_MAX, noticeSchema, type NoticeForm } from '../schemas';
import { useNotices } from '../store';

const BLUE = '#1D4ED8';
const ERROR = '#DC2626';
const DOTS = ['#FBBF24', '#3B82F6', '#EC4899'];
/** How long the "sent" line stays before the screen closes. */
const CLOSE_DELAY_MS = 1200;

/** Removes the black focus ring the browser draws around inputs (web only). */
const NO_OUTLINE = { outlineStyle: 'none', outlineWidth: 0 } as object;

type Field = keyof NoticeForm;
type DateField = 'publishDate' | 'expiryDate';
type Draft = Omit<NoticeForm, DateField> & Record<DateField, Date | null>;

const EMPTY: Draft = {
  title: '',
  description: '',
  assignedBy: '',
  audience: NOTICE_AUDIENCES[0],
  publishDate: null,
  expiryDate: null,
};

/**
 * SCHOOL-NOTICE-COMPOSE: write a notice and send it, or change one from the list (`id` param).
 * MOCK: a new notice opens with the design's draft; nothing leaves the app.
 */
export function SchoolNoticeScreen() {
  const router = useRouter();
  const canPublish = usePermission('notices.publish');
  const { id } = useLocalSearchParams<{ id?: string }>();
  const save = useNotices((s) => s.save);
  const editing = useNotices((s) => s.notices.find((n) => n.id === id));
  const [draft, setDraft] = useState<Draft>(() => editing ?? NOTICE_DRAFT_MOCK);
  const [submitted, setSubmitted] = useState(false);
  const [audienceOpen, setAudienceOpen] = useState(false);
  const [picking, setPicking] = useState<DateField | null>(null);
  const [sent, setSent] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const result = noticeSchema.safeParse(draft);
  const errorFor = (field: Field) =>
    submitted ? result.error?.issues.find((i) => i.path[0] === field)?.message : undefined;
  const errorLine = (field: Field) =>
    errorFor(field) ? <Text style={styles.error}>{errorFor(field)}</Text> : null;

  const set = <K extends Field>(field: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [field]: value }));

  const close = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  const onDelete = () => {
    setDraft(EMPTY);
    setSubmitted(false);
    setAudienceOpen(false);
  };

  const onSend = () => {
    setSubmitted(true);
    if (!result.success || sent) return;
    setSent(true);
    save(result.data, id);
    // An edit returns to the list it came from; a new notice moves on to the list.
    timer.current = setTimeout(
      () => (id ? close() : router.replace('/notice-list')),
      CLOSE_DELAY_MS,
    );
  };

  const label = (text: string, required = false) => (
    <Text style={styles.label}>
      {text}
      {required ? <Text style={styles.star}> *</Text> : null}
    </Text>
  );

  const dateField = (field: DateField, title: string) => (
    <View style={styles.flex}>
      <Text style={styles.dateLabel}>{title}</Text>
      <Pressable
        testID={`notice-${field}`}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${draft[field] ? formatDate(draft[field]) : 'not selected'}`}
        onPress={() => {
          setAudienceOpen(false);
          setPicking(field);
        }}
        style={[styles.input, styles.date, errorFor(field) ? styles.inputError : null]}
      >
        <Text style={[styles.dateText, !draft[field] && styles.placeholder]}>
          {draft[field] ? formatDate(draft[field]) : 'Select date'}
        </Text>
        <Calendar size={18} color="#2563EB" strokeWidth={2} />
      </Pressable>
      {errorLine(field)}
    </View>
  );

  const year = new Date().getFullYear();

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable
          testID="notice-back"
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          onPress={close}
          style={styles.back}
        >
          <ArrowLeft size={24} color="#1E293B" strokeWidth={2.2} />
        </Pressable>
        <Text accessibilityRole="header" style={styles.title}>
          School Notice
        </Text>
        <Pressable
          testID="notice-delete"
          accessibilityRole="button"
          accessibilityLabel="Delete this draft"
          onPress={onDelete}
          style={styles.delete}
        >
          <Trash2 size={20} color="#EF4444" strokeWidth={2} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
          <View style={styles.block}>
            {label('Title', true)}
            <TextInput
              testID="notice-title"
              accessibilityLabel="Title"
              maxLength={100}
              value={draft.title}
              onChangeText={(t) => set('title', t)}
              style={[styles.input, errorFor('title') ? styles.inputError : null, NO_OUTLINE]}
            />
            {errorLine('title')}
          </View>

          <View style={[styles.block, styles.gapDescription]}>
            {label('Description', true)}
            <View style={[styles.area, errorFor('description') ? styles.inputError : null]}>
              <TextInput
                testID="notice-description"
                accessibilityLabel="Description"
                multiline
                maxLength={DESCRIPTION_MAX}
                value={draft.description}
                onChangeText={(t) => set('description', t)}
                style={[styles.areaInput, NO_OUTLINE]}
              />
              <Text testID="notice-count" style={styles.count}>
                {draft.description.length}/{DESCRIPTION_MAX}
              </Text>
            </View>
            {errorLine('description')}
          </View>

          <View style={styles.indented}>
            {label('Assign By', true)}
            <TextInput
              testID="notice-assigned-by"
              accessibilityLabel="Assign By"
              autoCapitalize="words"
              maxLength={80}
              value={draft.assignedBy}
              onChangeText={(t) => set('assignedBy', t)}
              style={[styles.input, errorFor('assignedBy') ? styles.inputError : null, NO_OUTLINE]}
            />
            {errorLine('assignedBy')}

            <View style={styles.gapAudience}>
              {label('Audience')}
              <Pressable
                testID="notice-audience"
                accessibilityRole="button"
                accessibilityLabel={`Audience, ${draft.audience}`}
                accessibilityState={{ expanded: audienceOpen }}
                onPress={() => setAudienceOpen((v) => !v)}
                style={[styles.input, styles.audience]}
              >
                <View style={styles.dots}>
                  {DOTS.map((color, i) => (
                    <View
                      key={color}
                      style={[styles.dot, { backgroundColor: color }, i > 0 && styles.dotOverlap]}
                    />
                  ))}
                </View>
                <Text style={styles.audienceText}>{draft.audience}</Text>
                {audienceOpen ? (
                  <ChevronUp size={22} color="#1E3A8A" strokeWidth={2.4} />
                ) : (
                  <ChevronDown size={22} color="#1E3A8A" strokeWidth={2.4} />
                )}
              </Pressable>
              {audienceOpen ? (
                <View style={styles.dropdown}>
                  {NOTICE_AUDIENCES.map((a) => (
                    <Pressable
                      key={a}
                      testID={`audience-${a.toLowerCase().replace(/ /g, '-')}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: draft.audience === a }}
                      onPress={() => {
                        set('audience', a);
                        setAudienceOpen(false);
                      }}
                      style={[styles.option, draft.audience === a && styles.optionActive]}
                    >
                      <Text
                        style={[styles.optionText, draft.audience === a && styles.optionTextActive]}
                      >
                        {a}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.dates}>
            {dateField('publishDate', 'Publish Date')}
            {dateField('expiryDate', 'Expiry Date')}
          </View>

          <View style={styles.spacer} />

          {sent ? (
            <Text accessibilityLiveRegion="polite" style={styles.sent}>
              Notice sent (demo only).
            </Text>
          ) : null}
          {canPublish ? (
            <Pressable
              testID="notice-send"
              accessibilityRole="button"
              accessibilityLabel="Send Notice"
              accessibilityState={{ disabled: sent }}
              disabled={sent}
              onPress={onSend}
              style={[styles.button, sent && styles.buttonBusy]}
            >
              <Text style={styles.buttonLabel}>Send Notice</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerModal
        visible={picking !== null}
        title={picking === 'expiryDate' ? 'Expiry Date' : 'Publish Date'}
        value={picking ? (draft[picking] ?? new Date()) : null}
        minDate={new Date(2025, 0, 1)}
        maxDate={new Date(year + 2, 11, 31)}
        onSelect={(date) => {
          if (picking) set(picking, date);
          setPicking(null);
        }}
        onClose={() => setPicking(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  header: { height: 48, marginTop: -2, justifyContent: 'center' },
  back: { position: 'absolute', left: 18, zIndex: 1 },
  title: {
    textAlign: 'center',
    color: '#1E293B',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    paddingRight: 10,
  },
  delete: {
    position: 'absolute',
    right: 32,
    top: 6,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The design's fields are not all aligned (20 to 23 on each side); kept as drawn.
  form: { flexGrow: 1, paddingTop: 20, paddingBottom: 32 },
  block: { marginLeft: 20, marginRight: 23 },
  gapDescription: { marginTop: 13 },
  indented: { marginLeft: 23, marginRight: 20, marginTop: 8 },
  gapAudience: { marginTop: 14 },
  label: { color: '#1E293B', fontSize: 14.5, lineHeight: 20, marginBottom: 8 },
  star: { color: '#EF4444' },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8E8E8E',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    fontSize: 16,
    fontWeight: '500',
    color: '#0F172A',
  },
  inputError: { borderColor: ERROR },
  area: {
    height: 116,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8E8E8E',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 6,
  },
  areaInput: {
    flex: 1,
    padding: 0,
    fontSize: 14.5,
    lineHeight: 23,
    color: '#444444',
    textAlignVertical: 'top',
  },
  count: { alignSelf: 'flex-end', color: '#999999', fontSize: 12, lineHeight: 16 },
  audience: { height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  dots: { flexDirection: 'row' },
  dot: { width: 20, height: 20, borderRadius: 10 },
  dotOverlap: { marginLeft: -6 },
  audienceText: { flex: 1, marginLeft: 8, color: '#555555', fontSize: 14.5 },
  dropdown: {
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8E8E8E',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  option: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 15 },
  optionActive: { backgroundColor: '#EEF2FF' },
  optionText: { color: '#333333', fontSize: 15 },
  optionTextActive: { color: BLUE, fontWeight: '700' },
  dates: { flexDirection: 'row', gap: 11, marginTop: 20, marginLeft: 22, marginRight: 20 },
  dateLabel: {
    color: '#333333',
    fontSize: 14.5,
    lineHeight: 20,
    fontWeight: '700',
    marginBottom: 2,
  },
  date: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 10,
    paddingRight: 8,
  },
  dateText: { color: '#555555', fontSize: 14.5 },
  placeholder: { color: '#B5B5B5' },
  error: { color: ERROR, fontSize: 13, lineHeight: 18, marginTop: 4 },
  // Pushes the button down to where the design draws it, and shrinks on short screens.
  spacer: { height: 105, flexShrink: 1, minHeight: 24 },
  sent: { marginBottom: 8, textAlign: 'center', color: '#047857', fontSize: 14 },
  button: {
    height: 60,
    marginLeft: 21,
    marginRight: 14,
    borderRadius: 10,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonBusy: { opacity: 0.7 },
  buttonLabel: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
});
