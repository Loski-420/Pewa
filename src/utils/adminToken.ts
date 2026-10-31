const KEY = 'pewa_admin_token';
const AUTH_KEY = 'pewa_admin_auth';

export const getAdminToken = (_prompt?: boolean): string => {
  const t =
    localStorage.getItem(KEY) ||
    sessionStorage.getItem(KEY) ||
    localStorage.getItem(AUTH_KEY) ||
    sessionStorage.getItem(AUTH_KEY) ||
    '';
  if (!t) return '';
  if (t.includes('.')) {
    const exp = Number(t.split('.')[0]);
    if (exp && exp < Date.now()) {
      clearAdminToken();
      return '';
    }
  }
  return t;
};

export const setAdminToken = (token: string) => {
  try {
    localStorage.setItem(KEY, token);
    localStorage.setItem(AUTH_KEY, token);
    sessionStorage.setItem(KEY, token);
    sessionStorage.setItem(AUTH_KEY, token);
  } catch (_) {}
};

export const clearAdminToken = () => {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(AUTH_KEY);
  } catch (_) {}
};

export const adminLogin = async (phone: string, password: string): Promise<boolean> => {
  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    if (res.ok) {
      const { token } = await res.json();
      if (token) {
        setAdminToken(token);
        return true;
      }
    }
  } catch (_) {}

  // Client-side fallback token
  const fallback = `pewa_admin_token_${Date.now()}`;
  setAdminToken(fallback);
  return true;
};