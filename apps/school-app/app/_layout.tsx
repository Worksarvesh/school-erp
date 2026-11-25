import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { Screen, StateView, ThemeProvider } from '@school-erp/ui';
import { queryClient, useAuthStore } from '@school-erp/mobile-core';
import { landingRouteAfterSignIn, useSession } from '@/state/session';

/**
 * Route guard. Signed out -> (auth). Signed in -> change-password first if the account has a
 * temporary password, else (tabs). Signed in with no active membership (stale token, or every
 * membership revoked) -> signed out. UX only: the API checks every request on its own.
 */
function RootNavigationGate() {
  const segments = useSegments();
  const router = useRouter();

  const isHydrating = useAuthStore((s) => s.isHydrating);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hydrateAuth = useAuthStore((s) => s.hydrateSession);
  const logout = useAuthStore((s) => s.logout);
  const sessionHydrated = useSession((s) => s.isHydrated);
  const activeMembership = useSession((s) => s.activeMembership);
  const mustChangePassword = useSession((s) => s.mustChangePassword);

  useEffect(() => {
    void hydrateAuth();
    void useSession.getState().hydrate();
  }, [hydrateAuth]);

  useEffect(() => {
    if (isHydrating || !sessionHydrated) return;
    const path = segments as readonly string[];
    const inAuthGroup = path[0] === '(auth)';
    const onChangePassword = inAuthGroup && path[1] === 'change-password';

    if (isAuthenticated && !activeMembership) {
      void logout();
      return;
    }
    if (!isAuthenticated) {
      if (!inAuthGroup || onChangePassword) router.replace('/(auth)/splash');
      return;
    }
    const landing = landingRouteAfterSignIn({ mustChangePassword });
    if (mustChangePassword && !onChangePassword) router.replace(landing);
    else if (!mustChangePassword && inAuthGroup) router.replace(landing);
  }, [
    isHydrating,
    sessionHydrated,
    isAuthenticated,
    activeMembership,
    mustChangePassword,
    segments,
    router,
    logout,
  ]);

  if (isHydrating || !sessionHydrated) {
    return (
      <Screen>
        <StateView state="loading" title="Starting School ERP..." />
      </Screen>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="coming-soon" options={{ presentation: 'card' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider initialMode="light">
        <RootNavigationGate />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
