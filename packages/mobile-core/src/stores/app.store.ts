import { create } from 'zustand';

export interface AppState {
  activeSchoolId: string | null;
  activeSchoolName: string | null;
  themeMode: 'system' | 'light' | 'dark';

  setActiveSchool: (id: string, name: string) => void;
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSchoolId: null,
  activeSchoolName: null,
  themeMode: 'system',

  setActiveSchool: (id: string, name: string) =>
    set({ activeSchoolId: id, activeSchoolName: name }),

  setThemeMode: (mode: 'system' | 'light' | 'dark') => set({ themeMode: mode }),
}));
