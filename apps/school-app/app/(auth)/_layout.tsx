import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="splash" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="role-select" />
      <Stack.Screen name="principal-login" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="registration" options={{ gestureEnabled: false }} />
      <Stack.Screen name="select-school" options={{ gestureEnabled: false }} />
      <Stack.Screen name="add-staff" />
      <Stack.Screen name="add-admin" />
      <Stack.Screen name="admin-login-detail" />
      <Stack.Screen name="profile-verification" options={{ gestureEnabled: false }} />
      <Stack.Screen name="staff-login" />
      <Stack.Screen name="vice-principal-registration" />
      <Stack.Screen name="vice-principal-login" />
      <Stack.Screen name="change-password" options={{ gestureEnabled: false }} />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
