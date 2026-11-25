import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { useTheme } from '@school-erp/ui';
import type { AppModule } from '@/core/navigation/modules';
import { ModuleIcon } from './ModuleIcon';

/** Grid of module tiles. `coming_soon` modules open the shared placeholder screen. */
export function ModuleGrid({ modules }: { modules: AppModule[] }) {
  const { colors, radii, spacing } = useTheme();
  const router = useRouter();

  const open = (m: AppModule) => {
    if (m.status === 'ready' && m.route) {
      router.push(m.route as Href);
    } else {
      router.push({ pathname: '/coming-soon', params: { module: m.id } });
    }
  };

  return (
    <View style={styles.grid}>
      {modules.map((m) => (
        <Pressable
          key={m.id}
          testID={`module-${m.id}`}
          accessibilityRole="button"
          accessibilityLabel={m.title}
          onPress={() => open(m)}
          style={[
            styles.tile,
            {
              backgroundColor: colors.surfaceSubtle,
              borderRadius: radii.lg,
              padding: spacing.md,
            },
          ]}
        >
          <ModuleIcon name={m.icon} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
            {m.title}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  tile: { width: '31%', minHeight: 96, margin: '1%', justifyContent: 'space-between' },
  title: { fontSize: 13, fontWeight: '600', marginTop: 8 },
});
