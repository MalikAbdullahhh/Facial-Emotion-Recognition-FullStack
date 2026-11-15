import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiAlertCircle, FiArrowLeft, FiArrowRight } from 'react-icons/fi';
import api from '../utils/api';
import { apiError, setSession } from '../lib/auth';
import { useDocTitle } from '../lib/hooks';
import AuthLayout, { PasswordInput } from './auth/AuthLayout';

export default function AdminLogin() {
  useDocTitle('Administrator sign-in');
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/admin/login', form);
      setSession(data.token, data.user);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err?.response?.status === 401 ? 'These credentials don’t belong to an administrator account.' : apiError(err));
      setLoading(false);
    }
  };

  return (
    <AuthLayout heading="Administrator sign-in" sub="Restricted to FER administrators." panelTitle="Oversee every" panelText="Manage accounts, review messages and see how people use FER — without ever seeing their camera.">
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Admin email</label>
          <input id="email" type="email" className="input" required autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
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
      <div className="auth-meta"><Link to="/login"><FiArrowLeft />Back to regular sign-in</Link></div>
    </AuthLayout>
  );
}
