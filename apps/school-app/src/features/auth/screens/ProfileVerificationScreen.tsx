import React, { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- Metro bundles static images only through require().
const ILLUSTRATION = require('../../../../assets/onboarding/verification.png');

const MOCK_VERIFY_MS = 3000;

/**
 * SCHOOL-AUTH-PROFILE-VERIFICATION: shown to a new principal whose school profile is still being
 * verified by the platform team. Nothing to do here but wait, so there are no buttons.
 * MOCK: after a few seconds it counts as verified and Registration opens. The real app will move on
 * only when the API says the profile is verified.
 */
export function ProfileVerificationScreen() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace('/(auth)/registration'), MOCK_VERIFY_MS);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        <Image source={ILLUSTRATION} style={styles.image} resizeMode="contain" />
        <Text accessibilityRole="header" style={styles.title}>
          Profile Verification
        </Text>
        <Text style={styles.subtitle}>
          Your profile is under verification. Please wait up to 48 hours for verification to be
          completed.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  body: { flex: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 78 },
  image: { width: 277, height: 277 },
  title: {
    color: '#000000',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 40,
  },
  subtitle: {
    color: '#333333',
    fontSize: 16,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },
});
