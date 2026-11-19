import React from 'react';
import { Stack } from 'expo-router';
import { WebColumn } from '@/components';

export default function AuthLayout() {
  return (
    <WebColumn backgroundColor="#FFFFFF">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="splash" />
        <Stack.Screen name="role-select" />
        <Stack.Screen name="login" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="contact-admin" />
      </Stack>
    </WebColumn>
  );
}
