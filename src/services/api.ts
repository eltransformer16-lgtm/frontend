const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  birthDate: string;
  role: 'Admin' | 'User' | string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  hasActiveRefreshToken?: boolean;
}

export interface AuthSession {
  accessToken: string;
  expiresInSeconds: number;
  refreshToken: string;
  user: UserProfile;
}

const SESSION_KEY = 'app_auth_session';

export function getSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
  } else {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  window.dispatchEvent(new Event('auth-changed'));
}

let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const current = getSession();
    if (!current?.refreshToken) return null;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      });

      if (!res.ok) {
        saveSession(null);
        return null;
      }

      const data = (await res.json()) as AuthSession;
      saveSession(data);
      return data.accessToken;
    } catch {
      saveSession(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const session = getSession();
  const headers = new Headers(init.headers || {});

  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && retry && session?.refreshToken) {
    const newAccess = await tryRefreshToken();
    if (newAccess) {
      return apiFetch(path, init, false);
    }
  }

  return response;
}

export async function parseError(res: Response): Promise<string> {
  try {
    const data = await res.json();
    return data?.message || data?.title || `Error ${res.status}`;
  } catch {
    return `Error HTTP ${res.status}`;
  }
}

export { API_BASE };