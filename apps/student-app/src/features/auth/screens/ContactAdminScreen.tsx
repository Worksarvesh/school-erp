import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { StyleSheet, Text, scaled } from '@school-erp/ui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HelpDeskIllustration } from '@/components';
import { AUTH } from '../components/AuthKit';

/**
 * Contact School Admin. No self-service password reset by design: resets are done by the school.
 * Opened from "Forgot Password?", and also shown to parents whose mobile number has no account
 * (reason=no-account). Always white, whatever the device theme (approved design).
 */
export function ContactAdminScreen() {
  const router = useRouter();
  const { reason } = useLocalSearchParams<{ reason?: string }>();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'));

  const body =
    reason === 'no-account'
      ? 'We could not find a parent account for this mobile number. Please contact your school office to register or update your number.'
      : 'For student safety and privacy, password resets for student and parent accounts are handled directly by your school administration desk.';

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.center}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.imageCard}
        >
          <HelpDeskIllustration />
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Contact Your School Admin
        </Text>
        <Text style={styles.body}>{body}</Text>
        <Pressable
          testID="back-to-login"
          accessibilityRole="button"
          accessibilityLabel="Back to Login"
          onPress={back}
          style={styles.button}
        >
          <ArrowLeft size={scaled(20)} color="#FFFFFF" />
          <Text style={styles.buttonLabel}>Back to Login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AUTH.background },
  center: { flex: 1, paddingHorizontal: 32, alignItems: 'center', justifyContent: 'center' },
  imageCard: {
    width: 96,
    height: 96,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 24,
  },
  title: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 23,
    textAlign: 'center',
    marginTop: 14,
  },
  button: {
    alignSelf: 'stretch',
    height: 56,
    marginTop: 48,
    borderRadius: 28,
    backgroundColor: AUTH.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: AUTH.accent,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonLabel: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
});
