import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, ScreenContainer, SelectCard } from '@/components';
import type { Role } from '@/state/session';
import { useSession } from '@/state/session';
import { colors, spacing, typography } from '@/theme';

/** "Tell Us About Yourself": pick Student or Parent, then continue to the matching login. */
export function RoleSelectScreen() {
  const router = useRouter();
  const selectRole = useSession((s) => s.selectRole);
  const [role, setRole] = useState<Role | null>(null);

  const onContinue = () => {
    if (!role) return;
    selectRole(role);
    router.push({ pathname: '/login', params: { role } });
  };

  return (
    <ScreenContainer
      footer={
        <PrimaryButton
          testID="role-continue"
          label="Continue"
          trailingIcon="arrow-right"
          disabled={!role}
          accessibilityHint="Opens the sign-in screen for the selected role"
          onPress={onContinue}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">
          Tell Us About Yourself
        </Text>
        <Text style={styles.subtitle}>
          Tell us a little about yourself so we can get to know you better.
        </Text>
      </View>

      <View style={styles.middle}>
        <View style={styles.cards} accessibilityRole="radiogroup">
          <SelectCard
            testID="role-student"
            title="Student"
            description="Are you planning to use our platform for learning?"
            illustrationIcon="book-open"
            selected={role === 'student'}
            onPress={() => setRole('student')}
          />
          <SelectCard
            testID="role-parent"
            title="Parents"
            description="Learning through engaging meaningful experiences."
            illustrationIcon="users"
            selected={role === 'parent'}
            onPress={() => setRole('parent')}
          />
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxxl },
  title: { ...typography.title, color: colors.textPrimary, textAlign: 'center' },
  subtitle: { ...typography.subtitle, color: colors.textSecondary, textAlign: 'center' },
  middle: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xxxl },
  cards: { flexDirection: 'row', gap: spacing.md, paddingTop: spacing.sm },
});
