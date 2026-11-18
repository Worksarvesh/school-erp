import { create } from 'zustand';

export type RoleType = 'student' | null;

interface RoleState {
  selectedRole: RoleType;
  setSelectedRole: (role: RoleType) => void;
  resetRole: () => void;
}

/**
 * Local in-memory role store for onboarding/login selection.
 * Independent of global auth state and backend session.
 */
export const useRoleStore = create<RoleState>((set) => ({
  selectedRole: null,
  setSelectedRole: (role) => set({ selectedRole: role }),
  resetRole: () => set({ selectedRole: null }),
}));
