import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="principal-login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="staff-login" />
      <Stack.Screen name="change-password" options={{ gestureEnabled: false }} />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
