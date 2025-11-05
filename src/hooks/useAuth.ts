import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api-client';
import type { User as UserType, UserRole as UserRoleType } from '@shared/types';
import { toast } from 'sonner';
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
          toast.info("Registration pending", { description: "Your account is awaiting manager approval." });
          window.location.href = '/pending-approval';
          return;
        }
        if (response.token && response.id) {
          set({ user: response, token: response.token });
          setTimeout(() => {
            const user = get().user;
            if (user) {
              switch (user.role) {
                case 'student': window.location.href = '/student/dashboard'; break;
                case 'manager': window.location.href = '/manager/dashboard'; break;
                case 'admin': window.location.href = '/admin/dashboard'; break;
                default: window.location.href = '/';
              }
            }
          }, 0);
        } else {
          throw new Error('Login failed: Invalid response from server.');
        }
      },
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('auth-storage'); // Ensure clean logout
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
useAuthStore.subscribe((state, prevState) => {
  if (state._hydrated && !prevState._hydrated) {
    const { token } = state;
    const path = window.location.pathname;
    const publicPaths = ['/', '/register', '/pending-approval', '/guest-payment'];
    const isPublicPath = publicPaths.some(p => path === p) || path.startsWith('/verify/') || path.startsWith('/reset/');
    if (!token && !isPublicPath) {
      window.location.href = '/';
    }
  }
});
export const useAuth = useAuthStore;