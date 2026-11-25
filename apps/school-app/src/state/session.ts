import { create } from 'zustand';
import { SecureStorage } from '@school-erp/mobile-core';
import type { Membership } from '@/mock/memberships';

/**
 * School App UI session: the signed-in person's school memberships and which one is active.
 *
 * Tokens and isAuthenticated stay in @school-erp/mobile-core's useAuthStore (the root layout
 * guard reads it). Every tenant call uses `activeMembership.schoolId` in the path
 * (`schoolPath()`); switching membership switches school and permissions together.
 *
 * Only the active school id is kept on the device. Memberships and permissions are reloaded
 * from the API on start (MOCK: kept in memory, so a reload signs out the demo).
 */
export type LoginPath = 'principal' | 'staff';

const ACTIVE_SCHOOL_KEY = 'school_app_active_school';

interface SessionState {
  fullName: string;
  memberships: Membership[];
  activeMembership: Membership | null;
  loginPath: LoginPath | null;
  /** Staff signed in with a temporary password must set a new one before anything else. */
  mustChangePassword: boolean;
  /** Principal OTP: the mobile number the code was sent to. Never logged. */
  pendingMobile: string | null;
  isHydrated: boolean;

  hydrate: () => Promise<void>;
  chooseLoginPath: (path: LoginPath) => void;
  setPendingMobile: (mobile: string | null) => void;
  startSession: (input: {
    fullName: string;
    memberships: Membership[];
    mustChangePassword?: boolean;
  }) => Promise<void>;
  switchMembership: (schoolId: string, role: Membership['role']) => Promise<void>;
  passwordChanged: () => void;
  clear: () => Promise<void>;
}

export const useSession = create<SessionState>((set, get) => ({
  fullName: '',
  memberships: [],
  activeMembership: null,
  loginPath: null,
  mustChangePassword: false,
  pendingMobile: null,
  isHydrated: false,

  hydrate: async () => {
    // MOCK: nothing to restore without the API. Real version: GET /v1/me, then pick the stored
    // active school if the member still has an active membership there.
    set({ isHydrated: true });
  },

  chooseLoginPath: (loginPath) => set({ loginPath }),

  setPendingMobile: (pendingMobile) => set({ pendingMobile }),

  startSession: async ({ fullName, memberships, mustChangePassword = false }) => {
    const storedSchool = await SecureStorage.getItem(ACTIVE_SCHOOL_KEY);
    const active = memberships.find((m) => m.schoolId === storedSchool) ?? memberships[0] ?? null;
    set({
      fullName,
      memberships,
      activeMembership: active,
      mustChangePassword,
      pendingMobile: null,
    });
    if (active) await SecureStorage.setItem(ACTIVE_SCHOOL_KEY, active.schoolId);
  },

  switchMembership: async (schoolId, role) => {
    const next = get().memberships.find((m) => m.schoolId === schoolId && m.role === role);
    if (!next) return;
    set({ activeMembership: next });
    await SecureStorage.setItem(ACTIVE_SCHOOL_KEY, next.schoolId);
  },

  passwordChanged: () => set({ mustChangePassword: false }),

  clear: async () => {
    set({
      fullName: '',
      memberships: [],
      activeMembership: null,
      loginPath: null,
      mustChangePassword: false,
      pendingMobile: null,
    });
    await SecureStorage.removeItem(ACTIVE_SCHOOL_KEY);
  },
}));

export type LandingRoute = '/(auth)/change-password' | '/(tabs)';

export function landingRouteAfterSignIn(
  state: Pick<SessionState, 'mustChangePassword'>,
): LandingRoute {
  return state.mustChangePassword ? '/(auth)/change-password' : '/(tabs)';
}
