import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { tokenStorage } from '../api/client';
import { login as loginRequest, logout as logoutRequest } from '../services/authService';

interface AuthUser {
  username: string;
  email: string;
  roles: string[];
  tenantId: number | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  tenantId: number | null;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasAnyRole: (...roles: string[]) => boolean;
}

const USER_KEY = 'fm.user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Reads the "TenantId" claim from a JWT without verifying the signature.
function tenantIdFromToken(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const raw = json.TenantId ?? json.tenantId;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function readStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    tokenStorage.get() ? readStoredUser() : null
  );

  const signIn = useCallback(async (username: string, password: string) => {
    const res = await loginRequest(username, password);
    tokenStorage.set(res.token, res.refreshToken);
    const authUser: AuthUser = {
      username: res.username,
      email: res.email,
      roles: res.roles ?? [],
      tenantId: tenantIdFromToken(res.token)
    };
    localStorage.setItem(USER_KEY, JSON.stringify(authUser));
    setUser(authUser);
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      tokenStorage.clear();
      localStorage.removeItem(USER_KEY);
      setUser(null);
    }
  }, []);

  const hasAnyRole = useCallback(
    (...roles: string[]) => {
      if (!user) return false;
      if (roles.length === 0) return true;
      return roles.some((r) => user.roles.includes(r));
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      tenantId: user?.tenantId ?? null,
      signIn,
      signOut,
      hasAnyRole
    }),
    [user, signIn, signOut, hasAnyRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

// Role groupings used for UI gating.
export const MANAGER_ROLES = ['SystemAdmin', 'TenantAdmin', 'FleetManager', 'Manager'];
export const EDITOR_ROLES = [...MANAGER_ROLES, 'Technician', 'Mechanic', 'Staff'];
