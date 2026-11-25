import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { StyleSheet, Text, scaled, MAX_FONT_SCALE } from '@school-erp/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { formatDisplayDate } from '../progress';

/** Fixed light palette for the profile-completion design (violet header, white sheet). */
export const PROFILE = {
  accent: '#4B18AA',
  text: '#0F172A',
  label: '#4B5563',
  muted: '#6B7280',
  border: '#E5E7EB',
  fieldBg: '#FFFFFF',
  placeholder: '#9CA3AF',
  error: '#DC2626',
  required: '#E11D48',
  success: '#10B981',
  amber: '#D97706',
  amberBg: '#FEF3C7',
  lockedBg: '#F1F5F9',
  lockedBorder: '#E2E8F0',
  progress: '#2563EB',
  track: '#EEF0F4',
} as const;

/** Field label; mandatory fields get a red asterisk. */
export function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text style={styles.label}>
      {label}
      {required ? <Text style={styles.asterisk}> *</Text> : null}
    </Text>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Text accessibilityLiveRegion="polite" style={styles.error}>
      {message}
    </Text>
  );
}

interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  required?: boolean;
  error?: string;
  /** Content before the text, e.g. "+91" (drawn with a divider). */
  prefix?: string;
  /** Content after the text, e.g. an icon. */
  suffix?: ReactNode;
}

/** Labelled pill text input. */
export function TextField({ label, required, error, prefix, suffix, ...input }: TextFieldProps) {
  return (
    <View style={styles.block}>
      <FieldLabel label={label} required={required} />
      <View style={[styles.pill, !!error && styles.pillError]}>
        {prefix ? (
          <>
            <Text style={styles.prefix}>{prefix}</Text>
            <View style={styles.divider} />
          </>
        ) : null}
        <TextInput
          maxFontSizeMultiplier={MAX_FONT_SCALE}
          accessibilityLabel={label}
          placeholderTextColor={PROFILE.placeholder}
          style={styles.input}
          {...input}
        />
        {suffix}
      </View>
      <FieldError message={error} />
    </View>
  );
}

interface SelectFieldProps<T extends string> {
  label: string;
  required?: boolean;
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  placeholder?: string;
  /** Adds a "Clear selection" row so an optional field can be emptied. */
  clearable?: boolean;
  error?: string;
  testID?: string;
}

