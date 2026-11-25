import { useAuthStore } from '@school-erp/mobile-core';
import { useSession } from '@/state/session';
import type { SignInResult } from './api/auth.service';

/** Stores the sign-in result: tokens in useAuthStore, memberships in useSession. */
export function useCompleteSignIn() {
  const setSession = useAuthStore((s) => s.setSession);
  const startSession = useSession((s) => s.startSession);

  return async (result: SignInResult) => {
    // Session first: the root guard redirects as soon as isAuthenticated flips.
    await startSession({
      fullName: result.fullName,
      memberships: result.memberships,
      mustChangePassword: result.mustChangePassword,
    });
    await setSession(result.login);
  };
}

/** Signs out locally. Real version also calls POST /v1/auth/logout. */
export function useSignOut() {
  const logout = useAuthStore((s) => s.logout);
  const clear = useSession((s) => s.clear);
  return async () => {
    await clear();
    await logout();
  };
}
