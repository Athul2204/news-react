import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { clearToken, getToken, setToken } from '../lib/token';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

/* Holds the signed-in user. status: 'loading' (checking a saved token) | 'authed' | 'anon' */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(getToken() ? 'loading' : 'anon');

  useEffect(() => {
    if (!getToken()) return undefined;
    let alive = true;
    api.get('/me')
      .then((u) => { if (alive) { setUser(u); setStatus('authed'); } })
      .catch(() => { if (alive) { setUser(null); setStatus('anon'); } });
    return () => { alive = false; };
  }, []);

  /* Any API call that comes back 401 signs the reader out everywhere in the app */
  useEffect(() => {
    const onExpired = () => { setUser(null); setStatus('anon'); };
    window.addEventListener('daybreak:unauthorized', onExpired);
    return () => window.removeEventListener('daybreak:unauthorized', onExpired);
  }, []);

  const finish = useCallback((data, remember) => {
    setToken(data.token, remember);
    setUser(data.user);
    setStatus('authed');
    return data.user;
  }, []);

  const login = useCallback(async ({ email, password, remember }) =>
    finish(await api.post('/auth/login', { email, password, remember }, { auth: false }), remember), [finish]);

  const signup = useCallback(async (payload) =>
    finish(await api.post('/auth/signup', payload, { auth: false }), !!payload.remember), [finish]);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* token already invalid: fine */ }
    clearToken();
    setUser(null);
    setStatus('anon');
  }, []);

  const value = useMemo(() => ({ user, status, login, signup, logout, setUser }),
    [user, status, login, signup, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const Loading = () => <p className="app-loading" role="status">Loading…</p>;

/* Wrap routes that need a signed-in reader */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Loading />;
  if (status === 'anon') return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}

/* Login / signup: signed-in readers go straight to the dashboard */
export function GuestOnly() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <Loading />;
  if (status === 'authed') return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;
  return <Outlet />;
}
