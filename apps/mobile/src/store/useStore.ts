import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser, Profile, Medication, Task, AppState } from '../types';

interface AuthSlice {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

interface DataSlice {
  profiles: Profile[];
  medications: Medication[];
  todayTasks: Task[];
  setProfiles: (profiles: Profile[]) => void;
  setMedications: (meds: Medication[]) => void;
  setTodayTasks: (tasks: Task[]) => void;
  updateTaskStatus: (taskId: string, status: import('../types').TaskStatus) => void;
  upsertMedication: (med: Medication) => void;
  removeMedication: (id: string) => void;
  upsertProfile: (profile: Profile) => void;
  removeProfile: (id: string) => void;
  selectedProfileId: string | null;
  setSelectedProfileId: (id: string | null) => void;
}

interface SyncSlice {
  appState: AppState;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setSyncResult: (success: boolean, error?: string) => void;
}

interface SettingsSlice {
  apiUrl: string;
  setApiUrl: (url: string) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
}

type StoreState = AuthSlice & DataSlice & SyncSlice & SettingsSlice;

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      token: null,
      setAuth: (user, token) => {
        AsyncStorage.setItem('auth_token', token);
        set({ user, token });
      },
      clearAuth: () => {
        AsyncStorage.removeItem('auth_token');
        set({ user: null, token: null });
      },

      // Data
      profiles: [],
      medications: [],
      todayTasks: [],
      selectedProfileId: null,

      setProfiles: (profiles) => set({ profiles }),
      setMedications: (medications) => set({ medications }),
      setTodayTasks: (todayTasks) => set({ todayTasks }),

      updateTaskStatus: (taskId, status) =>
        set((state) => ({
          todayTasks: state.todayTasks.map((t) =>
            t.id === taskId
              ? { ...t, status, takenAt: status === 'TAKEN' ? new Date().toISOString() : t.takenAt }
              : t
          ),
        })),

      upsertMedication: (med) =>
        set((state) => {
          const existing = state.medications.findIndex((m) => m.id === med.id);
          if (existing >= 0) {
            const meds = [...state.medications];
            meds[existing] = med;
            return { medications: meds };
          }
          return { medications: [...state.medications, med] };
        }),

      removeMedication: (id) =>
        set((state) => ({
          medications: state.medications.filter((m) => m.id !== id),
        })),

      upsertProfile: (profile) =>
        set((state) => {
          const existing = state.profiles.findIndex((p) => p.id === profile.id);
          if (existing >= 0) {
            const ps = [...state.profiles];
            ps[existing] = profile;
            return { profiles: ps };
          }
          return { profiles: [...state.profiles, profile] };
        }),

      removeProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
        })),

      setSelectedProfileId: (id) => set({ selectedProfileId: id }),

      // Sync
      appState: {
        isOnline: true,
        isSyncing: false,
        lastSyncAt: null,
        syncError: null,
      },

      setOnline: (online) =>
        set((state) => ({
          appState: { ...state.appState, isOnline: online },
        })),

      setSyncing: (syncing) =>
        set((state) => ({
          appState: { ...state.appState, isSyncing: syncing, syncError: null },
        })),

      setSyncResult: (success, error) =>
        set((state) => ({
          appState: {
            ...state.appState,
            isSyncing: false,
            lastSyncAt: success ? new Date().toISOString() : state.appState.lastSyncAt,
            syncError: error ?? null,
          },
        })),

      // Settings
      apiUrl: 'http://10.0.2.2:3000',
      setApiUrl: (url) => set({ apiUrl: url }),
      notificationsEnabled: true,
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    {
      name: 'fanafodiko-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        apiUrl: state.apiUrl,
        notificationsEnabled: state.notificationsEnabled,
        selectedProfileId: state.selectedProfileId,
        appState: { ...state.appState, isSyncing: false, syncError: null },
      }),
    }
  )
);

export const selectIsAuthenticated = (s: StoreState) => !!s.token;
export const selectUser = (s: StoreState) => s.user;
export const selectProfiles = (s: StoreState) => s.profiles;
export const selectMedications = (s: StoreState) => s.medications;
export const selectTodayTasks = (s: StoreState) => s.todayTasks;
export const selectAppState = (s: StoreState) => s.appState;
export const selectSelectedProfileId = (s: StoreState) => s.selectedProfileId;
