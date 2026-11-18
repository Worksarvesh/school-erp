import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { borderWidth, colors, iconSize, radius, spacing, touch, typography } from '@/theme';

interface DropdownProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  placeholder?: string;
  /** Adds a "Clear" option so an optional field can be emptied again. */
  clearable?: boolean;
  testID?: string;
}

/** Select field that opens a bottom sheet list of options. */
export function Dropdown<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select',
  clearable = false,
  testID,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const choose = (next: T | undefined) => {
    onChange(next);
    setOpen(false);
  };
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ?? placeholder}`}
        accessibilityHint="Opens a list of options"
        onPress={() => setOpen(true)}
        style={styles.field}
      >
        <Text style={[styles.value, !value && styles.placeholder]}>{value ?? placeholder}</Text>
        <Feather name="chevron-down" size={iconSize.md} color={colors.textSecondary} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={styles.backdrop}
          accessibilityRole="button"
          accessibilityLabel="Close list"
          onPress={() => setOpen(false)}
        />
        <SafeAreaView edges={['bottom']} style={styles.sheet}>
          <Text style={styles.sheetTitle}>{label}</Text>
          <FlatList
            data={clearable ? [...options, undefined] : [...options]}
            keyExtractor={(item) => item ?? '__clear__'}
            renderItem={({ item }) => {
              const selected = item !== undefined && item === value;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={item ?? 'Clear selection'}
                  onPress={() => choose(item)}
                  style={styles.option}
                >
                  <Text style={[styles.optionText, selected && styles.optionSelected]}>
                    {item ?? 'Clear selection'}
                  </Text>
                  {selected ? (
                    <Feather name="check" size={iconSize.md} color={colors.primary} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: { ...typography.label, color: colors.textPrimary },
  field: {
    minHeight: touch.inputHeight,
    borderRadius: radius.input,
    backgroundColor: colors.inputFill,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  value: { ...typography.body, color: colors.textPrimary },
  placeholder: { color: colors.textMuted },
  backdrop: { flex: 1, backgroundColor: colors.overlay },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  sheetTitle: { ...typography.heading, color: colors.textPrimary, marginBottom: spacing.sm },
  option: {
    minHeight: touch.minTarget + spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: borderWidth.thin,
    borderBottomColor: colors.border,
  },
  optionText: { ...typography.body, color: colors.textPrimary },
  optionSelected: { ...typography.bodyStrong, color: colors.primary },
});
