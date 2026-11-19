import { useRouter } from 'expo-router';
import { ArrowRight, BookOpen, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Screen, useTheme } from '@school-erp/ui';
import { SelectCard } from '@/components';
import type { AppRole } from '@/state/session';
import { useSession } from '@/state/session';

/** "Tell Us About Yourself": pick Student or Parents, then continue to the matching login. */
export function RoleSelectScreen() {
  const router = useRouter();
  const { colors, spacing, typography } = useTheme();
  const [role, setRole] = useState<AppRole | null>(null);

  const onContinue = () => {
    if (!role) return;
    void useSession.getState().selectRole(role);
    router.push({ pathname: '/(auth)/login', params: { role } });
  };

  return (
    <Screen
      contentContainerStyle={{ padding: spacing.xl }}
      footer={
        <View style={{ padding: spacing.xl }}>
          <Button
            testID="role-continue"
            label="Continue"
            size="lg"
            disabled={!role}
            rightIcon={<ArrowRight size={18} color={colors.primaryForeground} />}
            accessibilityLabel="Continue to sign in"
            onPress={onContinue}
          />
        </View>
      }
    >
      <View style={{ alignItems: 'center', gap: spacing.sm, marginTop: spacing['2xl'] }}>
        <Text
          accessibilityRole="header"
          style={{
            color: colors.text,
            fontSize: typography.fontSizes['2xl'],
            fontWeight: typography.fontWeights.bold,
            textAlign: 'center',
          }}
        >
          Tell Us About Yourself
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: typography.fontSizes.sm,
            textAlign: 'center',
          }}
        >
          Choose how you will use the app.
        </Text>
      </View>

      <View style={{ flex: 1, justifyContent: 'center', paddingVertical: spacing['2xl'] }}>
        <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', gap: spacing.md }}>
          <SelectCard
            testID="role-student"
            title="Student"
            description="Sign in with the username your school gave you."
            illustrationIcon={BookOpen}
            selected={role === 'student'}
            onPress={() => setRole('student')}
          />
          <SelectCard
            testID="role-parent"
            title="Parents"
            description="Sign in with your registered mobile number."
            illustrationIcon={Users}
            selected={role === 'parent'}
            onPress={() => setRole('parent')}
          />
        </View>
      </View>
    </Screen>
  );
}
