import { create } from 'zustand';
import type { BloodGroup } from '@/mock/student';

export type Role = 'student' | 'parent';

export interface OptionalProfile {
  heightCm?: number;
  bloodGroup?: BloodGroup;
}

interface SessionState {
  role: Role | null;
  isSignedIn: boolean;
  /** True once the student saved the optional profile fields. */
  profileCompleted: boolean;
  /** True once the student has seen the profile prompt (saved or skipped). Never blocks Home. */
  profilePromptSeen: boolean;
  optionalProfile: OptionalProfile;
  selectRole: (role: Role) => void;
  signIn: (role: Role) => void;
  saveProfile: (profile: OptionalProfile) => void;
  skipProfile: () => void;
}

/**
 * MOCK session state, in memory only (lost when the app restarts). No tokens, no network:
 * real authentication arrives with the backend integration.
 */
export const useSession = create<SessionState>((set) => ({
  role: null,
  isSignedIn: false,
  profileCompleted: false,
  profilePromptSeen: false,
  optionalProfile: {},
  selectRole: (role) => set({ role }),
  signIn: (role) => set({ role, isSignedIn: true }),
  saveProfile: (optionalProfile) =>
    set({ optionalProfile, profileCompleted: true, profilePromptSeen: true }),
  skipProfile: () => set({ profilePromptSeen: true }),
}));

/** Where a signed-in user lands: students see the profile prompt once, parents go straight Home. */
export function landingRouteAfterSignIn(state: Pick<SessionState, 'role' | 'profilePromptSeen'>) {
  return state.role === 'student' && !state.profilePromptSeen
    ? ('/complete-profile' as const)
    : ('/home' as const);
}
