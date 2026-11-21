import { Check } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** Fixed light palette for the onboarding role-select design (white background, violet accent). */
export const ROLE_SELECT_COLORS = {
  background: '#FFFFFF',
  title: '#111827',
  subtitle: '#6B7280',
  cardBorder: '#E5E7EB',
  cardBorderSelected: '#8B8B96',
  cardTitle: '#111827',
  cardText: '#6B7280',
  accent: '#4B18AA',
  accentDisabled: '#C9A8FA',
  illustrationBg: '#F3F2FF',
} as const;

interface SelectCardProps {
  title: string;
  description: string;
  /** Artwork shown at the top of the card (see RoleIllustrations). */
  illustration: ReactNode;
  selected: boolean;
  onPress: () => void;
  testID?: string;
}

/** Selectable option card: grey border and a soft shadow when selected. */
export function SelectCard({
  title,
  description,
  illustration,
  selected,
  onPress,
  testID,
}: SelectCardProps) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      {selected ? (
        <View style={styles.badge}>
          <Check size={12} color="#FFFFFF" />
        </View>
      ) : null}
      <View style={styles.illustration}>{illustration}</View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 190,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: ROLE_SELECT_COLORS.cardBorder,
    backgroundColor: '#FFFFFF',
  },
  cardSelected: {
    borderWidth: 1.5,
    borderColor: ROLE_SELECT_COLORS.cardBorderSelected,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: ROLE_SELECT_COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  illustration: {
    width: 76,
    height: 76,
    borderRadius: 14,
    backgroundColor: ROLE_SELECT_COLORS.illustrationBg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 10,
  },
  title: {
    color: ROLE_SELECT_COLORS.cardTitle,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  description: {
    color: ROLE_SELECT_COLORS.cardText,
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
});
