import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import api from '../utils/api';
import { apiError, setSession } from '../lib/auth';
import { useDocTitle } from '../lib/hooks';
import AuthLayout, { PasswordInput } from './auth/AuthLayout';

const strengthOf = (p) => {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 12) s++;
  return p ? Math.max(1, s) : 0;
};
const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = ['', 'var(--danger)', 'var(--warn)', 'var(--ok)', 'var(--ok)'];

export default function Signup() {
  useDocTitle('Create account');
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const strength = useMemo(() => strengthOf(form.password), [form.password]);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Use at least 6 characters for your password.');
    if (form.password !== form.confirm) return setError('The two passwords don’t match.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name: form.name.trim(), email: form.email.trim(), password: form.password });
      setSession(data.token, data.user);
      navigate('/dashboard?welcome=1', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message === 'User already exists' ? 'An account with this email already exists. Try signing in instead.' : apiError(err));
      setLoading(false);
    }
    return undefined;
  };

  return (
    <AuthLayout panelTitle="Your expressions, charted over time." panelText="Save live sessions and photo analyses, compare them side by side and export clean reports.">
      <h1>Create your account</h1>
      <p className="auth-sub">Free forever. Takes about 20 seconds.</p>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" className="input" required autoComplete="name" autoFocus value={form.name} onChange={set('name')} placeholder="Ayesha Khan" />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className="input" required autoComplete="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput id="password" required minLength={6} autoComplete="new-password" value={form.password} onChange={set('password')} aria-describedby="pw-strength" />
          <div className="strength" aria-hidden="true">
            {[1, 2, 3, 4].map((n) => <span key={n} style={{ background: n <= strength ? COLORS[strength] : undefined }} />)}
          </div>
          <span id="pw-strength" className="strength-label">{strength ? `${LABELS[strength]} password` : 'At least 6 characters'}</span>
        </div>
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <PasswordInput id="confirm" required autoComplete="new-password" value={form.confirm} onChange={set('confirm')} aria-invalid={form.confirm && form.confirm !== form.password ? 'true' : undefined} />
        </div>
        {error && <div className="alert alert-error" role="alert"><FiAlertCircle />{error}</div>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <><span className="spinner" />Creating account…</> : <>Create account <FiArrowRight /></>}
        </button>
      </form>
      <p className="auth-alt">Already have an account? <Link to="/login" className="link">Sign in</Link></p>
    </AuthLayout>
  );
}
