import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';

interface Props {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  testID: string;
}

/** A small labelled pill that opens its choices in a pop-up list. */
export function FilterSelect({ label, value, options, onChange, testID }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.root}>
      <Text numberOfLines={1} style={styles.label}>
        {label}
      </Text>
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${value}`}
        hitSlop={8}
        onPress={() => setOpen(true)}
        style={styles.pill}
      >
        <Text numberOfLines={1} ellipsizeMode="clip" style={styles.value}>
          {value}
        </Text>
        <ChevronDown size={18} color="#475569" strokeWidth={2} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} accessibilityViewIsModal onPress={() => undefined}>
            <Text style={styles.heading}>{label}</Text>
            <ScrollView>
              {options.map((option) => (
                <Pressable
                  key={option}
                  testID={`${testID}-${option}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: option === value }}
                  onPress={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  style={[styles.option, option === value && styles.optionActive]}
                >
                  <Text style={[styles.optionText, option === value && styles.optionTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  label: { marginLeft: 4, color: '#444444', fontSize: 12.5, lineHeight: 17 },
  pill: {
    marginTop: 1,
    height: 27,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 9,
    paddingRight: 7,
  },
  value: { flex: 1, color: '#334155', fontSize: 11.5, fontWeight: '600' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 32,
  },
  sheet: {
    maxHeight: '70%',
    width: '100%',
    maxWidth: 340,
    alignSelf: 'center',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
  },
  heading: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    color: '#0F2847',
    fontSize: 16,
    fontWeight: '700',
  },
  option: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 18 },
  optionActive: { backgroundColor: '#EEF2FF' },
  optionText: { color: '#333333', fontSize: 15 },
  optionTextActive: { color: '#1D4ED8', fontWeight: '700' },
});
