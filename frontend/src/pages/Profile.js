import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiCheck, FiEdit2, FiLogOut, FiMonitor, FiMoon, FiRefreshCw, FiSun } from 'react-icons/fi';
import api from '../utils/api';
import { apiError, initials, signOut, updateStoredUser } from '../lib/auth';
import { useDocTitle } from '../lib/hooks';
import { useTheme } from '../context/ThemeContext';
import { PageHeader } from '../components/layout';
import { EASE, Segmented } from '../components/ui';
import './Dashboard.css';
import './Profile.css';

const device = (ua = '') => {
  const b = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : ua ? 'Browser' : 'Unknown';
  const o = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : '';
  return o ? `${b} on ${o}` : b;
};
const fmtDur = (s) => { if (!s && s !== 0) return '—'; const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h ? `${h}h ${m}m` : m ? `${m}m ${s % 60}s` : `${s}s`; };

export default function Profile() {
  useDocTitle('Account');
  const navigate = useNavigate();
  const { preference, setPreference } = useTheme();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState({ type: '', text: '' });

  const load = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await api.get('/users/profile');
      setUser(data.user);
      setForm({ name: data.user.name, email: data.user.email });
    } catch (e) { setError('Your account details couldn’t be loaded.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true); setNotice({ type: '', text: '' });
    try {
      const { data } = await api.put('/users/profile', { name: form.name.trim(), email: form.email.trim() });
      setUser((u) => ({ ...u, ...data.user }));
      updateStoredUser({ name: data.user.name, email: data.user.email });
      setEditing(false);
      setNotice({ type: 'ok', text: 'Profile updated.' });
    } catch (err) { setNotice({ type: 'error', text: apiError(err) }); }
    finally { setSaving(false); }
  };

  const out = async () => { await signOut(); navigate('/', { replace: true }); };

  if (loading) {
    return (
      <div>
        <PageHeader title="Account" />
        <div className="acct-grid"><div className="skeleton" style={{ height: 220, borderRadius: 24 }} /><div className="skeleton" style={{ height: 220, borderRadius: 24 }} /></div>
      </div>
    );
  }
  if (error || !user) {
    return (
      <div>
        <PageHeader title="Account" />
        <div className="alert alert-error"><FiAlertCircle /><span style={{ flex: 1 }}>{error}</span><button type="button" className="btn btn-outline btn-sm" onClick={load}><FiRefreshCw />Retry</button></div>
      </div>
    );
  }

  const history = (user.loginHistory || []).slice().reverse().slice(0, 10);

  return (
    <div>
      <PageHeader title="Account" description="Your profile, preferences and sign-in activity." />

      <div className="acct-grid">
        <section className="card card-pad">
          <div className="acct-id">
            <span className="avatar avatar-lg">{initials(user.name)}</span>
            <div className="acct-id__text">
              <h2>{user.name}</h2>
              <p className="muted">{user.email}</p>
              <div className="acct-id__badges">
                <span className={`badge ${user.role === 'admin' ? 'badge-signal' : ''}`}>{user.role === 'admin' ? 'Administrator' : 'Member'}</span>
                <span className="badge">Since {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
            {!editing && <button type="button" className="btn btn-outline btn-sm acct-id__edit" onClick={() => { setEditing(true); setNotice({ type: '', text: '' }); }}><FiEdit2 />Edit</button>}
          </div>

          <AnimatePresence initial={false}>
            {editing && (
              <motion.form onSubmit={save} className="acct-form" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                <div className="acct-form__in">
                  <div className="field"><label htmlFor="p-name">Full name</label><input id="p-name" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                  <div className="field"><label htmlFor="p-email">Email</label><input id="p-email" type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                  <div className="acct-form__btns">
                    <button type="button" className="btn btn-ghost" onClick={() => { setEditing(false); setForm({ name: user.name, email: user.email }); }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <><span className="spinner" />Saving…</> : 'Save changes'}</button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
          {notice.text && <div className={`alert ${notice.type === 'ok' ? 'alert-ok' : 'alert-error'}`} style={{ marginTop: 16 }}>{notice.type === 'ok' ? <FiCheck /> : <FiAlertCircle />}{notice.text}</div>}

          <div className="acct-rows">
            <div className="acct-row">
              <div><strong>Appearance</strong><span>Match your device or pick a theme.</span></div>
              <Segmented id="appearance" value={preference} onChange={setPreference} options={[{ value: 'system', label: 'Auto', icon: <FiMonitor /> }, { value: 'light', label: 'Light', icon: <FiSun /> }, { value: 'dark', label: 'Dark', icon: <FiMoon /> }]} />
            </div>
            <div className="acct-row">
              <div><strong>Sign out</strong><span>End your session on this device.</span></div>
              <button type="button" className="btn btn-outline" onClick={out}><FiLogOut />Sign out</button>
            </div>
          </div>
        </section>

        <section className="card kpis kpis--acct">
          <div className="stat kpi"><span className="stat-label">Time in FER</span><span className="stat-value num">{fmtDur(user.totalTimeOnSite)}</span></div>
          <div className="stat kpi"><span className="stat-label">Sign-ins</span><span className="stat-value num">{user.loginCount || 0}</span></div>
          <div className="stat kpi"><span className="stat-label">Last sign-in</span><span className="stat-value acct-small">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</span><span className="stat-sub">{user.lastLogin ? new Date(user.lastLogin).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Not recorded yet'}</span></div>
          <div className="stat kpi"><span className="stat-label">Status</span><span className="stat-value acct-small" style={{ color: user.isOnline ? 'var(--ok)' : 'var(--muted)' }}>{user.isOnline ? 'Online' : 'Offline'}</span><span className="stat-sub">{user.isOnline ? `this session ${user.currentSessionTimeFormatted}` : 'no active session'}</span></div>
        </section>
      </div>

      <section className="card card-pad" style={{ marginTop: 20 }}>
        <div className="card-head"><div><h3>Recent sign-ins</h3><p>The last ten times your account was used.</p></div></div>
        {history.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Date</th><th>Device</th><th>Duration</th></tr></thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h._id || i}>
                    <td><strong>{new Date(h.loginTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</strong> <span className="faint">{new Date(h.loginTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></td>
                    <td>{device(h.userAgent)}</td>
                    <td className="num">{h.logoutTime ? fmtDur(h.sessionDuration) : i === 0 && user.isOnline ? <span className="badge badge-ok"><span className="dot dot-live" />Active</span> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="muted">No sign-ins recorded yet. They’ll appear here next time you sign in.</p>}
      </section>
    </div>
  );
}
