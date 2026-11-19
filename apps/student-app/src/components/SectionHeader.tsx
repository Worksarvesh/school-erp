import type { LucideIcon } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useTheme } from '@school-erp/ui';

interface SectionHeaderProps {
  title: string;
  /** Small text on the right, e.g. "Can fill later". */
  tag?: string;
  tagIcon?: LucideIcon;
  tagTone?: 'muted' | 'accent' | 'success';
}

export function SectionHeader({
  title,
  tag,
  tagIcon: TagIcon,
  tagTone = 'muted',
}: SectionHeaderProps) {
  const { colors, spacing, typography } = useTheme();
  const tone =
    tagTone === 'accent'
      ? colors.warning
      : tagTone === 'success'
        ? colors.success
        : colors.textMuted;

  return (
    <View
      accessibilityRole="header"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: typography.fontSizes.base,
          fontWeight: typography.fontWeights.semibold,
        }}
      >
        {title}
      </Text>
      {tag ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          {TagIcon ? <TagIcon size={14} color={tone} /> : null}
          <Text style={{ color: tone, fontSize: typography.fontSizes.xs }}>{tag}</Text>
        </View>
      ) : null}
    </View>
  );
}
