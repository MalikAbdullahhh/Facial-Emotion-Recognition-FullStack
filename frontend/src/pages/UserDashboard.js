import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { FiActivity, FiArrowRight, FiCamera, FiCheck, FiImage, FiRefreshCw, FiX } from 'react-icons/fi';
import api from '../utils/api';
import { EMOTIONS, emotionHex, emotionMeta, toKey } from '../lib/emotions';
import { useDocTitle, useUser } from '../lib/hooks';
import { useTheme } from '../context/ThemeContext';
import { PageHeader } from '../components/layout';
import { EASE, EmotionChip, Segmented, Spectrum } from '../components/ui';
import './Dashboard.css';

const RANGES = { day: 24 * 3600e3, week: 7 * 24 * 3600e3, all: Infinity };
const greeting = () => { const h = new Date().getHours(); return h < 5 ? 'Working late' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };
const ago = (d) => {
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};
const dur = (ms) => { const s = Math.round(ms / 1000); return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`; };

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p) => p.value > 0).sort((a, b) => b.value - a.value);
  const total = rows.reduce((a, b) => a + b.value, 0);
  return (
    <div className="chart-tip">
      <strong>{label}</strong>
      {rows.map((p) => (
        <span key={p.dataKey}><i style={{ background: p.fill }} />{emotionMeta(p.dataKey).label}<b className="num">{Math.round((p.value / total) * 100)}%</b></span>
      ))}
      <em className="num">{total} readings</em>
    </div>
  );
}

export default function UserDashboard() {
  useDocTitle('Overview');
  const user = useUser();
  const { theme } = useTheme();
  const [params, setParams] = useSearchParams();
  const [range, setRange] = useState('week');
  const [data, setData] = useState({ loading: true, records: [], photos: [], photoTotal: 0, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setData((d) => ({ ...d, loading: true, error: '' }));
    Promise.all([api.get('/emotions/recent?limit=3000'), api.get('/emotions/image-analyses?limit=8')])
      .then(([r, p]) => alive && setData({ loading: false, records: r.data.records || [], photos: p.data.analyses || [], photoTotal: p.data.total || 0, error: '' }))
      .catch(() => alive && setData((d) => ({ ...d, loading: false, error: 'We couldn’t load your data. Check your connection and try again.' })));
    return () => { alive = false; };
  }, [tick]);

  const view = useMemo(() => {
    const since = Date.now() - RANGES[range];
    const recs = data.records.filter((r) => new Date(r.timestamp).getTime() >= since);
    const counts = {};
    recs.forEach((r) => { const k = toKey(r.emotion); counts[k] = (counts[k] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];

    // Sessions
    const bySession = {};
    recs.forEach((r) => {
      const s = bySession[r.sessionId] || (bySession[r.sessionId] = { id: r.sessionId, first: r.timestamp, last: r.timestamp, counts: {}, n: 0 });
      const k = toKey(r.emotion);
      s.counts[k] = (s.counts[k] || 0) + 1; s.n++;
      if (r.timestamp < s.first) s.first = r.timestamp;
      if (r.timestamp > s.last) s.last = r.timestamp;
    });
    const sessions = Object.values(bySession).sort((a, b) => (a.last < b.last ? 1 : -1));

    // Chart buckets: hourly for 24h, daily otherwise
    const hourly = range === 'day';
    const buckets = new Map();
    if (hourly) {
      for (let i = 23; i >= 0; i--) { const d = new Date(Date.now() - i * 3600e3); d.setMinutes(0, 0, 0); buckets.set(d.getTime(), { label: d.toLocaleTimeString([], { hour: 'numeric' }) }); }
    } else {
      const days = range === 'week' ? 7 : Math.min(30, Math.max(7, Math.ceil((Date.now() - Math.min(...recs.map((r) => new Date(r.timestamp).getTime()), Date.now())) / 86400e3) + 1));
      for (let i = days - 1; i >= 0; i--) { const d = new Date(Date.now() - i * 86400e3); d.setHours(0, 0, 0, 0); buckets.set(d.getTime(), { label: d.toLocaleDateString([], { weekday: days <= 7 ? 'short' : undefined, month: days > 7 ? 'short' : undefined, day: days > 7 ? 'numeric' : undefined }) }); }
    }
    recs.forEach((r) => {
      const d = new Date(r.timestamp);
      if (hourly) d.setMinutes(0, 0, 0); else d.setHours(0, 0, 0, 0);
      const b = buckets.get(d.getTime());
      if (b) { const k = toKey(r.emotion); b[k] = (b[k] || 0) + 1; }
    });
    return { total: recs.length, counts, top, sessions, chart: [...buckets.values()] };
  }, [data.records, range]);

  const welcome = params.get('welcome');
  const firstRun = !data.loading && !data.records.length && !data.photoTotal;
  const steps = [
    { done: data.records.length > 0, label: 'Run a live session', to: '/emotion-detection' },
    { done: data.photoTotal > 0, label: 'Analyse a photo', to: '/emotion-detection?mode=photo' },
    { done: data.photoTotal > 0 && data.records.length > 0, label: 'Review your history', to: '/image-analyses' },
  ];
  const firstName = (user?.name || '').split(' ')[0];

  return (
    <div>
      <PageHeader
        eyebrow={greeting()}
        title={firstName ? `${firstName}’s overview` : 'Overview'}
        description="Your expression readings, sessions and photo analyses at a glance."
        actions={(
          <>
            <Link to="/emotion-detection?mode=photo" className="btn btn-outline"><FiImage /> Analyse photos</Link>
            <Link to="/emotion-detection" className="btn btn-primary"><FiCamera /> Start live session</Link>
          </>
        )}
      />

      {(welcome || firstRun) && (
        <motion.section className="card card-pad onboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}>
          <div>
            <h2>{welcome ? 'Welcome to FER 👋' : 'Let’s get your first reading'}</h2>
            <p className="muted">Three quick steps to see what FER can do. Your camera stays on this device the whole time.</p>
          </div>
          <ol className="onboard__steps">
            {steps.map((s, i) => (
              <li key={s.label}>
                <Link to={s.to} className={`onboard__step ${s.done ? 'is-done' : ''}`}>
                  <span className="onboard__check">{s.done ? <FiCheck /> : i + 1}</span>
                  {s.label}
                  <FiArrowRight className="onboard__go" />
                </Link>
              </li>
            ))}
          </ol>
          {welcome && <button type="button" className="icon-btn onboard__close" aria-label="Dismiss" onClick={() => setParams({}, { replace: true })}><FiX /></button>}
        </motion.section>
      )}

      {data.error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <span style={{ flex: 1 }}>{data.error}</span>
          <button type="button" className="btn btn-sm btn-outline" onClick={() => setTick((t) => t + 1)}><FiRefreshCw />Retry</button>
        </div>
      )}

      <div className="dash-toolbar">
        <h2 className="dash-h2">Readings</h2>
        <Segmented id="range" value={range} onChange={setRange} options={[{ value: 'day', label: '24 hours' }, { value: 'week', label: '7 days' }, { value: 'all', label: 'All time' }]} />
      </div>

      <section className="card kpis">
        {[
          ['Live readings', data.loading ? null : view.total.toLocaleString(), 'one per second while live'],
          ['Sessions', data.loading ? null : view.sessions.length, view.sessions[0] ? `last ${ago(view.sessions[0].last)}` : 'none yet'],
          ['Photos analysed', data.loading ? null : data.photoTotal, 'all time'],
        ].map(([l, v, sub]) => (
          <div className="stat kpi" key={l}>
            <span className="stat-label">{l}</span>
            {v === null ? <span className="skeleton" style={{ height: 34, width: 80 }} /> : <span className="stat-value num">{v}</span>}
            <span className="stat-sub">{sub}</span>
          </div>
        ))}
        <div className="stat kpi">
          <span className="stat-label">Most frequent</span>
          {data.loading ? <span className="skeleton" style={{ height: 34, width: 100 }} /> : <span className="stat-value" style={{ color: view.top ? emotionMeta(view.top[0]).color : 'var(--faint)' }}>{view.top ? emotionMeta(view.top[0]).label : '—'}</span>}
          <span className="stat-sub">{view.top ? `${Math.round((view.top[1] / view.total) * 100)}% of readings` : 'no readings in range'}</span>
        </div>
      </section>

      <div className="dash-row">
        <section className="card card-pad chart-card">
          <div className="card-head">
            <div><h3>Expression mix over time</h3><p>{range === 'day' ? 'Readings per hour' : 'Readings per day'}</p></div>
          </div>
          {view.total ? (
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={view.chart} margin={{ top: 4, right: 4, bottom: 0, left: -18 }} barCategoryGap="22%">
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 11 }} interval="preserveStartEnd" minTickGap={14} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: 'var(--faint)', fontSize: 11 }} allowDecimals={false} width={44} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--bg-2)' }} />
                  {EMOTIONS.map((e, i) => (
                    <Bar key={e.key} dataKey={e.key} stackId="a" fill={emotionHex(e.key, theme)} radius={i === EMOTIONS.length - 1 ? [4, 4, 0, 0] : 0} isAnimationActive />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty">
              <span className="empty-icon"><FiActivity /></span>
              <h3>{data.loading ? 'Loading…' : 'No readings in this range'}</h3>
              {!data.loading && <><p>Start a live session and readings will appear here, hour by hour.</p><Link to="/emotion-detection" className="btn btn-primary btn-sm"><FiCamera />Start live session</Link></>}
            </div>
          )}
        </section>

        <section className="card card-pad">
          <div className="card-head"><div><h3>Distribution</h3><p>Share of readings by expression</p></div></div>
          <Spectrum counts={view.counts} height={12} />
          <ul className="dist">
            {EMOTIONS.map((e) => {
              const n = view.counts[e.key] || 0;
              const p = view.total ? n / view.total : 0;
              return (
                <li key={e.key} style={{ '--c': e.color }}>
                  <span className="dist__label"><span className="swatch" />{e.label}</span>
                  <span className="dist__track"><motion.i initial={false} animate={{ width: `${p * 100}%` }} transition={{ duration: 0.7, ease: EASE }} /></span>
                  <span className="num dist__val">{Math.round(p * 100)}%</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <div className="dash-row dash-row--even">
        <section className="card card-pad">
          <div className="card-head">
            <div><h3>Recent sessions</h3><p>Live camera sessions in this range</p></div>
            <Link to="/emotion-detection" className="btn btn-ghost btn-sm">New <FiArrowRight /></Link>
          </div>
          {view.sessions.length ? (
            <ul className="sessions">
              {view.sessions.slice(0, 6).map((s) => {
                const top = Object.entries(s.counts).sort((a, b) => b[1] - a[1])[0];
                return (
                  <li key={s.id}>
                    <div className="sessions__main">
                      <strong>{new Date(s.first).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(s.first).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</strong>
                      <span className="faint">{dur(new Date(s.last) - new Date(s.first) + 1000)} · {s.n} readings</span>
                    </div>
                    <div className="sessions__mix"><Spectrum counts={s.counts} height={8} /></div>
                    <EmotionChip emotion={top[0]} />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted dash-empty">{data.loading ? 'Loading…' : 'No sessions in this range yet.'}</p>
          )}
        </section>

        <section className="card card-pad">
          <div className="card-head">
            <div><h3>Recent photos</h3><p>{data.photoTotal} analysed in total</p></div>
            <Link to="/image-analyses" className="btn btn-ghost btn-sm">History <FiArrowRight /></Link>
          </div>
          {data.photos.length ? (
            <div className="thumbs">
              {data.photos.slice(0, 8).map((p) => (
                <Link key={p._id} to={`/image-analyses?open=${p._id}`} className="thumb" style={{ '--c': emotionMeta(p.emotion).color }}>
                  <img src={p.imageUrl} alt={`${emotionMeta(p.emotion).label} expression`} loading="lazy" />
                  <span>{emotionMeta(p.emotion).label} <b className="num">{Math.round(p.confidence * 100)}%</b></span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="muted dash-empty">{data.loading ? 'Loading…' : <>No photos yet. <Link to="/emotion-detection?mode=photo" className="link">Analyse one</Link></>}</p>
          )}
        </section>
      </div>
    </div>
  );
}
