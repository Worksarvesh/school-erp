import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, useTheme } from '@school-erp/ui';

/** SCHOOL-COMMON-SPLASH. */
export function SplashScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/(auth)/role-select'), 900);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <Screen>
      <View style={[styles.center, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>School ERP</Text>
        <Text style={styles.subtitle}>For principals, admins and staff</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { color: '#FFFFFF', fontSize: 30, fontWeight: '800' },
  subtitle: { color: '#FFFFFF', opacity: 0.85, marginTop: 8 },
});