/** Pill that opens a bottom-sheet list of options (all options are shown). */
export function SelectField<T extends string>({
  label,
  required,
  options,
  value,
  onChange,
  placeholder = 'Select',
  clearable,
  error,
  testID,
}: SelectFieldProps<T>) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.block}>
      <FieldLabel label={label} required={required} />
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? placeholder}`}
        onPress={() => setOpen(true)}
        style={[styles.pill, !!error && styles.pillError]}
      >
        <Text style={[styles.input, styles.valueText, !value && { color: PROFILE.placeholder }]}>
          {value ?? placeholder}
        </Text>
        <ChevronDown size={scaled(20)} color={PROFILE.muted} />
      </Pressable>
      <FieldError message={error} />
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <FlatList
            data={clearable ? ([...options, '__clear__'] as string[]) : [...options]}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              if (item === '__clear__') {
                return (
                  <Pressable
                    style={styles.option}
                    onPress={() => {
                      onChange(undefined);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, { color: PROFILE.muted }]}>
                      Clear selection
                    </Text>
                  </Pressable>
                );
              }
              const selected = item === value;
              return (
                <Pressable
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  style={styles.option}
                  onPress={() => {
                    onChange(item as T);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.optionText, selected && { color: PROFILE.accent }]}>
                    {item}
                  </Text>
                  {selected ? <Check size={scaled(18)} color={PROFILE.accent} /> : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const pad = (n: number) => String(n).padStart(2, '0');
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

interface DateFieldProps {
  label: string;
  required?: boolean;
  /** ISO date (yyyy-mm-dd) or ''. */
  value: string;
  onChange: (iso: string) => void;
  /** Earliest and latest ISO dates that can be picked. */
  minDate: string;
  maxDate: string;
  error?: string;
  testID?: string;
}

/** Pill that opens a month calendar; shows the date as "12 Mar 2014". */
export function DateField({
  label,
  required,
  value,
  onChange,
  minDate,
  maxDate,
  error,
  testID,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const startIso = value || maxDate;
  const [year, setYear] = useState(Number(startIso.slice(0, 4)));
  const [month, setMonth] = useState(Number(startIso.slice(5, 7)) - 1);

  const openCalendar = () => {
    const iso = value || maxDate;
    setYear(Number(iso.slice(0, 4)));
    setMonth(Number(iso.slice(5, 7)) - 1);
    setOpen(true);
  };

  const minYear = Number(minDate.slice(0, 4));
  const maxYear = Number(maxDate.slice(0, 4));
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const shiftMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    if (y < minYear || y > maxYear) return;
    setMonth(m);
    setYear(y);
  };

  return (
    <View style={styles.block}>
      <FieldLabel label={label} required={required} />
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDisplayDate(value) : 'not set'}`}
        onPress={openCalendar}
        style={[styles.pill, !!error && styles.pillError]}
      >
        <Text style={[styles.input, styles.valueText, !value && { color: PROFILE.placeholder }]}>
          {value ? formatDisplayDate(value) : 'Select date'}
        </Text>
        <Calendar size={scaled(20)} color={PROFILE.muted} />
      </Pressable>
      <FieldError message={error} />
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.centerBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.calendar} onPress={() => undefined}>
            <View style={styles.calHeader}>
              <Pressable
                accessibilityLabel="Previous month"
                hitSlop={8}
                onPress={() => shiftMonth(-1)}
              >
                <ChevronLeft size={scaled(22)} color={PROFILE.text} />
              </Pressable>
              <Text style={styles.calTitle}>
                {MONTHS[month]} {year}
              </Text>
              <Pressable accessibilityLabel="Next month" hitSlop={8} onPress={() => shiftMonth(1)}>
                <ChevronRight size={scaled(22)} color={PROFILE.text} />
              </Pressable>
            </View>
            <View style={styles.yearRow}>
              <Pressable
                accessibilityLabel="Previous year"
                hitSlop={8}
                onPress={() => year > minYear && setYear(year - 1)}
              >
                <Text style={styles.yearBtn}>« {year - 1}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel="Next year"
                hitSlop={8}
                onPress={() => year < maxYear && setYear(year + 1)}
              >
                <Text style={styles.yearBtn}>{year + 1} »</Text>
              </Pressable>
            </View>
            <View style={styles.weekRow}>
              {WEEKDAYS.map((d, i) => (
                <Text key={i} style={styles.weekday}>
                  {d}
                </Text>
              ))}
            </View>
            <View style={styles.grid}>
              {cells.map((day, i) => {
                if (day === null) return <View key={`e${i}`} style={styles.cell} />;
                const iso = toIso(year, month, day);
                const disabled = iso < minDate || iso > maxDate;
                const selected = iso === value;
                return (
                  <Pressable
                    key={iso}
                    accessibilityRole="button"
                    accessibilityLabel={formatDisplayDate(iso)}
                    accessibilityState={{ selected, disabled }}
                    disabled={disabled}
                    onPress={() => {
                      onChange(iso);
                      setOpen(false);
                    }}
                    style={[styles.cell, selected && styles.cellSelected]}
                  >
                    <Text
                      style={[
                        styles.cellText,
                        selected && { color: '#FFFFFF', fontWeight: '700' },
                        disabled && { color: '#CBD5E1' },
                      ]}
                    >
                      {day}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.calClose} onPress={() => setOpen(false)}>
              <Text style={styles.calCloseText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 16 },
  label: { color: PROFILE.label, fontSize: 13, marginBottom: 8, marginLeft: 4 },
  asterisk: { color: PROFILE.required, fontWeight: '700' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 50,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: PROFILE.border,
    backgroundColor: PROFILE.fieldBg,
    paddingHorizontal: 16,
  },
  pillError: { borderColor: PROFILE.error },
  prefix: { color: PROFILE.muted, fontSize: 15, marginRight: 10 },
  divider: { width: 1, height: 22, backgroundColor: PROFILE.border, marginRight: 12 },
  input: {
    flex: 1,
    paddingVertical: 12,
    color: PROFILE.text,
    fontSize: 15,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  valueText: { paddingVertical: 14 },
  error: { color: PROFILE.error, fontSize: 12, marginTop: 6, marginLeft: 4 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    maxHeight: '70%',
  },
  sheetTitle: { color: PROFILE.text, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: PROFILE.border,
  },
  optionText: { color: PROFILE.text, fontSize: 15 },
  centerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  calendar: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
  },
  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calTitle: { color: PROFILE.text, fontSize: 16, fontWeight: '700' },
  yearRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  yearBtn: { color: PROFILE.accent, fontSize: 13, fontWeight: '600' },
  weekRow: { flexDirection: 'row', marginTop: 12 },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: PROFILE.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  cellSelected: { backgroundColor: PROFILE.accent },
  cellText: { color: PROFILE.text, fontSize: 14 },
  calClose: { alignSelf: 'flex-end', paddingVertical: 10, paddingHorizontal: 6 },
  calCloseText: { color: PROFILE.accent, fontSize: 14, fontWeight: '600' },
});
