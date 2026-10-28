const KEY = 'pewa_admin_token';

export const getAdminToken = (_prompt?: boolean): string => {
  const t = localStorage.getItem(KEY) || '';
  const exp = Number(t.split('.')[0]);
  if (!t || !exp || exp < Date.now()) {
    localStorage.removeItem(KEY);
    return '';
  }
  return t;
};

export const clearAdminToken = () => localStorage.removeItem(KEY);

export const adminLogin = async (phone: string, password: string): Promise<boolean> => {
  try {
    const res = await fetch('/api/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
    });
    if (!res.ok) return false;
    const { token } = await res.json();
    localStorage.setItem(KEY, token);
    return true;
  } catch {
    return false;
  }
};