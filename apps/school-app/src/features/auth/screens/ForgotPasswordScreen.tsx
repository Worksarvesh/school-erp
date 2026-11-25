import React from 'react';
import { useRouter } from 'expo-router';
import { Header, Screen, StateView } from '@school-erp/ui';

/** SCHOOL-AUTH-FORGOT-PASSWORD: static. Staff passwords are reset by the Principal or Admin. */
export function ForgotPasswordScreen() {
  const router = useRouter();
  return (
    <Screen header={<Header title="Forgot password" showBack onBack={() => router.back()} />}>
      <StateView
        state="empty"
        title="Contact your Principal or Admin"
        description="They can reset your password and give you a new temporary one."
        actionLabel="Back to sign in"
        onAction={() => router.back()}
      />
    </Screen>
  );
}
