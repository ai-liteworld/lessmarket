import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface StoredUser {
  id: string;
  phone: string;
  full_name: string;
  email?: string | null;
  location?: string | null;
}

interface AppState {
  token: string | null;
  user: StoredUser | null;
  setAuth: (token: string, user: StoredUser) => void;
  setUser: (user: StoredUser) => void;
  logout: () => void;
}

// Persisted to localStorage (not sessionStorage-only) so a signed-in user
// stays signed in across browser restarts/tabs, same as any normal site's
// "remember me" - fine here since this is a real deployed app, not a
// sandboxed preview.
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: "lessmarket-auth" }
  )
);
