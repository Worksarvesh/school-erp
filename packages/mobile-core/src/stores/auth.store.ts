import { create } from 'zustand';
import type { UserSummaryDto, LoginResponseDto } from '@school-erp/api-client';
import { SecureStorage } from '../storage/secure-store.js';

const ACCESS_TOKEN_KEY = 'school_erp_access_token';
const REFRESH_TOKEN_KEY = 'school_erp_refresh_token';
const SESSION_ID_KEY = 'school_erp_session_id';
const ONBOARDING_KEY = 'school_erp_onboarding_completed';

export interface AuthState {
  user: UserSummaryDto | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  hasCompletedOnboarding: boolean;

  setSession: (data: LoginResponseDto) => Promise<void>;
  completeOnboarding: () => Promise<void>;
  logout: () => Promise<void>;
  hydrateSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isHydrating: true,
  hasCompletedOnboarding: false,

  setSession: async (data: LoginResponseDto) => {
    await SecureStorage.setItem(ACCESS_TOKEN_KEY, data.tokens.accessToken);
    await SecureStorage.setItem(REFRESH_TOKEN_KEY, data.tokens.refreshToken);
    await SecureStorage.setItem(SESSION_ID_KEY, data.tokens.sessionId);

    const onboardingDone = (await SecureStorage.getItem(ONBOARDING_KEY)) === 'true';

    set({
      user: data.user,
      isAuthenticated: true,
      isHydrating: false,
      hasCompletedOnboarding: onboardingDone,
    });
  },

  completeOnboarding: async () => {
    await SecureStorage.setItem(ONBOARDING_KEY, 'true');
    set({ hasCompletedOnboarding: true });
  },

  logout: async () => {
    await SecureStorage.removeItem(ACCESS_TOKEN_KEY);
    await SecureStorage.removeItem(REFRESH_TOKEN_KEY);
    await SecureStorage.removeItem(SESSION_ID_KEY);
    set({
      user: null,
      isAuthenticated: false,
      isHydrating: false,
    });
  },

  hydrateSession: async () => {
    try {
      const accessToken = await SecureStorage.getItem(ACCESS_TOKEN_KEY);
      const onboardingDone = (await SecureStorage.getItem(ONBOARDING_KEY)) === 'true';

      if (accessToken) {
        // Active token found; in production, you can call /v1/me to validate
        set({
          isAuthenticated: true,
          isHydrating: false,
          hasCompletedOnboarding: onboardingDone,
        });
      } else {
        set({
          isAuthenticated: false,
          isHydrating: false,
          hasCompletedOnboarding: onboardingDone,
        });
      }
    } catch {
      set({
        isAuthenticated: false,
        isHydrating: false,
      });
    }
  },
}));
