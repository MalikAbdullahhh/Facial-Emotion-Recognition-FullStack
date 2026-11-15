import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiDownload, FiImage, FiPlus, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import api from '../utils/api';
import { EMOTIONS, emotionMeta, normaliseScores, toKey } from '../lib/emotions';
import { downloadReport } from '../lib/report';
import { formatBytes } from '../lib/image';
import { useDocTitle } from '../lib/hooks';
import { PageHeader } from '../components/layout';
import { Drawer, EASE, EmotionBars, EmotionChip, FaceBox, Modal } from '../components/ui';
import './Dashboard.css';
import './EmotionDetection.css';
import './History.css';

const PAGE = 24;

function Detail({ item, onDelete }) {
  const [frame, setFrame] = useState(null);
  const meta = emotionMeta(item.emotion);
  const scores = normaliseScores(item.allEmotions);
  return (
    <>
      <div className="detail-img">
        <div className="detail-img__inner" style={frame ? { aspectRatio: `${frame.w} / ${frame.h}`, width: `min(100%, calc(50vh * ${frame.w / frame.h}))` } : undefined}>
          <img src={item.imageUrl} alt={item.fileName || 'Analysed photo'} onLoad={(e) => setFrame({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })} />
          {frame && item.bbox?.length === 4 && <FaceBox box={item.bbox} frame={frame} emotion={item.emotion} confidence={item.confidence} />}
        </div>
      </div>
      <div className="result__head" style={{ '--c': meta.color }}>
        <div><span className="stat-label">Dominant expression</span><strong>{meta.label}</strong></div>
        <span className="num result__conf">{Math.round(item.confidence * 100)}<small>%</small></span>
      </div>
      <EmotionBars scores={scores} />
      <dl className="kv">
        <div><dt>Analysed</dt><dd>{new Date(item.timestamp).toLocaleString()}</dd></div>
        <div><dt>File</dt><dd>{item.fileName || '—'}</dd></div>
        {item.fileSize > 0 && <div><dt>Original size</dt><dd>{formatBytes(item.fileSize)}</dd></div>}
      </dl>
      <div className="detail-actions">
        <button type="button" className="btn btn-primary" onClick={() => downloadReport({ image: item.imageUrl, emotion: item.emotion, confidence: item.confidence, allEmotions: item.allEmotions, bbox: item.bbox, date: item.timestamp })}><FiDownload /> Download report</button>
        <button type="button" className="btn btn-danger" onClick={onDelete}><FiTrash2 /> Delete</button>
      </div>
    </>
  );
}

