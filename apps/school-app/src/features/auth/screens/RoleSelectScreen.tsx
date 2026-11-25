import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Screen, useTheme } from '@school-erp/ui';
import { useSession, type LoginPath } from '@/state/session';

/**
 * SCHOOL-COMMON-ROLE-SELECTION: a client-side choice of LOGIN PATH only (Principal OTP vs staff
 * username). It grants nothing; what the person can do comes from their memberships.
 */
const OPTIONS: { path: LoginPath; title: string; description: string }[] = [
  { path: 'principal', title: 'Principal', description: 'Sign in with your mobile number (OTP)' },
  {
    path: 'staff',
    title: 'Admin, Vice Principal or Staff',
    description: 'Sign in with the username your school gave you',
  },
];

export function RoleSelectScreen() {
  const { colors, spacing } = useTheme();
  const router = useRouter();
  const chooseLoginPath = useSession((s) => s.chooseLoginPath);

  return (
    <Screen scrollable contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={[styles.title, { color: colors.text }]}>Who are you?</Text>
      <Text style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>
        Choose how you sign in.
      </Text>
      {OPTIONS.map((o) => (
        <Card
          key={o.path}
          testID={`login-path-${o.path}`}
          onPress={() => {
            chooseLoginPath(o.path);
            router.push(o.path === 'principal' ? '/(auth)/principal-login' : '/(auth)/staff-login');
          }}
        >
          <View>
            <Text style={[styles.optionTitle, { color: colors.text }]}>{o.title}</Text>
            <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{o.description}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', marginTop: 24 },
  optionTitle: { fontSize: 17, fontWeight: '700' },
});
