import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScreenContainer } from '@/components';
import { colors, iconSize, radius, sizes, spacing, touch, typography } from '@/theme';

interface ComingSoonScreenProps {
  /** Shown when the screen is a tab (no back button). Otherwise the title comes from params. */
  title?: string;
  showBack?: boolean;
}

/** Placeholder for features not built yet. */
export function ComingSoonScreen({ title, showBack = true }: ComingSoonScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ title?: string }>();
  const heading = title ?? params.title ?? 'Coming soon';
  const back = () => (router.canGoBack() ? router.back() : router.replace('/home'));

  return (
    <ScreenContainer scroll={false} edges={showBack ? ['top', 'bottom'] : ['top']}>
      {showBack ? (
        <Pressable
          testID="coming-soon-back"
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={back}
          style={styles.back}
        >
          <Feather name="arrow-left" size={iconSize.lg} color={colors.textPrimary} />
        </Pressable>
      ) : null}
      <View style={styles.center}>
        <View style={styles.icon} accessibilityElementsHidden>
          <Feather name="clock" size={iconSize.hero} color={colors.primary} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          {heading}
        </Text>
        <Text style={styles.body}>Coming soon</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: {
    width: touch.minTarget,
    height: touch.minTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.md,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  icon: {
    width: sizes.contactIllustration,
    height: sizes.contactIllustration,
    borderRadius: radius.card,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...typography.title, color: colors.textPrimary, textAlign: 'center' },
  body: { ...typography.subtitle, color: colors.textSecondary },
});
