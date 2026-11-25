import { useRouter } from 'expo-router';
import { School } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Screen, useTheme, Text, scaled } from '@school-erp/ui';
import { useSession } from '@/state/session';

const SPLASH_MS = 1500;

/** Logo placeholder for ~1.5 s, then the role picker. */
export function SplashScreen() {
  const router = useRouter();
  const { colors, spacing, radii, typography } = useTheme();

  useEffect(() => {
    void useSession.getState().hydrate();
    const timer = setTimeout(() => router.replace('/(auth)/role-select'), SPLASH_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Screen contentContainerStyle={{ alignItems: 'center', justifyContent: 'center' }}>
      <View
        accessibilityRole="image"
        accessibilityLabel="School app logo"
        style={{
          width: 112,
          height: 112,
          borderRadius: radii.xl,
          backgroundColor: colors.surfaceSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <School size={scaled(56)} color={colors.primary} />
      </View>
      <Text
        style={{
          marginTop: spacing.base,
          color: colors.text,
          fontSize: typography.fontSizes.xl,
          fontWeight: typography.fontWeights.bold,
        }}
      >
        School Portal
      </Text>
    </Screen>
  );
}
