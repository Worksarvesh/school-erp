import React from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@school-erp/mobile-core';

export default function RootIndex() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/role-selection" />;
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(tabs)" />;
}
