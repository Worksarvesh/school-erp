import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Screen, StateView, useTheme } from '@school-erp/ui';
import { ModuleGrid, RoleSwitcher } from '@/components';
import { visibleModules } from '@/core/navigation/modules';
import { useSession } from '@/state/session';

/**
 * One Home for every staff role (Principal, VP, Admin, Teacher, Non-teaching). The tiles come
 * from the module registry filtered by the active membership's PERMISSIONS, never by role name,
 * so a per-member permission grant shows up here with no code change.
 */
export function HomeScreen() {
  const { colors, spacing } = useTheme();
  const fullName = useSession((s) => s.fullName);
  const active = useSession((s) => s.activeMembership);
  const modules = visibleModules(active?.permissions ?? []);

  return (
    <Screen scrollable contentContainerStyle={{ padding: spacing.base }}>
      <RoleSwitcher />
      <Text style={[styles.greeting, { color: colors.text, marginVertical: spacing.md }]}>
        Hello, {fullName || 'there'}
      </Text>
      {modules.length > 0 ? (
        <View>
          <Text style={[styles.section, { color: colors.textSecondary }]}>Your modules</Text>
          <ModuleGrid modules={modules} />
        </View>
      ) : (
        <StateView
          state="empty"
          title="Nothing here yet"
          description="Your school has not given you access to any module. Ask your Principal or Admin."
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  greeting: { fontSize: 22, fontWeight: '700' },
  section: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
});
