import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Share2 } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ShareSheet } from '@/components/ShareSheet';
import { authService } from '@/features/auth/api/auth.service';
import { useCompleteSignIn } from '@/features/auth/useSignIn';

const BLUE = '#1D4ED8';
/** Time to read the result line before the dashboard opens. */
const DASHBOARD_DELAY_MS = 1200;

/** MOCK: the school gives this account its username and a temporary password. Real ones come from the API. */
const MOCK_USERNAME = 'SchoolAd00001';
function mockPassword(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  return Array.from({ length: 12 }, () => letters[Math.floor(Math.random() * 26)]).join('');
}

/**
 * SCHOOL-SETUP-ADMIN-LOGIN-DETAIL: the username and temporary password for the Admin the principal
 * just added, with a button to share them. The password is never logged.
 */
export function AdminLoginDetailScreen() {
  const password = useMemo(mockPassword, []);
  const [notice, setNotice] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const completeSignIn = useCompleteSignIn();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  // MOCK: once the details are shared, the principal is signed in and the root guard opens the
  // dashboard. The real app will already hold the principal's session here.
  const openDashboard = () => {
    if (timer.current) return;
    timer.current = setTimeout(() => {
      void authService.verifyPrincipalOtp('', '0000').then(completeSignIn);
    }, DASHBOARD_DELAY_MS);
  };
  const message = `Your School ERP admin login
User name: ${MOCK_USERNAME}
Password: ${password}`;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <SafeAreaView edges={['top']} style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Admin Login Detail
        </Text>
      </SafeAreaView>

      <View style={styles.sheet}>
        <ScrollView contentContainerStyle={styles.form}>
          <Text style={styles.label}>User Name</Text>
          <View style={styles.box}>
            <Text selectable testID="admin-username" style={styles.value}>
              {MOCK_USERNAME}
            </Text>
          </View>

          <Text style={[styles.label, styles.gap]}>Password</Text>
          <View style={styles.box}>
            <Text selectable testID="admin-password" style={styles.value}>
              {password}
            </Text>
          </View>

          <Pressable
            testID="share-admin"
            accessibilityRole="button"
            accessibilityLabel="Share to Admin"
            onPress={() => {
              setNotice(null);
              setSharing(true);
            }}
            style={styles.button}
          >
            <Share2 size={22} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.buttonLabel}>{'Share to  Admin'}</Text>
          </Pressable>
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        </ScrollView>
      </View>

      <ShareSheet
        visible={sharing}
        onClose={() => setSharing(false)}
        message={message}
        subject="Your School ERP admin login"
        onResult={setNotice}
        onShared={openDashboard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BLUE },
  header: { backgroundColor: BLUE, paddingBottom: 43 },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 14,
  },
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  form: { paddingHorizontal: 19, paddingTop: 41, paddingBottom: 32 },
  label: { color: '#555555', fontSize: 15, lineHeight: 20, marginBottom: 8 },
  gap: { marginTop: 24 },
  box: {
    height: 48,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#CACACA',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  value: { color: '#333333', fontSize: 16 },
  button: {
    height: 58,
    marginTop: 26,
    borderRadius: 14,
    backgroundColor: BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  buttonLabel: { color: '#FFFFFF', fontSize: 20, fontWeight: '600' },
  notice: { color: '#16A34A', fontSize: 13, textAlign: 'center', marginTop: 10 },
});