export default function ImageAnalyses() {
  useDocTitle('History');
  const [params, setParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('new');
  const [confirm, setConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const openId = params.get('open');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [a, s] = await Promise.all([api.get(`/emotions/image-analyses?limit=${PAGE}&skip=0`), api.get('/emotions/image-analyses/stats')]);
      setItems(a.data.analyses || []);
      setTotal(a.data.total || 0);
      setStats(s.data);
    } catch (e) {
      setError('Your history couldn’t be loaded. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const loadMore = async () => {
    setMore(true);
    try {
      const { data } = await api.get(`/emotions/image-analyses?limit=${PAGE}&skip=${items.length}`);
      setItems((l) => [...l, ...(data.analyses || [])]);
    } finally { setMore(false); }
  };

  // Deep link (?open=id) for an item not in the first page
  useEffect(() => {
    if (!openId || loading || items.some((i) => i._id === openId)) return;
    api.get(`/emotions/image-analyses?limit=200`).then(({ data }) => setItems(data.analyses || [])).catch(() => {});
  }, [openId, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const c = {};
    Object.entries(stats?.emotionStats || {}).forEach(([k, v]) => { const key = toKey(k); c[key] = (c[key] || 0) + v.count; });
    return c;
  }, [stats]);
  const topKey = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const shown = useMemo(() => {
    let l = filter === 'all' ? items : items.filter((i) => toKey(i.emotion) === filter);
    if (sort === 'conf') l = [...l].sort((a, b) => b.confidence - a.confidence);
    if (sort === 'old') l = [...l].sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
    return l;
  }, [items, filter, sort]);

  const open = items.find((i) => i._id === openId);
  const setOpen = (id) => setParams(id ? { open: id } : {}, { replace: !id });

  const doDelete = async () => {
    if (!confirm) return;
    setDeleting(true);
    try {
      await api.delete(`/emotions/image-analyses/${confirm._id}`);
      setItems((l) => l.filter((i) => i._id !== confirm._id));
      setTotal((t) => t - 1);
      setCounts(confirm);
      if (openId === confirm._id) setOpen(null);
      setConfirm(null);
    } catch (e) {
      setError('That analysis couldn’t be deleted. Please try again.');
      setConfirm(null);
    } finally { setDeleting(false); }
  };
  const setCounts = (removed) => setStats((s) => {
    if (!s) return s;
    const es = { ...s.emotionStats };
    const k = Object.keys(es).find((x) => toKey(x) === toKey(removed.emotion));
    if (k) es[k] = { ...es[k], count: Math.max(0, es[k].count - 1) };
    return { ...s, totalAnalyses: Math.max(0, (s.totalAnalyses || 1) - 1), emotionStats: es };
  });

  return (
    <div>
      <PageHeader
        title="History"
        description="Every photo you’ve analysed, with its full result. Open one to see the breakdown or download a report."
        actions={<Link to="/emotion-detection?mode=photo" className="btn btn-primary"><FiPlus /> Analyse photos</Link>}
      />

      <section className="card kpis kpis--3">
        <div className="stat kpi"><span className="stat-label">Photos analysed</span>{loading ? <span className="skeleton" style={{ height: 34, width: 60 }} /> : <span className="stat-value num">{stats?.totalAnalyses ?? total}</span>}</div>
        <div className="stat kpi"><span className="stat-label">Average confidence</span>{loading ? <span className="skeleton" style={{ height: 34, width: 80 }} /> : <span className="stat-value num">{Math.round((stats?.avgConfidence || 0) * 100)}%</span>}</div>
        <div className="stat kpi"><span className="stat-label">Most common</span>{loading ? <span className="skeleton" style={{ height: 34, width: 90 }} /> : <span className="stat-value" style={{ color: topKey ? emotionMeta(topKey).color : 'var(--faint)' }}>{topKey ? emotionMeta(topKey).label : '—'}</span>}</div>
      </section>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}><FiAlertCircle /><span style={{ flex: 1 }}>{error}</span><button type="button" className="btn btn-outline btn-sm" onClick={load}><FiRefreshCw />Retry</button></div>}

      {(items.length > 0 || loading) && (
        <div className="hist-toolbar">
          <div className="chips" role="tablist" aria-label="Filter by expression">
            <button type="button" role="tab" aria-selected={filter === 'all'} className={`chip ${filter === 'all' ? 'is-on' : ''}`} onClick={() => setFilter('all')}>All <span className="num">{stats?.totalAnalyses ?? total}</span></button>
            {EMOTIONS.filter((e) => counts[e.key]).map((e) => (
              <button key={e.key} type="button" role="tab" aria-selected={filter === e.key} className={`chip ${filter === e.key ? 'is-on' : ''}`} style={{ '--c': e.color }} onClick={() => setFilter(e.key)}>
                <span className="swatch" />{e.label} <span className="num">{counts[e.key]}</span>
              </button>
            ))}
          </div>
          <select className="input hist-sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
            <option value="conf">Highest confidence</option>
          </select>
        </div>
      )}

      {loading ? (
        <div className="hist-grid">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '4 / 5', borderRadius: 18 }} />)}</div>
      ) : items.length === 0 ? (
        <section className="card">
          <div className="empty" style={{ padding: '72px 20px' }}>
            <span className="empty-icon"><FiImage /></span>
            <h3>No photo analyses yet</h3>
            <p>Analyse a photo and it will appear here with its full breakdown, ready to compare or export.</p>
            <Link to="/emotion-detection?mode=photo" className="btn btn-primary"><FiPlus /> Analyse your first photo</Link>
          </div>
        </section>
      ) : (
        <>
          <motion.div layout className="hist-grid">
            <AnimatePresence initial={false}>
              {shown.map((it) => (
                <motion.button
                  layout
                  key={it._id}
                  type="button"
                  className="hist-card"
                  onClick={() => setOpen(it._id)}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  style={{ '--c': emotionMeta(it.emotion).color }}
                >
                  <span className="hist-card__img"><img src={it.imageUrl} alt="" loading="lazy" /></span>
                  <span className="hist-card__body">
                    <EmotionChip emotion={it.emotion} confidence={it.confidence} />
                    <span className="hist-card__meta"><span className="hist-card__name">{it.fileName || 'Photo'}</span><span className="faint">{new Date(it.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></span>
                  </span>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
          {shown.length === 0 && <p className="muted" style={{ padding: '24px 0' }}>No photos with this expression in the loaded results.</p>}
          {items.length < total && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <button type="button" className="btn btn-outline" onClick={loadMore} disabled={more}>{more ? <><span className="spinner" />Loading…</> : `Load more (${total - items.length})`}</button>
            </div>
          )}
        </>
      )}

      <Drawer open={!!open} onClose={() => setOpen(null)} title="Analysis">
        {open && <Detail item={open} onDelete={() => setConfirm(open)} />}
      </Drawer>

      <Modal open={!!confirm} onClose={() => !deleting && setConfirm(null)} title="Delete this analysis?">
        <p className="muted">The photo and its result will be permanently removed from your history. This can’t be undone.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
          <button type="button" className="btn btn-outline" onClick={() => setConfirm(null)} disabled={deleting}>Cancel</button>
          <button type="button" className="btn btn-danger" onClick={doDelete} disabled={deleting}>{deleting ? <><span className="spinner" />Deleting…</> : <><FiTrash2 /> Delete</>}</button>
        </div>
      </Modal>
    </div>
  );
}
