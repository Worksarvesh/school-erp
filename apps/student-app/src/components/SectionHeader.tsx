import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, iconSize, spacing, typography } from '@/theme';

type FeatherName = ComponentProps<typeof Feather>['name'];

interface SectionHeaderProps {
  title: string;
  /** Small text on the right, e.g. "Can fill later". */
  tag?: string;
  tagIcon?: FeatherName;
  tagTone?: 'muted' | 'accent' | 'success';
}

export function SectionHeader({ title, tag, tagIcon, tagTone = 'muted' }: SectionHeaderProps) {
  const tone =
    tagTone === 'accent'
      ? colors.warning
      : tagTone === 'success'
        ? colors.success
        : colors.textMuted;
  return (
    <View style={styles.row} accessibilityRole="header">
      <Text style={styles.title}>{title}</Text>
      {tag ? (
        <View style={styles.tag}>
          {tagIcon ? <Feather name={tagIcon} size={iconSize.xs} color={tone} /> : null}
          <Text style={[styles.tagText, { color: tone }]}>{tag}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { ...typography.heading, color: colors.textPrimary },
  tag: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  tagText: { ...typography.caption },
});
