import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, ScreenContainer } from '@/components';
import { colors, iconSize, radius, shadows, sizes, spacing, typography } from '@/theme';

/** No self-service reset by design: resets are done by the school (approved V1 rule). */
export function ContactAdminScreen() {
  const router = useRouter();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/login'));

  return (
    <ScreenContainer scroll={false}>
      <View style={styles.center}>
        <View style={[styles.illustration, shadows.card]} accessibilityElementsHidden>
          <Feather name="headphones" size={iconSize.hero} color={colors.primary} />
        </View>
        <Text style={styles.title} accessibilityRole="header">
          Contact Your School Admin
        </Text>
        <Text style={styles.body}>
          For student safety and privacy, password resets for student and parent accounts are
          handled directly by your school administration desk.
        </Text>
        <View style={styles.button}>
          <PrimaryButton
            testID="back-to-login"
            label="Back to Login"
            leadingIcon="arrow-left"
            onPress={back}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  illustration: {
    width: sizes.contactIllustration,
    height: sizes.contactIllustration,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: { ...typography.display, color: colors.textPrimary, textAlign: 'center' },
  body: { ...typography.subtitle, color: colors.textSecondary, textAlign: 'center' },
  button: { alignSelf: 'stretch', marginTop: spacing.lg },
});
