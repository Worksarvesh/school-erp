import { create } from 'zustand';
import { SecureStorage } from '@school-erp/mobile-core';
import type { BloodGroup, Gender } from '@/mock/student';
import { mockStudent } from '@/mock/student';

/**
 * Student-app UI session: which role is using the app, whether the student has already seen the
 * profile-completion prompt, and (parent mode) which child is selected.
 *
 * Sign-in itself (isAuthenticated, tokens) stays in @school-erp/mobile-core's useAuthStore, which
 * the root layout guard reads. Role and "prompt seen" are kept on the device so the profile prompt
 * is shown only once after a student's first login. MOCK: no network.
 */
export type AppRole = 'student' | 'parent';

export interface OptionalProfile {
  /** Required fields the student confirmed or corrected on the profile-completion screen. */
  parentName?: string;
  parentMobile?: string;
  gender?: Gender;
  /** ISO date (yyyy-mm-dd). */
  dateOfBirth?: string;
  heightCm?: number;
  bloodGroup?: BloodGroup;
  weightKg?: number;
  studentMobile?: string;
  email?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  hobbies?: string;
  /** Only when the school has no parent mobile on record; pending school confirmation. */
  pendingParentMobile?: string;
}

const ROLE_KEY = 'student_app_role';
const PROFILE_PROMPT_KEY = 'student_app_profile_prompt_seen';

interface SessionState {
  role: AppRole | null;
  profilePromptSeen: boolean;
  isHydrated: boolean;
  optionalProfile: OptionalProfile;
  selectedChildId: string;
  hydrate: () => Promise<void>;
  selectRole: (role: AppRole) => Promise<void>;
  markProfilePromptSeen: () => Promise<void>;
  saveProfile: (profile: OptionalProfile) => void;
  selectChild: (childId: string) => void;
}

let hydration: Promise<void> | null = null;

export const useSession = create<SessionState>((set, get) => ({
  role: null,
  profilePromptSeen: false,
  isHydrated: false,
  optionalProfile: {},
  selectedChildId: mockStudent.id,

  hydrate: () => {
    if (!hydration) {
      hydration = (async () => {
        try {
          const [storedRole, storedSeen] = await Promise.all([
            SecureStorage.getItem(ROLE_KEY),
            SecureStorage.getItem(PROFILE_PROMPT_KEY),
          ]);
          const role: AppRole | null =
            storedRole === 'student' || storedRole === 'parent' ? storedRole : null;
          // A value chosen in this run (before hydration finished) wins over the stored one.
          set({
            role: get().role ?? role,
            profilePromptSeen: get().profilePromptSeen || storedSeen === 'true',
            isHydrated: true,
          });
        } catch {
          set({ isHydrated: true });
        }
      })();
    }
    return hydration;
  },

  selectRole: async (role) => {
    set({ role });
    await SecureStorage.setItem(ROLE_KEY, role);
  },

  markProfilePromptSeen: async () => {
    set({ profilePromptSeen: true });
    await SecureStorage.setItem(PROFILE_PROMPT_KEY, 'true');
  },

  saveProfile: (optionalProfile) => set({ optionalProfile }),

  selectChild: (selectedChildId) => set({ selectedChildId }),
}));

export type LandingRoute = '/(onboarding)/complete-profile' | '/(tabs)';

/** Where a signed-in user lands: students see the profile prompt once; parents go straight Home. */
export function landingRouteAfterSignIn(
  state: Pick<SessionState, 'role' | 'profilePromptSeen'>,
): LandingRoute {
  return state.role === 'student' && !state.profilePromptSeen
    ? '/(onboarding)/complete-profile'
    : '/(tabs)';
}
