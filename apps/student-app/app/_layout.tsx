import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, Screen, StateView, useTheme } from '@school-erp/ui';
import { queryClient, useAuthStore } from '@school-erp/mobile-core';
import { landingRouteAfterSignIn, useSession } from '@/state/session';
import { FONT_ASSETS } from '@/theme/fonts';

function RootNavigationGate() {
  const { isDark } = useTheme();
  const segments = useSegments();
  const router = useRouter();

  const isHydrating = useAuthStore((state) => state.isHydrating);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionHydrated = useSession((state) => state.isHydrated);
  const role = useSession((state) => state.role);
  const profilePromptSeen = useSession((state) => state.profilePromptSeen);
  const hydrateSession = useAuthStore((state) => state.hydrateSession);
  // A font load error falls back to the system font instead of blocking the app.
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);
  const fontsReady = fontsLoaded || fontError !== null;

  useEffect(() => {
    hydrateSession();
    void useSession.getState().hydrate();
  }, [hydrateSession]);

  useEffect(() => {
    if (isHydrating || !sessionHydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/splash');
    } else if (isAuthenticated && inAuthGroup) {
      // Signed in: students see the profile prompt once, everyone else goes Home.
      // (onboarding) and (tabs) are never redirected, so a student can open the profile
      // screen themselves from the Profile tab.
      router.replace(landingRouteAfterSignIn({ role, profilePromptSeen }));
    }
  }, [isHydrating, sessionHydrated, isAuthenticated, role, profilePromptSeen, segments, router]);

  if (isHydrating || !sessionHydrated || !fontsReady) {
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
          name="examinations/timetable"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="examinations/unit-tests"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="examinations/results"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="syllabus/index"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen name="syllabus/[id]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen
          name="syllabus/chapter/[chapterId]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen name="notices/index" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="notices/[id]" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="coming-soon" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen
          name="assignments/index"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen
          name="assignments/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />
        <Stack.Screen name="puzzle" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="assignments" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen name="sports" options={{ headerShown: false, presentation: 'card' }} />
        <Stack.Screen
          name="community/[id]"
          options={{ headerShown: false, presentation: 'card' }}
        />

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
      {/* The approved design is light only: ignore the phone/browser dark mode. */}
      <ThemeProvider initialMode="light">
        <RootNavigationGate />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
