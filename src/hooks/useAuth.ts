import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api-client';
import type { User as UserType, UserRole as UserRoleType } from '@shared/types';
export type User = Omit<UserType, 'passwordHash'>;
export type UserRole = UserRoleType;
interface AuthState {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  _hydrated: boolean;
}
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      _hydrated: false,
      login: async (email, password) => {
        const response = await api<any>('/api/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        if (response.status === 'pending') {
          window.location.href = '/pending-approval';
          return;
        }
        if (response.token && response.id) {
          set({ user: response, token: response.token });
          // Redirect after state update
          setTimeout(() => {
            const user = get().user;
            if (user) {
              switch (user.role) {
                case 'student':
                  window.location.href = '/student/dashboard';
                  break;
                case 'manager':
                  window.location.href = '/manager/dashboard';
                  break;
                case 'admin':
                  window.location.href = '/admin/dashboard';
                  break;
                default:
                  window.location.href = '/';
              }
            }
          }, 0);
        } else {
          throw new Error('Login failed: Invalid response from server.');
        }
      },
      logout: () => {
        set({ user: null, token: null });
        window.location.href = '/';
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state) state._hydrated = true;
      },
    }
  )
);
// This logic was flawed. It was redirecting managers to /student because the path check was too generic.
// The redirection logic is now handled correctly inside the login function and by ProtectedRoute.
// We only need to handle the case where a logged-out user tries to access a protected page.
useAuthStore.subscribe((state, prevState) => {
  if (state._hydrated && !prevState._hydrated) {
    const { token } = state;
    const path = window.location.pathname;
    const publicPaths = ['/', '/register', '/pending-approval', '/guest-payment'];
    if (!token && !publicPaths.includes(path)) {
      window.location.href = '/';
    }
  }
});
export const useAuth = useAuthStore;