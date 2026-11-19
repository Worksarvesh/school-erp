import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Headphones } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { Button, Screen, useTheme } from '@school-erp/ui';

/**
 * Contact School Admin. No self-service password reset by design: resets are done by the school.
 * Also shown to parents whose mobile number has no account (reason=no-account).
 */
export function ContactAdminScreen() {
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const { colors, spacing, radii, typography } = useTheme();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'));

  const body =
    reason === 'no-account'
      ? 'We could not find a parent account for this mobile number. Please contact your school office to register or update your number.'
      : 'For student safety and privacy, password resets for student accounts are handled directly by your school administration desk.';

  return (
    <Screen
      contentContainerStyle={{
        padding: spacing.xl,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.lg,
      }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{
          width: 112,
          height: 112,
          borderRadius: radii.full,
          backgroundColor: colors.surfaceSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Headphones size={52} color={colors.primary} />
      </View>
      <Text
        accessibilityRole="header"
        style={{
          color: colors.text,
          fontSize: typography.fontSizes['2xl'],
          fontWeight: typography.fontWeights.bold,
          textAlign: 'center',
        }}
      >
        Contact Your School Admin
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.fontSizes.sm,
          textAlign: 'center',
        }}
      >
        {body}
      </Text>
      <View style={{ alignSelf: 'stretch', marginTop: spacing.lg }}>
        <Button
          testID="back-to-login"
          label="Back to Login"
          size="lg"
          leftIcon={<ArrowLeft size={18} color={colors.primaryForeground} />}
          onPress={back}
        />
      </View>
    </Screen>
  );
}
