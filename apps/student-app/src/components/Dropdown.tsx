import { Check, ChevronDown } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, type ThemeContextValue } from '@school-erp/ui';

interface DropdownProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  placeholder?: string;
  /** Adds a "Clear selection" option so an optional field can be emptied again. */
  clearable?: boolean;
  testID?: string;
}

/** Select field that opens a bottom-sheet list of options. */
export function Dropdown<T extends string>({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select',
  clearable = false,
  testID,
}: DropdownProps<T>) {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { colors } = theme;
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
        <ChevronDown size={20} color={colors.textSecondary} />
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
                  {selected ? <Check size={20} color={colors.primary} /> : null}
                </Pressable>
              );
            }}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

function makeStyles({ colors, spacing, radii, typography }: ThemeContextValue) {
  return StyleSheet.create({
    wrapper: { marginBottom: spacing.base },
    label: {
      color: colors.text,
      fontSize: typography.fontSizes.sm,
      fontWeight: typography.fontWeights.medium,
      marginBottom: spacing.xs,
    },
    field: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.md,
      backgroundColor: colors.surface,
    },
    value: { color: colors.text, fontSize: typography.fontSizes.base },
    placeholder: { color: colors.textMuted },
    backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)' },
    sheet: {
      maxHeight: '60%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: radii.xl,
      borderTopRightRadius: radii.xl,
      paddingTop: spacing.base,
    },
    sheetTitle: {
      color: colors.text,
      fontSize: typography.fontSizes.lg,
      fontWeight: typography.fontWeights.semibold,
      paddingHorizontal: spacing.base,
      paddingBottom: spacing.sm,
    },
    option: {
      minHeight: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.base,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    optionText: { color: colors.text, fontSize: typography.fontSizes.base },
    optionSelected: { color: colors.primary, fontWeight: typography.fontWeights.semibold },
  });
}
