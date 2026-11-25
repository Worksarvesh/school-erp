import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { Card, useTheme } from '@school-erp/ui';
import { useSession } from '@/state/session';

/**
 * SCHOOL-COMMON-ROLE-SWITCHER: picks the active membership (school + role). Switching changes
 * the school id used in every API path and the permissions the app shows.
 */
export function RoleSwitcher() {
  const { colors, spacing } = useTheme();
  const [open, setOpen] = useState(false);
  const memberships = useSession((s) => s.memberships);
  const active = useSession((s) => s.activeMembership);
  const switchMembership = useSession((s) => s.switchMembership);

  if (!active) return null;
  const canSwitch = memberships.length > 1;

  return (
    <>
      <Pressable
        testID="role-switcher"
        accessibilityRole="button"
        accessibilityLabel={`${active.roleLabel} at ${active.schoolName}`}
        disabled={!canSwitch}
        onPress={() => setOpen(true)}
        style={styles.trigger}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.school, { color: colors.text }]} numberOfLines={1}>
            {active.schoolName}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{active.roleLabel}</Text>
        </View>
        {canSwitch ? <ChevronDown size={20} color={colors.textSecondary} /> : null}
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={{ padding: spacing.base }}>
            <Card>
              <Text style={[styles.sheetTitle, { color: colors.text }]}>Switch role</Text>
              {memberships.map((m) => {
                const selected = m.schoolId === active.schoolId && m.role === active.role;
                return (
                  <Pressable
                    key={`${m.schoolId}:${m.role}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      void switchMembership(m.schoolId, m.role);
                      setOpen(false);
                    }}
                    style={[
                      styles.option,
                      { backgroundColor: selected ? colors.surfaceSubtle : 'transparent' },
                    ]}
                  >
                    <Text style={{ color: colors.text, fontWeight: '600' }}>{m.roleLabel}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>
                      {m.schoolName}
                    </Text>
                  </Pressable>
                );
              })}
            </Card>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  school: { fontSize: 18, fontWeight: '700' },
  backdrop: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.4)' },
  sheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  option: { paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8 },
});
