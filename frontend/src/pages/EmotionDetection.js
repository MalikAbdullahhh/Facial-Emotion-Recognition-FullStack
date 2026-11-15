import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiCamera, FiCheck, FiClock, FiDownload, FiImage, FiLink, FiPlay, FiSquare, FiTrash2, FiUploadCloud, FiX, FiZap } from 'react-icons/fi';
import api from '../utils/api';
import { EMOTIONS, emotionMeta, toApiLabel, topEmotion } from '../lib/emotions';
import useFaceCamera, { analyseImage } from '../lib/useFaceCamera';
import { fileToDataUrl, toDataUrl } from '../lib/image';
import { downloadReport } from '../lib/report';
import { useDocTitle } from '../lib/hooks';
import { PageHeader } from '../components/layout';
import { EASE, EmotionBars, EmotionChip, FaceBox, Segmented, Spectrum } from '../components/ui';
import './EmotionDetection.css';

const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const newSessionId = () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

/* ── Live camera ─────────────────────────────────────────── */
function LiveMode() {
  const [reading, setReading] = useState(null);
  const [noFace, setNoFace] = useState(false);
  const [save, setSave] = useState(true);
  const [session, setSession] = useState(null); // { id, start, counts, timeline, saved, failed, end }
  const [now, setNow] = useState(Date.now());
  const lastSave = useRef(0);
  const saveRef = useRef(save);
  saveRef.current = save;
  const sessionRef = useRef(null);
  sessionRef.current = session;

  const onResult = useCallback((r) => {
    if (!r.ok) { setNoFace(true); return; }
    setNoFace(false);
    setReading(r);
    setSession((s) => {
      if (!s || s.end) return s;
      const key = emotionMeta(r.emotion).key;
      const counts = { ...s.counts, [key]: (s.counts[key] || 0) + 1 };
      const timeline = [...s.timeline, key].slice(-90);
      return { ...s, counts, timeline, total: s.total + 1 };
    });
    const t = Date.now();
    const cur = sessionRef.current;
    if (saveRef.current && cur && !cur.end && t - lastSave.current >= 1000) {
      lastSave.current = t;
      const sid = cur.id;
      api.post('/emotions/record', { emotion: toApiLabel(r.emotion), confidence: r.confidence, sessionId: sid })
        .then(() => setSession((x) => (x && x.id === sid ? { ...x, saved: x.saved + 1 } : x)))
        .catch(() => setSession((x) => (x && x.id === sid ? { ...x, failed: x.failed + 1 } : x)));
    }
  }, []);

  const cam = useFaceCamera({ onResult });
  const live = cam.status === 'live';

  useEffect(() => {
    if (!live) return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [live]);

  const start = async () => {
    setReading(null);
    setSession({ id: newSessionId(), start: Date.now(), counts: {}, timeline: [], total: 0, saved: 0, failed: 0, end: null });
    await cam.start();
  };
  const stop = () => {
    cam.stop();
    setSession((s) => (s ? { ...s, end: Date.now() } : s));
    setNoFace(false);
  };
  useEffect(() => { if (cam.status === 'error') setSession(null); }, [cam.status]);

  const elapsed = session ? ((session.end || now) - session.start) / 1000 : 0;
  const sessionTop = topEmotion(session?.counts || {});
  const scores = reading?.scores || {};
  const meta = reading ? emotionMeta(reading.emotion) : null;
  const ended = session?.end;

  return (
    <div className="detect-grid">
      <section className="card stage-card">
        <div className="stage" style={{ aspectRatio: live ? `${cam.frame.w} / ${cam.frame.h}` : '4 / 3' }}>
          <video ref={cam.videoRef} className={`stage__video ${live ? 'is-on' : ''}`} playsInline muted />
          {live && reading && !noFace && <FaceBox box={reading.box} frame={cam.frame} emotion={reading.emotion} confidence={reading.confidence} />}

          {live && (
            <div className="stage__hud">
              <span className="hud-pill"><span className="dot dot-live" style={{ color: '#ff6b66' }} />REC <span className="num">{fmt(elapsed)}</span></span>
              {reading && <span className="hud-pill num">{Math.round(reading.ms)} ms</span>}
            </div>
          )}
          {live && noFace && <div className="stage__toast">No face in view — face the camera in even light.</div>}

          {!live && (
            <div className="stage__idle">
              {cam.status === 'starting' ? (
                <><span className="spinner" /><p>Starting camera and loading the model…</p></>
              ) : ended ? (
                <>
                  <span className="stage__icon"><FiCheck /></span>
                  <h3>Session finished</h3>
                  <p>{fmt(elapsed)} · {session.total} readings{save ? ` · ${session.saved} saved` : ''}</p>
                  <div className="stage__actions">
                    <button type="button" className="btn btn-signal" onClick={start}><FiPlay /> New session</button>
                    <Link to="/dashboard" className="btn btn-outline-dark">See overview</Link>
                  </div>
                </>
              ) : (
                <>
                  <span className="stage__icon"><FiCamera /></span>
                  <h3>Start a live session</h3>
                  <p>Readings update about three times a second. Video never leaves this tab.</p>
                  <button type="button" className="btn btn-signal btn-lg" onClick={start}><FiPlay /> Start camera</button>
                </>
              )}
            </div>
          )}
        </div>

        {cam.error && <div className="alert alert-error stage-alert" role="alert"><FiAlertCircle /><span>{cam.error} <Link to="?mode=photo" className="link">Analyse a photo</Link></span></div>}

        <div className="stage-bar">
          {live ? (
            <button type="button" className="btn btn-primary" onClick={stop}><FiSquare /> Stop session</button>
          ) : (
            <span className="hint">{cam.status === 'starting' ? 'Allow camera access if your browser asks.' : 'Tip: face the camera in soft, even light.'}</span>
          )}
          <label className="switch">
            <input type="checkbox" checked={save} onChange={(e) => setSave(e.target.checked)} />
            <span className="switch__track"><span /></span>
            <span className="switch__label">Save readings to history</span>
          </label>
        </div>
      </section>

      <div className="detect-side">
        <section className="card card-pad now-card" style={{ '--c': meta?.color || 'var(--faint)' }}>
          <div className="card-head">
            <h2>Right now</h2>
            {live ? <span className="badge badge-ok"><span className="dot dot-live" />Live</span> : <span className="badge">Idle</span>}
          </div>
          <div className="now-read">
            <AnimatePresence mode="wait" initial={false}>
              <motion.strong key={meta?.key || 'none'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}>
                {meta?.label || <span className="now-empty">{live ? 'Looking for a face…' : 'No reading yet'}</span>}
              </motion.strong>
            </AnimatePresence>
            <span className="num">{reading ? Math.round(reading.confidence * 100) : 0}<small>%</small></span>
          </div>
          <EmotionBars scores={scores} fast />
        </section>

        <section className="card card-pad">
          <div className="card-head">
            <div><h2>This session</h2><p>{session ? (ended ? 'Finished' : 'Recording') : 'Starts when you press start'}</p></div>
            {session && save && (
              <span className={`badge ${session.failed ? 'badge-danger' : ''}`} title={session.failed ? `${session.failed} readings couldn’t be saved` : undefined}>
                {session.failed ? <FiAlertCircle /> : <FiCheck />}{session.saved} saved
              </span>
            )}
          </div>
          <div className="session-stats">
            <div className="stat"><span className="stat-label">Duration</span><span className="stat-value num">{fmt(elapsed)}</span></div>
            <div className="stat"><span className="stat-label">Readings</span><span className="stat-value num">{session?.total || 0}</span></div>
            <div className="stat"><span className="stat-label">Most frequent</span><span className="stat-value" style={{ color: sessionTop ? emotionMeta(sessionTop[0]).color : undefined }}>{sessionTop ? emotionMeta(sessionTop[0]).label : '—'}</span></div>
          </div>
          <div className="timeline-strip" aria-label="Session timeline">
            {(session?.timeline || []).map((k, i) => <span key={i} style={{ '--c': emotionMeta(k).color }} />)}
            {!session?.timeline?.length && <em>Readings will appear here as a timeline</em>}
          </div>
          <Spectrum counts={session?.counts || {}} />
          <div className="legend">
            {EMOTIONS.filter((e) => session?.counts?.[e.key]).map((e) => (
              <span key={e.key} style={{ '--c': e.color }}><span className="swatch" />{e.label} <span className="num faint">{Math.round((session.counts[e.key] / session.total) * 100)}%</span></span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Photos ──────────────────────────────────────────────── */
function PhotoMode() {
  const [items, setItems] = useState([]); // { id, name, size, src, status: queued|busy|done|noface, result, saved }
  const [selected, setSelected] = useState(null);
  const [drag, setDrag] = useState(false);
  const [url, setUrl] = useState('');
  const [urlBusy, setUrlBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const patch = (id, p) => setItems((list) => list.map((it) => (it.id === id ? { ...it, ...p } : it)));

  const analyse = useCallback(async (item) => {
    patch(item.id, { status: 'busy' });
    const r = await analyseImage(item.src);
    if (!r.ok) { patch(item.id, { status: 'noface', error: r.error }); return; }
    const result = { emotion: r.emotion, confidence: r.confidence, scores: r.scores, box: r.box, frame: r.frame };
    patch(item.id, { status: 'done', result });
    try {
      await api.post('/emotions/image-analysis', {
        imageUrl: item.src,
        emotion: toApiLabel(r.emotion),
        confidence: r.confidence,
        allEmotions: r.scores,
        bbox: r.box,
        fileName: item.name,
        fileSize: item.size,
      });
      patch(item.id, { saved: true });
    } catch (e) {
      patch(item.id, { saved: false, saveError: true });
    }
  }, []);

  const addSources = useCallback(async (entries) => {
    setError('');
    const added = [];
    for (const { load, name, size } of entries) {
      try {
        const src = await load();
        added.push({ id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, name, size, src, status: 'queued' });
      } catch (e) {
        setError(e.message);
      }
    }
    if (!added.length) return;
    setItems((list) => [...added, ...list]);
    setSelected(added[0].id);
    for (const it of added) await analyse(it); // eslint-disable-line no-await-in-loop
  }, [analyse]);

  const onFiles = (files) => {
    const imgs = Array.from(files || []).filter((f) => f.type.startsWith('image/'));
    if (!imgs.length) { setError('Choose image files (JPG, PNG, WebP or HEIC exported as JPG).'); return; }
    addSources(imgs.slice(0, 12).map((f) => ({ name: f.name, size: f.size, load: () => fileToDataUrl(f) })));
  };

  useEffect(() => {
    const onPaste = (e) => {
      if (e.target.closest?.('input, textarea')) return;
      const files = Array.from(e.clipboardData?.items || []).filter((i) => i.type.startsWith('image/')).map((i) => i.getAsFile()).filter(Boolean);
      if (files.length) { e.preventDefault(); onFiles(files); }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const addUrl = async (e) => {
    e.preventDefault();
    let u;
    try { u = new URL(url.trim()); if (!/^https?:$/.test(u.protocol)) throw new Error(); } catch (err) { setError('Enter a full image link starting with https://'); return; }
    setUrlBusy(true);
    await addSources([{ name: u.pathname.split('/').pop() || u.hostname, size: 0, load: () => toDataUrl(u.href) }]);
    setUrlBusy(false);
    setUrl('');
  };

  const remove = (id) => {
    setItems((list) => list.filter((i) => i.id !== id));
    if (selected === id) setSelected(itemsRef.current.find((i) => i.id !== id)?.id || null);
  };

  const current = items.find((i) => i.id === selected) || null;
  const done = items.filter((i) => i.status === 'done');
  const counts = useMemo(() => done.reduce((acc, i) => { const k = emotionMeta(i.result.emotion).key; acc[k] = (acc[k] || 0) + 1; return acc; }, {}), [done]);

  return (
    <div className="photo-grid">
      <section className="card viewer-card">
        {current ? (
          <>
            <div className="viewer">
              <div className="viewer__img" style={current.result?.frame ? { aspectRatio: `${current.result.frame.w} / ${current.result.frame.h}`, width: `min(100%, calc(62vh * ${current.result.frame.w / current.result.frame.h}))` } : undefined}>
                <img src={current.src} alt={current.name} />
                {current.result && <FaceBox box={current.result.box} frame={current.result.frame} emotion={current.result.emotion} confidence={current.result.confidence} />}
                {current.status === 'busy' && <div className="stage__toast"><span className="spinner" />Analysing on your device…</div>}
              </div>
            </div>
            <div className="viewer__body">
              {current.status === 'noface' ? (
                <div className="alert alert-error"><FiAlertCircle /><span><strong>No face found.</strong> Try a photo where the face is front-on, unobstructed and well lit.</span></div>
              ) : current.result ? (
                <div className="result">
                  <div className="result__head" style={{ '--c': emotionMeta(current.result.emotion).color }}>
                    <div>
                      <span className="stat-label">Dominant expression</span>
                      <strong>{emotionMeta(current.result.emotion).label}</strong>
                    </div>
                    <span className="num result__conf">{Math.round(current.result.confidence * 100)}<small>%</small></span>
                  </div>
                  <EmotionBars scores={current.result.scores} />
                </div>
              ) : (
                <div className="result result--loading"><div className="skeleton" style={{ height: 48 }} /><div className="skeleton" style={{ height: 140 }} /></div>
              )}
              <div className="viewer__actions">
                {current.result && <button type="button" className="btn btn-primary" onClick={() => downloadReport({ image: current.src, ...current.result, date: Date.now() })}><FiDownload /> Download report</button>}
                <button type="button" className="btn btn-outline" onClick={() => remove(current.id)}><FiX /> Remove from list</button>
                {current.saved && <span className="badge badge-ok"><FiCheck />Saved to History</span>}
                {current.saveError && <span className="badge badge-danger"><FiAlertCircle />Not saved</span>}
              </div>
            </div>
          </>
        ) : (
          <div className="empty viewer-empty">
            <span className="empty-icon"><FiImage /></span>
            <h3>No photo selected</h3>
            <p>Add one or more photos. Each face is analysed on your device and the result is saved to your history.</p>
          </div>
        )}
      </section>

      <div className="detect-side">
        <section
          className={`card dropzone ${drag ? 'is-drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); onFiles(e.dataTransfer.files); }}
        >
          <button type="button" className="dropzone__hit" onClick={() => fileRef.current?.click()}>
            <span className="dropzone__icon"><FiUploadCloud /></span>
            <strong>Drop photos or <span className="link">browse</span></strong>
            <span className="hint">Up to 12 at once · you can also paste with Ctrl/⌘ + V</span>
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }} />
          <form className="url-row" onSubmit={addUrl}>
            <FiLink />
            <input className="input" type="url" placeholder="…or paste an image link" value={url} onChange={(e) => setUrl(e.target.value)} aria-label="Image link" />
            <button type="submit" className="btn btn-outline btn-sm" disabled={!url || urlBusy}>{urlBusy ? <span className="spinner" /> : 'Add'}</button>
          </form>
          {error && <div className="alert alert-error"><FiAlertCircle />{error}</div>}
        </section>

        <section className="card card-pad">
          <div className="card-head">
            <div><h2>This batch</h2><p>{items.length ? `${done.length} of ${items.length} analysed` : 'Nothing added yet'}</p></div>
            {items.length > 0 && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setItems([]); setSelected(null); }}><FiTrash2 />Clear</button>}
          </div>
          {items.length ? (
            <>
              <ul className="queue">
                <AnimatePresence initial={false}>
                  {items.map((it) => (
                    <motion.li key={it.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3, ease: EASE }}>
                      <button type="button" className={`queue__item ${selected === it.id ? 'is-active' : ''}`} onClick={() => setSelected(it.id)}>
                        <img src={it.src} alt="" />
                        <span className="queue__meta">
                          <span className="queue__name">{it.name}</span>
                          {it.status === 'done' ? <EmotionChip emotion={it.result.emotion} confidence={it.result.confidence} /> : it.status === 'noface' ? <span className="badge badge-danger">No face</span> : <span className="badge"><span className="spinner" style={{ width: 11, height: 11 }} />{it.status === 'busy' ? 'Analysing' : 'Queued'}</span>}
                        </span>
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              {done.length > 1 && <div style={{ marginTop: 16 }}><Spectrum counts={counts} /></div>}
            </>
          ) : (
            <p className="muted" style={{ fontSize: '0.9rem' }}>Tip: compare several photos of the same person to see how the reading changes.</p>
          )}
          <Link to="/image-analyses" className="btn btn-outline btn-block" style={{ marginTop: 18 }}><FiClock /> Open full history</Link>
        </section>
      </div>
    </div>
  );
}

export default function EmotionDetection() {
  useDocTitle('Detect');
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'photo' ? 'photo' : 'live';
  return (
    <div>
      <PageHeader
        title="Detect"
        description={mode === 'live' ? 'Read expressions live from your camera. Everything runs on this device.' : 'Analyse one or many photos. Results are saved to your history.'}
        actions={(
          <Segmented
            id="detect-mode"
            value={mode}
            onChange={(v) => setParams(v === 'photo' ? { mode: 'photo' } : {}, { replace: true })}
            options={[{ value: 'live', label: 'Live camera', icon: <FiZap /> }, { value: 'photo', label: 'Photos', icon: <FiImage /> }]}
          />
        )}
      />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: EASE }}>
          {mode === 'live' ? <LiveMode /> : <PhotoMode />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
