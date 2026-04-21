import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '@/types/database';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({ user: null, session: null, profile: null, loading: false }),
}));

interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        set({ theme });
      },
      toggleTheme: () => {
        const newTheme = get().theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        set({ theme: newTheme });
      },
    }),
    { name: 'collabos-theme' }
  )
);

interface NotificationState {
  unreadTrades: number;
  unreadActivity: number;
  incrementTrades: () => void;
  incrementActivity: () => void;
  clearTrades: () => void;
  clearActivity: () => void;
  setUnreadTrades: (n: number) => void;
  setUnreadActivity: (n: number) => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadTrades: 0,
  unreadActivity: 0,
  incrementTrades: () => set((s) => ({ unreadTrades: s.unreadTrades + 1 })),
  incrementActivity: () => set((s) => ({ unreadActivity: s.unreadActivity + 1 })),
  clearTrades: () => set({ unreadTrades: 0 }),
  clearActivity: () => set({ unreadActivity: 0 }),
  setUnreadTrades: (n) => set({ unreadTrades: n }),
  setUnreadActivity: (n) => set({ unreadActivity: n }),
}));
