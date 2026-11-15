import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiCheck, FiCopy, FiEdit2, FiEye, FiInbox, FiMail, FiPlus, FiRefreshCw, FiSearch, FiTrash2, FiUsers } from 'react-icons/fi';
import api from '../utils/api';
import { apiError, initials } from '../lib/auth';
import { emotionMeta, toKey } from '../lib/emotions';
import { useDocTitle, useUser } from '../lib/hooks';
import { PageHeader } from '../components/layout';
import { Drawer, EASE, EmotionBars, Modal, Spectrum } from '../components/ui';
import { CountUp } from '../components/fx';
import './Dashboard.css';
import './Admin.css';

const TABS = { overview: 'Admin overview', users: 'Users', messages: 'Messages', subscribers: 'Subscribers' };
const when = (d) => (d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—');
const fmtDur = (s = 0) => { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h ? `${h}h ${m}m` : `${m}m`; };

/* ── User detail drawer ─────────────────────────────────── */
function UserDetail({ user }) {
  const [emo, setEmo] = useState(null);
  const [imgs, setImgs] = useState(null);
  useEffect(() => {
    let alive = true;
    api.get(`/admin/users/${user.id}/emotions?period=hour`).then(({ data }) => alive && setEmo(data.overall)).catch(() => alive && setEmo({ totalRecords: 0, emotionCounts: {} }));
    api.get(`/admin/users/${user.id}/image-analyses?limit=8`).then(({ data }) => alive && setImgs(data)).catch(() => alive && setImgs({ analyses: [], total: 0 }));
    return () => { alive = false; };
  }, [user.id]);
  const counts = useMemo(() => {
    const c = {};
    Object.entries(emo?.emotionCounts || {}).forEach(([k, v]) => { const key = toKey(k); c[key] = (c[key] || 0) + v; });
    return c;
  }, [emo]);
  const total = emo?.totalRecords || 0;
  return (
    <>
      <div className="acct-head">
        <span className="avatar avatar-lg">{initials(user.name)}</span>
        <div>
          <h3>{user.name}</h3>
          <p className="muted">{user.email}</p>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <span className={`badge ${user.role === 'admin' ? 'badge-signal' : ''}`}>{user.role === 'admin' ? 'Admin' : 'Member'}</span>
            {user.isOnline ? <span className="badge badge-ok"><span className="dot dot-live" />Online</span> : <span className="badge">Offline</span>}
          </div>
        </div>
      </div>
      <dl className="kv">
        <div><dt>Joined</dt><dd>{when(user.createdAt)}</dd></div>
        <div><dt>Last sign-in</dt><dd>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}</dd></div>
        <div><dt>Sign-ins</dt><dd className="num">{user.loginCount}</dd></div>
        <div><dt>Time in FER</dt><dd className="num">{fmtDur(user.totalTimeOnSite)}</dd></div>
      </dl>
      <section className="card card-pad">
        <div className="card-head"><div><h3>Live readings · last 24 h</h3><p>{emo ? `${total} readings` : <span className="skeleton" style={{ display: 'inline-block', width: 90, height: 12 }} />}</p></div></div>
        {emo && total > 0 ? (
          <><Spectrum counts={counts} height={10} /><div style={{ marginTop: 16 }}><EmotionBars scores={Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, v / total]))} /></div></>
        ) : emo ? <p className="muted">No live readings in the last 24 hours.</p> : <div className="skeleton" style={{ height: 80 }} />}
      </section>
      <section className="card card-pad">
        <div className="card-head"><div><h3>Photo analyses</h3><p>{imgs ? `${imgs.total} in total` : <span className="skeleton" style={{ display: 'inline-block', width: 70, height: 12 }} />}</p></div></div>
        {imgs?.analyses?.length ? (
          <div className="thumbs">
            {imgs.analyses.slice(0, 8).map((a) => (
              <div key={a._id} className="thumb" style={{ '--c': emotionMeta(a.emotion).color }}>
                <img src={a.imageUrl} alt="" loading="lazy" />
                <span>{emotionMeta(a.emotion).label} <b className="num">{Math.round(a.confidence * 100)}%</b></span>
              </div>
            ))}
          </div>
        ) : imgs ? <p className="muted">No photo analyses yet.</p> : <div className="skeleton" style={{ height: 80 }} />}
      </section>
      {user.loginHistory?.length > 0 && (
        <section>
          <h3 className="drawer-sub">Recent sign-ins</h3>
          <ul className="mini-list">
            {user.loginHistory.slice().reverse().slice(0, 6).map((h, i) => (
              <li key={h._id || i}><span>{new Date(h.loginTime).toLocaleString()}</span><span className="num faint">{h.sessionDuration ? fmtDur(h.sessionDuration) : i === 0 && user.isOnline ? 'active' : '—'}</span></li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

export default function AdminDashboard() {
  const me = useUser();
  const [params, setParams] = useSearchParams();
  const tab = TABS[params.get('tab')] ? params.get('tab') : 'overview';
  useDocTitle(TABS[tab]);
  const [d, setD] = useState({ loading: true, stats: null, users: [], contacts: [], newsletters: [], error: '' });
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [view, setView] = useState(null);
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const [create, setCreate] = useState(false);
  const [openMsg, setOpenMsg] = useState(null);
  const [toast, setToast] = useState('');

  const load = useCallback(async () => {
    setD((x) => ({ ...x, loading: true, error: '' }));
    try {
      const [, s, u, c, n] = await Promise.all([api.get('/admin/check-online').catch(() => null), api.get('/admin/stats'), api.get('/admin/users'), api.get('/admin/contacts'), api.get('/admin/newsletters')]);
      setD({ loading: false, stats: s.data.stats, users: u.data.users || [], contacts: c.data.contacts || [], newsletters: n.data.newsletters || [], error: '' });
    } catch (e) {
      setD((x) => ({ ...x, loading: false, error: apiError(e, 'Admin data couldn’t be loaded.') }));
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!toast) return undefined; const t = setTimeout(() => setToast(''), 2800); return () => clearTimeout(t); }, [toast]);

  const users = useMemo(() => d.users.filter((u) => (role === 'all' || u.role === role) && (!q || `${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))), [d.users, q, role]);
  const unread = d.contacts.filter((c) => !c.read).length;
  const s = d.stats || {};

  const markRead = async (c) => {
    try {
      await api.put(`/admin/contacts/${c._id}/read`);
      setD((x) => ({ ...x, contacts: x.contacts.map((m) => (m._id === c._id ? { ...m, read: true } : m)) }));
    } catch (e) { setToast('Couldn’t update the message.'); }
  };

  const go = (t) => setParams(t === 'overview' ? {} : { tab: t });

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title={TABS[tab]}
        description={{ overview: 'Accounts, activity and inbound messages across FER.', users: 'Create accounts, change roles, reset passwords and review activity.', messages: 'Messages sent through the contact form.', subscribers: 'People who asked for product updates.' }[tab]}
        actions={(
          <>
            <button type="button" className="btn btn-outline" onClick={load} disabled={d.loading}><FiRefreshCw className={d.loading ? 'spin' : ''} />Refresh</button>
            {tab === 'users' && <button type="button" className="btn btn-primary" onClick={() => setCreate(true)}><FiPlus />New user</button>}
          </>
        )}
      />

      <nav className="admin-tabs" aria-label="Admin sections">
        {Object.entries(TABS).map(([k, label]) => (
          <button key={k} type="button" className={tab === k ? 'is-active' : ''} onClick={() => go(k)}>
            {k === 'overview' ? 'Overview' : label}
            {k === 'messages' && unread > 0 && <span className="admin-count">{unread}</span>}
            {tab === k && <motion.span layoutId="admin-tab" className="admin-tabs__bar" transition={{ duration: 0.35, ease: EASE }} />}
          </button>
        ))}
      </nav>

      {d.error && <div className="alert alert-error" style={{ marginBottom: 16 }}><FiAlertCircle /><span style={{ flex: 1 }}>{d.error}</span><button type="button" className="btn btn-outline btn-sm" onClick={load}>Retry</button></div>}

      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE }}>
          {tab === 'overview' && (
            <>
              <section className="card kpis">
                {[
                  ['Members', s.totalUsers, `${s.totalAdmins ?? 0} admins`],
                  ['Online now', s.onlineUsers, `${s.recentLogins ?? 0} signed in today`],
                  ['Messages', s.totalContacts, `${unread} unread`],
                  ['Subscribers', s.totalNewsletters, 'product updates'],
                ].map(([l, v, sub]) => (
                  <div key={l} className="stat kpi"><span className="stat-label">{l}</span>{d.loading && !d.stats ? <span className="skeleton" style={{ height: 34, width: 60 }} /> : <span className="stat-value num"><CountUp to={v ?? 0} duration={1.1} /></span>}<span className="stat-sub">{d.loading && !d.stats ? <span className="skeleton" style={{ display: 'inline-block', height: 10, width: 90 }} /> : sub}</span></div>
                ))}
              </section>
              <div className="dash-row dash-row--even">
                <section className="card card-pad">
                  <div className="card-head"><div><h3>Newest members</h3><p>Average time in FER: {s.avgTimePerUserFormatted || '0s'}</p></div><button type="button" className="btn btn-ghost btn-sm" onClick={() => go('users')}>All users</button></div>
                  <ul className="people">
                    {d.users.slice(0, 6).map((u) => (
                      <li key={u.id}>
                        <button type="button" onClick={() => setView(u)}>
                          <span className="avatar">{initials(u.name)}</span>
                          <span className="people__meta"><strong>{u.name}</strong><span className="faint">{u.email}</span></span>
                          <span className="faint people__date">{when(u.createdAt)}</span>
                        </button>
                      </li>
                    ))}
                    {d.loading && !d.users.length && Array.from({ length: 4 }).map((_, i) => <li key={i} style={{ padding: '10px 0' }}><span className="skeleton" style={{ display: 'block', height: 40 }} /></li>)}
                    {!d.users.length && !d.loading && <li className="muted">No users yet.</li>}
                  </ul>
                </section>
                <section className="card card-pad">
                  <div className="card-head"><div><h3>Latest messages</h3><p>{unread ? `${unread} waiting for a reply` : 'Inbox zero'}</p></div><button type="button" className="btn btn-ghost btn-sm" onClick={() => go('messages')}>Inbox</button></div>
                  <ul className="people">
                    {d.contacts.slice(0, 5).map((c) => (
                      <li key={c._id}>
                        <button type="button" onClick={() => { go('messages'); setOpenMsg(c._id); }}>
                          <span className={`msg-dot ${c.read ? '' : 'is-unread'}`} />
                          <span className="people__meta"><strong>{c.subject}</strong><span className="faint">{c.name} · {c.message.slice(0, 60)}</span></span>
                          <span className="faint people__date">{when(c.createdAt)}</span>
                        </button>
                      </li>
                    ))}
                    {d.loading && !d.contacts.length && Array.from({ length: 3 }).map((_, i) => <li key={i} style={{ padding: '10px 0' }}><span className="skeleton" style={{ display: 'block', height: 40 }} /></li>)}
                    {!d.contacts.length && !d.loading && <li className="muted">No messages yet.</li>}
                  </ul>
                </section>
              </div>
            </>
          )}

          {tab === 'users' && (
            <section className="card">
              <div className="table-tools">
                <label className="search"><FiSearch /><input className="input" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" /></label>
                <select className="input" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role" style={{ width: 'auto' }}>
                  <option value="all">All roles</option><option value="user">Members</option><option value="admin">Admins</option>
                </select>
              </div>
              <div className="table-wrap table-wrap--flush">
                <table className="table">
                  <thead><tr><th>User</th><th>Role</th><th>Status</th><th>Sign-ins</th><th>Joined</th><th aria-label="Actions" /></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td><button type="button" className="user-cell" onClick={() => setView(u)}><span className="avatar">{initials(u.name)}</span><span><strong>{u.name}{u.id === me?.id && <span className="you-tag">You</span>}</strong><small>{u.email}</small></span></button></td>
                        <td><span className={`badge ${u.role === 'admin' ? 'badge-signal' : ''}`}>{u.role === 'admin' ? 'Admin' : 'Member'}</span></td>
                        <td>{u.isOnline ? <span className="badge badge-ok"><span className="dot" />Online</span> : <span className="faint">{u.lastLogin ? `Seen ${when(u.lastLogin)}` : 'Never signed in'}</span>}</td>
                        <td className="num">{u.loginCount}</td>
                        <td className="faint">{when(u.createdAt)}</td>
                        <td>
                          <div className="row-actions">
                            <button type="button" className="icon-btn" title="View" aria-label={`View ${u.name}`} onClick={() => setView(u)}><FiEye /></button>
                            <button type="button" className="icon-btn" title="Edit" aria-label={`Edit ${u.name}`} onClick={() => setEdit(u)}><FiEdit2 /></button>
                            <button type="button" className="icon-btn icon-btn--danger" title="Delete" aria-label={`Delete ${u.name}`} disabled={u.id === me?.id} onClick={() => setDel(u)}><FiTrash2 /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!users.length && <div className="empty"><span className="empty-icon"><FiUsers /></span><h3>No users match</h3><p>Try a different search or role filter.</p></div>}
              </div>
            </section>
          )}

          {tab === 'messages' && (
            d.contacts.length ? (
              <section className="card inbox">
                {d.contacts.map((c) => {
                  const isOpen = openMsg === c._id;
                  return (
                    <article key={c._id} className={`msg ${isOpen ? 'is-open' : ''} ${c.read ? '' : 'is-unread'}`}>
                      <button type="button" className="msg__head" onClick={() => { setOpenMsg(isOpen ? null : c._id); if (!c.read) markRead(c); }} aria-expanded={isOpen}>
                        <span className={`msg-dot ${c.read ? '' : 'is-unread'}`} />
                        <span className="msg__from"><strong>{c.name}</strong><span className="faint">{c.email}</span></span>
                        <span className="msg__subject"><strong>{c.subject}</strong><span className="faint">{c.message}</span></span>
                        <span className="faint msg__date">{when(c.createdAt)}</span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} style={{ overflow: 'hidden' }}>
                            <div className="msg__body">
                              <p>{c.message}</p>
                              <div className="msg__actions">
                                <a className="btn btn-primary btn-sm" href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject}`)}`}><FiMail />Reply by email</a>
                                <span className="faint">{new Date(c.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </article>
                  );
                })}
              </section>
            ) : <section className="card"><div className="empty"><span className="empty-icon"><FiInbox /></span><h3>No messages yet</h3><p>Messages from the contact page will land here.</p></div></section>
          )}

          {tab === 'subscribers' && (
            <section className="card">
              <div className="table-tools">
                <p className="muted" style={{ flex: 1 }}>{d.newsletters.length} subscribers</p>
                <button type="button" className="btn btn-outline btn-sm" disabled={!d.newsletters.length} onClick={() => { navigator.clipboard?.writeText(d.newsletters.map((n) => n.email).join(', ')); setToast('Emails copied to clipboard'); }}><FiCopy />Copy all emails</button>
              </div>
              {d.newsletters.length ? (
                <div className="table-wrap table-wrap--flush">
                  <table className="table">
                    <thead><tr><th>Email</th><th>Subscribed</th></tr></thead>
                    <tbody>{d.newsletters.map((n) => <tr key={n._id}><td><strong>{n.email}</strong></td><td className="faint">{when(n.subscribedAt)}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : <div className="empty"><span className="empty-icon"><FiMail /></span><h3>No subscribers yet</h3><p>People who sign up for updates in the footer appear here.</p></div>}
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      <Drawer open={!!view} onClose={() => setView(null)} title="User details">
        {view && <UserDetail user={view} />}
      </Drawer>

      <EditUser user={edit} me={me} onClose={() => setEdit(null)} onSaved={(msg) => { setEdit(null); setToast(msg); load(); }} />
      <CreateUser open={create} onClose={() => setCreate(false)} onSaved={() => { setCreate(false); setToast('User created'); load(); }} />

      <Modal open={!!del} onClose={() => setDel(null)} title={`Delete ${del?.name}?`}>
        <DeleteUser user={del} onClose={() => setDel(null)} onDone={() => { setDel(null); setToast('User deleted'); load(); }} />
      </Modal>

      <AnimatePresence>
        {toast && (
          <motion.div className="toast" role="status" initial={{ opacity: 0, y: 16, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 16, x: '-50%' }}>
            <FiCheck />{toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CreateUser({ open, onClose, onSaved }) {
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'user' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setF({ name: '', email: '', password: '', role: 'user' }); setErr(''); } }, [open]);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { await api.post('/admin/users', f); onSaved(); } catch (x) { setErr(apiError(x)); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="New user">
      <p className="muted">They can sign in straight away with these details.</p>
      <form onSubmit={submit} className="modal-form">
        <div className="field"><label htmlFor="nu-name">Full name</label><input id="nu-name" className="input" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label htmlFor="nu-email">Email</label><input id="nu-email" type="email" className="input" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div className="field"><label htmlFor="nu-pw">Temporary password</label><input id="nu-pw" className="input" required minLength={6} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" /></div>
        <div className="field"><label htmlFor="nu-role">Role</label><select id="nu-role" className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}><option value="user">Member</option><option value="admin">Admin</option></select></div>
        {err && <div className="alert alert-error"><FiAlertCircle />{err}</div>}
        <div className="modal-btns"><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy}>{busy ? <><span className="spinner" />Creating…</> : 'Create user'}</button></div>
      </form>
    </Modal>
  );
}

function EditUser({ user, me, onClose, onSaved }) {
  const [role, setRole] = useState('user');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (user) { setRole(user.role); setPw(''); setErr(''); } }, [user]);
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      if (role !== user.role) await api.put(`/admin/users/${user.id}/role`, { role });
      if (pw) await api.put(`/admin/users/${user.id}/password`, { password: pw });
      onSaved(pw ? 'User updated and password reset' : 'User updated');
    } catch (x) { setErr(apiError(x)); } finally { setBusy(false); }
  };
  return (
    <Modal open={!!user} onClose={onClose} title={user ? `Edit ${user.name}` : ''}>
      <p className="muted">{user?.email}</p>
      <form onSubmit={submit} className="modal-form">
        <div className="field"><label htmlFor="eu-role">Role</label><select id="eu-role" className="input" value={role} onChange={(e) => setRole(e.target.value)} disabled={user?.id === me?.id}><option value="user">Member</option><option value="admin">Admin</option></select>{user?.id === me?.id && <span className="hint">You can’t change your own role.</span>}</div>
        <div className="field"><label htmlFor="eu-pw">Reset password</label><input id="eu-pw" className="input" minLength={6} placeholder="Leave blank to keep the current one" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></div>
        {err && <div className="alert alert-error"><FiAlertCircle />{err}</div>}
        <div className="modal-btns"><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary" disabled={busy || (role === user?.role && !pw)}>{busy ? <><span className="spinner" />Saving…</> : 'Save changes'}</button></div>
      </form>
    </Modal>
  );
}

function DeleteUser({ user, onClose, onDone }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const go = async () => {
    setBusy(true); setErr('');
    try { await api.delete(`/admin/users/${user.id}`); onDone(); } catch (x) { setErr(apiError(x)); setBusy(false); }
  };
  return (
    <>
      <p className="muted">This permanently removes <strong>{user?.email}</strong> along with all of their live readings and photo analyses.</p>
      {err && <div className="alert alert-error" style={{ marginTop: 14 }}><FiAlertCircle />{err}</div>}
      <div className="modal-btns" style={{ marginTop: 22 }}><button type="button" className="btn btn-outline" onClick={onClose} disabled={busy}>Cancel</button><button type="button" className="btn btn-danger" onClick={go} disabled={busy}>{busy ? <><span className="spinner" />Deleting…</> : <><FiTrash2 />Delete user</>}</button></div>
    </>
  );
}
