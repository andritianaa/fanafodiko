import { create } from 'zustand';

interface AuthResetState {
  resetEmail: string | null;
  setResetEmail: (email: string | null) => void;
}

export const useAuthResetStore = create<AuthResetState>((set) => ({
  resetEmail: null,
  setResetEmail: (email) => set({ resetEmail: email }),
}));
