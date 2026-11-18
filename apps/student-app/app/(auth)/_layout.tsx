import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="role-selection" />
      <Stack.Screen name="student-login" />
      <Stack.Screen name="login" />
    </Stack>
  );
}
