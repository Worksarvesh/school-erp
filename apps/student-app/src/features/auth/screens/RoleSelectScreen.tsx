import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ParentsIllustration, ROLE_SELECT_COLORS as C, SelectCard } from '@/components';
import type { AppRole } from '@/state/session';
import { useSession } from '@/state/session';

/**
 * "Tell Us About Yourself": pick Student or Parents, then continue to the matching login.
 * Always white with a violet Continue button, whatever the device theme (approved design).
 */
export function RoleSelectScreen() {
  const router = useRouter();
  const [role, setRole] = useState<AppRole | null>(null);

  const onContinue = () => {
    if (!role) return;
    void useSession.getState().selectRole(role);
    router.push({ pathname: '/(auth)/login', params: { role } });
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={styles.title}>
            Tell Us About Yourself
          </Text>
          <Text style={styles.subtitle}>
            Tell us a little about yourself so we can get to know you better.
          </Text>
        </View>

        <View accessibilityRole="radiogroup" style={styles.cards}>
          <SelectCard
            testID="role-student"
            title="Student"
            description="Are you planning to use our platform for learning?"
            illustration={null}
            selected={role === 'student'}
            onPress={() => setRole('student')}
          />
          <SelectCard
            testID="role-parent"
            title="Parents"
            description="Learning through engaging meaningful experiences."
            illustration={<ParentsIllustration />}
            selected={role === 'parent'}
            onPress={() => setRole('parent')}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Pressable
          testID="role-continue"
          accessibilityRole="button"
          accessibilityLabel="Continue to sign in"
          accessibilityState={{ disabled: !role }}
          disabled={!role}
          onPress={onContinue}
          style={[styles.button, !role && styles.buttonDisabled]}
        >
          <Text style={styles.buttonLabel}>Continue</Text>
          <ArrowRight size={16} color="#FFFFFF" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background },
  body: { flex: 1, paddingHorizontal: 20 },
  header: { alignItems: 'center', marginTop: 72, paddingHorizontal: 12 },
  title: { color: C.title, fontSize: 24, fontWeight: '700', textAlign: 'center' },
  subtitle: {
    color: C.subtitle,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginTop: 8,
  },
  cards: { flexDirection: 'row', gap: 14, marginTop: 56 },
  footer: { paddingHorizontal: 20, paddingBottom: 24 },
  button: {
    height: 50,
    borderRadius: 12,
    backgroundColor: C.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: C.accent,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  buttonDisabled: { backgroundColor: C.accentDisabled, shadowOpacity: 0, elevation: 0 },
  buttonLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
