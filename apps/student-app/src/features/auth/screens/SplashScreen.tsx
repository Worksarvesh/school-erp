import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, sizes, timing, typography } from '@/theme';

/** Logo placeholder for ~1.5 s, then the role picker. */
export function SplashScreen() {
  const router = useRouter();
  useEffect(() => {
    const timer = setTimeout(() => router.replace('/role-select'), timing.splashMs);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.logo} accessibilityRole="image" accessibilityLabel="School app logo">
        <Text style={styles.logoText}>Logo</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: sizes.splashLogo,
    height: sizes.splashLogo,
    borderRadius: radius.pill,
    backgroundColor: colors.placeholderBlock,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { ...typography.heading, color: colors.textPrimary },
});
