import React, { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { FiAlertCircle, FiArrowRight, FiInfo, FiShield } from 'react-icons/fi';
import api from '../utils/api';
import { apiError, setSession } from '../lib/auth';
import { useDocTitle } from '../lib/hooks';
import { homeFor } from '../components/layout';
import AuthLayout, { PasswordInput } from './auth/AuthLayout';

export default function Login() {
  useDocTitle('Sign in');
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const next = location.state?.from || params.get('next');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      setSession(data.token, data.user);
      navigate(next && next !== '/login' ? next : homeFor(data.user), { replace: true });
    } catch (err) {
      setError(err?.response?.status === 401 ? 'That email and password don’t match. Check them and try again.' : apiError(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout heading="Welcome back" sub="Sign in to your FER account." panelTitle="Pick up every" panelText="Your sessions, photo analyses and reports are waiting right where you left them.">
      <form onSubmit={submit} noValidate={false}>
        {params.get('expired') && !error && <div className="alert alert-info"><FiInfo />Your session expired. Sign in again to continue.</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" className="input" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <PasswordInput id="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && <div className="alert alert-error" role="alert"><FiAlertCircle />{error}</div>}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <><span className="spinner" />Signing in…</> : <>Sign in <FiArrowRight /></>}
        </button>
      </form>
      <p className="auth-alt">New to FER? <Link to="/signup" className="link">Create a free account</Link></p>
      <div className="auth-meta"><Link to="/admin/login"><FiShield />Administrator sign-in</Link></div>
    </AuthLayout>
  );
}
