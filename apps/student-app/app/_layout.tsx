import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, Screen, StateView, useTheme } from '@school-erp/ui';
import { queryClient, useAuthStore } from '@school-erp/mobile-core';

function RootNavigationGate() {
  const { isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  const isHydrating = useAuthStore((state) => state.isHydrating);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);

  useEffect(() => {
    hydrateSession();
  }, [hydrateSession]);

  useEffect(() => {
    if (isHydrating) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/role-selection');
    } else if (isAuthenticated && !hasCompletedOnboarding && !inOnboarding) {
      router.replace('/(onboarding)');
    } else if (isAuthenticated && hasCompletedOnboarding && (inAuthGroup || inOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [isHydrating, isAuthenticated, hasCompletedOnboarding, segments, router]);

  if (isHydrating) {
    return (
      <Screen>
        <StateView state="loading" title="Starting School Portal..." />
      </Screen>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Drilldown Push Screens (presentation: 'card') */}
        <Stack.Screen name="timetable" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="attendance" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen
          name="homework/index"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen name="homework/[id]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen
          name="examinations/index"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="examinations/results"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen name="syllabus" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="notices/index" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="notices/[id]" options={{ headerShown: false, presentation: 'card' }} />

        {/* Modals & Bottom Sheets */}
        <Stack.Screen
          name="notifications"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="forgot-password-modal"
          options={{
            headerShown: false,
            presentation: 'formSheet',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RootNavigationGate />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
