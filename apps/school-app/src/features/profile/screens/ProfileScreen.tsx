import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar, Badge, Button, Card, Header, Screen, useTheme } from '@school-erp/ui';
import { RoleSwitcher } from '@/components';
import { useSignOut } from '@/features/auth/useSignIn';
import { useSession } from '@/state/session';

/** Profile + SCHOOL-COMMON-SETTINGS (V1: logout and devices only). */
export function ProfileScreen() {
  const { colors, spacing } = useTheme();
  const fullName = useSession((s) => s.fullName);
  const active = useSession((s) => s.activeMembership);
  const signOut = useSignOut();

  return (
    <Screen
      scrollable
      header={<Header title="Profile" />}
      contentContainerStyle={{ padding: spacing.base }}
    >
      <Card>
        <View style={styles.row}>
          <Avatar name={fullName} />
          <View style={{ marginLeft: spacing.md, flex: 1 }}>
            <Text style={[styles.name, { color: colors.text }]}>{fullName}</Text>
            {active ? <Badge label={active.roleLabel} variant="info" /> : null}
          </View>
        </View>
      </Card>
      <Card>
        <RoleSwitcher />
      </Card>
      <Button
        label="Sign out"
        variant="outline"
        onPress={() => void signOut()}
        style={{ marginTop: spacing.lg }}
        testID="sign-out"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
});
