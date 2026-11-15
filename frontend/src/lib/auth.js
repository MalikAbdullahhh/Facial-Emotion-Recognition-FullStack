import api from '../utils/api';

export const getUser = () => {
  try {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    return u && (u.id || u._id) ? u : null;
  } catch (e) {
    return null;
  }
};

export const setSession = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new Event('fer:auth'));
};

export const updateStoredUser = (patch) => {
  const u = { ...(getUser() || {}), ...patch };
  localStorage.setItem('user', JSON.stringify(u));
  window.dispatchEvent(new Event('fer:auth'));
  return u;
};

export const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('fer:auth'));
};

export const signOut = async () => {
  try { await api.post('/auth/logout'); } catch (e) { /* token may already be invalid */ }
  clearSession();
};

export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || 'U';

export const apiError = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || err?.response?.data?.errors?.[0]?.msg || (err?.message === 'Network Error' ? 'Can’t reach the server. Check your connection.' : fallback);
