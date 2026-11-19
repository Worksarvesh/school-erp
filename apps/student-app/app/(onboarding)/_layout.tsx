import React from 'react';
import { Stack } from 'expo-router';
import { WebColumn } from '@/components';

export default function OnboardingLayout() {
  return (
    <WebColumn>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="complete-profile" />
      </Stack>
    </WebColumn>
  );
}
