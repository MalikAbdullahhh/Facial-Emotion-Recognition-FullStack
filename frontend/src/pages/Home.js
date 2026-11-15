import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { FiArrowRight, FiCamera, FiCheck, FiDownload, FiImage, FiSquare, FiUpload } from 'react-icons/fi';
import { EMOTIONS, emotionMeta, topEmotion } from '../lib/emotions';
import useFaceCamera, { analyseImage } from '../lib/useFaceCamera';
import { useDocTitle, useUser } from '../lib/hooks';
import { EASE, EmotionBars, FaceBox, Reveal } from '../components/ui';
import ExpressionFace from '../components/ui/ExpressionFace';
import { homeFor } from '../components/layout';
import './Home.css';

/* Scripted readings shown before the visitor starts their camera. */
const PREVIEW = [
  { happy: 0.84, neutral: 0.09, surprised: 0.04, sad: 0.01, angry: 0.01, fear: 0.005, disgust: 0.005 },
  { happy: 0.12, neutral: 0.76, surprised: 0.05, sad: 0.04, angry: 0.02, fear: 0.005, disgust: 0.005 },
  { happy: 0.06, neutral: 0.1, surprised: 0.78, sad: 0.01, angry: 0.01, fear: 0.03, disgust: 0.01 },
  { happy: 0.02, neutral: 0.2, surprised: 0.02, sad: 0.69, angry: 0.03, fear: 0.03, disgust: 0.01 },
];

/* ── Live demo instrument ───────────────────────────────── */
function LiveDemo({ startSignal }) {
  const reduce = useReducedMotion();
  const fileRef = useRef(null);
  const [scores, setScores] = useState(PREVIEW[0]);
  const [reading, setReading] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoState, setPhotoState] = useState(null); // { frame, box, error, busy }
  const [hint, setHint] = useState('');
  const cam = useFaceCamera({
    onResult: (r) => {
      if (r.ok) { setScores(r.scores); setReading(r); setHint(''); } else { setReading(null); setHint('Looking for a face…'); }
    },
  });
  const live = cam.status === 'live';
  const mode = photo ? 'photo' : live ? 'live' : cam.status === 'starting' ? 'starting' : 'preview';

  useEffect(() => {
    if (mode !== 'preview' || reduce) return undefined;
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % PREVIEW.length; setScores(PREVIEW[i]); }, 2400);
    return () => clearInterval(id);
  }, [mode, reduce]);

  const start = () => { setPhoto(null); setPhotoState(null); cam.start(); };
  useEffect(() => { if (startSignal) start(); }, [startSignal]); // eslint-disable-line react-hooks/exhaustive-deps

  const stop = () => { cam.stop(); setReading(null); setHint(''); setScores(PREVIEW[0]); };

  const onFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    cam.stop();
    setReading(null);
    const url = URL.createObjectURL(file);
    setPhoto(url);
    setPhotoState({ busy: true });
    const r = await analyseImage(url);
    if (r.ok) { setScores(r.scores); setPhotoState({ frame: r.frame, box: r.box, emotion: r.emotion, confidence: r.confidence }); } else setPhotoState({ frame: r.frame, error: r.error });
  };

  const clearPhoto = () => { setPhoto(null); setPhotoState(null); setScores(PREVIEW[0]); };

  const top = topEmotion(scores);
  const meta = emotionMeta(top?.[0]);
  const ratio = mode === 'photo' && photoState?.frame ? photoState.frame.w / photoState.frame.h : mode === 'live' ? cam.frame.w / cam.frame.h : 4 / 3;

  return (
    <div className="demo" id="demo">
      <div className="demo__bar">
        <span className={`demo__status ${live ? 'is-live' : ''}`}><span className={`dot ${live ? 'dot-live' : ''}`} />{live ? 'Live' : mode === 'photo' ? 'Photo' : mode === 'starting' ? 'Starting camera' : 'Preview'}</span>
        <span className="demo__meta num">{live && reading ? `${Math.round(reading.ms)} ms · on-device` : 'on-device · 0 uploads'}</span>
      </div>

      <div className="demo__stage" style={{ aspectRatio: String(ratio), maxWidth: ratio < 1 ? `calc(400px * ${ratio})` : undefined }}>
        <video ref={cam.videoRef} className={`demo__video ${live ? 'is-on' : ''}`} playsInline muted />
        {photo && <img src={photo} alt="Your upload" className="demo__photo" />}
        {mode === 'preview' && (
          <div className="demo__idle">
            <div className="demo__face" style={{ color: meta.color }}><ExpressionFace emotion={top?.[0]} color={meta.color} /></div>
          </div>
        )}
        {mode === 'starting' && <div className="demo__idle"><span className="spinner" /><span className="demo__msg-inline">Loading the on-device model…</span></div>}
        {live && reading && <FaceBox box={reading.box} frame={cam.frame} emotion={reading.emotion} confidence={reading.confidence} />}
        {mode === 'photo' && photoState?.box && <FaceBox box={photoState.box} frame={photoState.frame} emotion={photoState.emotion} confidence={photoState.confidence} />}
        {mode === 'photo' && photoState?.busy && <div className="demo__toast"><span className="spinner" />Analysing on your device…</div>}
        {(hint && live) && <div className="demo__toast">{hint}</div>}
        {photoState?.error && <div className="demo__toast is-warn">{photoState.error}</div>}
        {cam.error && <div className="demo__toast is-warn">{cam.error}</div>}
      </div>

      <div className="demo__readout">
        <div>
          <span className="demo__label">Dominant expression</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.strong key={top?.[0]} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} style={{ color: meta.color }}>
              {meta.label}
            </motion.strong>
          </AnimatePresence>
        </div>
        <span className="demo__conf num">{Math.round((top?.[1] || 0) * 100)}<small>%</small></span>
      </div>
      <EmotionBars scores={scores} fast={live} compact />

      <div className="demo__actions">
        {live ? (
          <button type="button" className="btn btn-primary" onClick={stop}><FiSquare /> Stop</button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={start} disabled={mode === 'starting'}><FiCamera /> {mode === 'starting' ? 'Starting…' : 'Use my camera'}</button>
        )}
        {mode === 'photo' ? (
          <button type="button" className="btn btn-outline" onClick={clearPhoto}>Clear photo</button>
        ) : (
          <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()}><FiUpload /> Try a photo</button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
    </div>
  );
}

/* ── Seven expressions explorer ─────────────────────────── */
function Explorer() {
  const reduce = useReducedMotion();
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.3 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!auto || !visible || reduce) return undefined;
    const id = setInterval(() => setIdx((i) => (i + 1) % EMOTIONS.length), 2600);
    return () => clearInterval(id);
  }, [auto, visible, reduce]);

  const e = EMOTIONS[idx];
  return (
    <div className="explorer" ref={ref}>
      <div className="explorer__list" role="tablist" aria-label="Expressions">
        {EMOTIONS.map((em, i) => (
          <button key={em.key} type="button" role="tab" aria-selected={i === idx} className={`explorer__item ${i === idx ? 'is-active' : ''}`} style={{ '--c': em.color }} onClick={() => { setIdx(i); setAuto(false); }}>
            <span className="num explorer__n">{String(i + 1).padStart(2, '0')}</span>
            <span className="explorer__name">{em.label}</span>
            <span className="swatch" />
            {i === idx && auto && visible && !reduce && <motion.span className="explorer__timer" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 2.6, ease: 'linear' }} />}
          </button>
        ))}
      </div>
      <div className="explorer__panel" style={{ '--c': e.color }}>
        <div className="explorer__face"><ExpressionFace emotion={e.key} color={e.color} /></div>
        <AnimatePresence mode="wait">
          <motion.div key={e.key} className="explorer__copy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: EASE }}>
            <h3>{e.label}</h3>
            <p>{e.cue}</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const STEPS = [
  { t: 'Find the face', d: 'A tiny detector locates the face in each frame and crops it — in a few milliseconds, on your device.', v: 'frame' },
  { t: 'Score seven expressions', d: 'A compact neural network returns a probability for each expression. The highest one wins the frame.', v: 'bars' },
  { t: 'See it over time', d: 'With an account, each reading is saved as a label and score so you can review sessions and compare photos.', v: 'line' },
];

function StepVisual({ v }) {
  if (v === 'frame') {
    return (
      <div className="sv sv-frame" aria-hidden="true">
        <div className="vf-box" style={{ left: '30%', top: '18%', width: '40%', height: '64%', '--c': 'var(--signal)' }}><i /><i /><i /><i /></div>
        <span className="sv-dot" style={{ left: '43%', top: '42%' }} /><span className="sv-dot" style={{ left: '57%', top: '42%' }} /><span className="sv-dot" style={{ left: '50%', top: '62%' }} />
      </div>
    );
  }
  if (v === 'bars') {
    return (
      <div className="sv sv-bars" aria-hidden="true">
        {[[0.82, 'happy'], [0.1, 'neutral'], [0.05, 'surprised'], [0.03, 'sad']].map(([w, k]) => (
          <span key={k} style={{ '--c': emotionMeta(k).color }}><motion.i initial={{ width: 0 }} whileInView={{ width: `${w * 100}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE, delay: 0.2 }} /></span>
        ))}
      </div>
    );
  }
  const pts = [4, 6, 5, 8, 7, 10, 9, 12, 11, 13];
  return (
    <div className="sv sv-line" aria-hidden="true">
      {pts.map((h, i) => <span key={i} style={{ height: `${h * 6}%`, '--c': i % 3 === 0 ? 'var(--e-neutral)' : 'var(--e-happy)' }} />)}
    </div>
  );
}

const USES = [
  ['UX & product research', 'See where testers light up or frown during a prototype walkthrough — with their consent.'],
  ['Presentation practice', 'Rehearse a talk and check whether your face says what your words do.'],
  ['Classrooms & workshops', 'Show how facial expressions are measured, live, without sending anyone’s face to a server.'],
  ['Personal reflection', 'Notice how your expressions shift across a week. A mirror, not a diagnosis.'],
];

export default function Home() {
  useDocTitle();
  const user = useUser();
  const [startSignal, setStartSignal] = useState(0);

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__copy">
            <motion.p className="hero__chip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <FiCheck /> Runs in your browser · nothing is uploaded
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.05 }}>
              Expression recognition that never leaves your device.
            </motion.h1>
            <motion.p className="lead hero__lead" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}>
              Point your camera or drop in a photo. FER scores seven facial expressions in real time and keeps a history only when you ask it to.
            </motion.p>
            <motion.div className="hero__ctas" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.25 }}>
              {user ? (
                <Link to={homeFor(user)} className="btn btn-primary btn-lg">Open your dashboard <FiArrowRight /></Link>
              ) : (
                <Link to="/signup" className="btn btn-primary btn-lg">Create free account <FiArrowRight /></Link>
              )}
              <button type="button" className="btn btn-outline btn-lg" onClick={() => { setStartSignal(Date.now()); document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
                <FiCamera /> Try it live
              </button>
            </motion.div>
            <motion.ul className="hero__facts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.45 }}>
              <li><strong className="num">7</strong> expressions</li>
              <li><strong className="num">~3/s</strong> live readings</li>
              <li><strong className="num">0</strong> frames uploaded</li>
            </motion.ul>
          </div>
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.15 }}>
            <LiveDemo startSignal={startSignal} />
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section className="section" id="how">
        <div className="container">
          <Reveal className="section-head">
            <p className="kicker">How it works</p>
            <h2>From camera frame to expression in three quick passes.</h2>
          </Reveal>
          <ol className="steps">
            {STEPS.map((s, i) => (
              <Reveal as="li" key={s.t} delay={i * 0.08} className="step">
                <StepVisual v={s.v} />
                <div className="step__body">
                  <span className="step__n num">{i + 1}</span>
                  <div>
                    <h3>{s.t}</h3>
                    <p>{s.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Seven expressions */}
      <section className="section section--sunk" id="expressions">
        <div className="container">
          <Reveal className="section-head">
            <p className="kicker">The seven expressions</p>
            <h2>What the model is looking for.</h2>
            <p>Each expression is a pattern of facial muscle movements. Pick one to see the cues the model weighs.</p>
          </Reveal>
          <Reveal><Explorer /></Reveal>
        </div>
      </section>

      {/* Privacy */}
      <section className="section privacy" id="privacy">
        <div className="container privacy__grid">
          <Reveal className="privacy__copy">
            <p className="kicker">Privacy by design</p>
            <h2>Your face stays in the browser tab.</h2>
            <p className="lead">The detector and the expression model are downloaded once (about half a megabyte) and run with TensorFlow.js on your own hardware. Frames are analysed in memory and thrown away.</p>
            <ul className="privacy__list">
              <li><FiCheck /> No video or photo is ever sent to a server</li>
              <li><FiCheck /> Works without an account</li>
              <li><FiCheck /> Signed in, only the label and score are saved</li>
            </ul>
          </Reveal>
          <Reveal delay={0.1} className="flow" aria-label="Data flow">
            <div className="flow__device">
              <span className="flow__device-label">Your browser</span>
              {['Camera or photo', 'Face detector', 'Expression model'].map((n, i) => (
                <React.Fragment key={n}>
                  <div className="flow__node"><span className="num">{i + 1}</span>{n}</div>
                  {i < 2 && <span className="flow__arrow" aria-hidden="true" />}
                </React.Fragment>
              ))}
            </div>
            <div className="flow__out">
              <span className="flow__wire" aria-hidden="true" />
              <div className="flow__payload">
                <span className="flow__payload-label">Saved to your history (optional)</span>
                <code className="num">{'{ emotion: "Happy", confidence: 0.84 }'}</code>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Account */}
      <section className="section">
        <div className="container">
          <Reveal className="section-head">
            <p className="kicker">With a free account</p>
            <h2>Keep sessions, compare photos, export reports.</h2>
          </Reveal>
          <div className="bento">
            <Reveal className="bento__card bento__card--wide">
              <div className="bento__viz bento__timeline" aria-hidden="true">
                {Array.from({ length: 36 }).map((_, i) => {
                  const k = [0, 0, 1, 0, 0, 2, 0, 1, 1, 0, 3, 0][i % 12];
                  return <span key={i} style={{ height: `${30 + ((i * 37) % 60)}%`, '--c': EMOTIONS[k].color }} />;
                })}
              </div>
              <h3>Live sessions</h3>
              <p>Every camera session is timed and charted, so you can see when expressions changed — not just what they were.</p>
            </Reveal>
            <Reveal delay={0.06} className="bento__card">
              <div className="bento__viz bento__photos" aria-hidden="true">
                {['happy', 'neutral', 'surprised', 'sad'].map((k) => (
                  <span key={k} style={{ '--c': emotionMeta(k).color }}><FiImage /><em>{emotionMeta(k).label}</em></span>
                ))}
              </div>
              <h3>Photo history</h3>
              <p>Analyse several photos at once and keep the results side by side.</p>
            </Reveal>
            <Reveal delay={0.12} className="bento__card">
              <div className="bento__viz bento__report" aria-hidden="true">
                <span className="bento__report-line" style={{ width: '60%' }} />
                <span className="bento__report-line" style={{ width: '40%' }} />
                <span className="spectrum" style={{ height: 8 }}>
                  {[['happy', 5], ['neutral', 3], ['surprised', 1], ['sad', 1]].map(([k, g]) => <span key={k} style={{ '--c': emotionMeta(k).color, flexGrow: g }} />)}
                </span>
                <FiDownload className="bento__report-icon" />
              </div>
              <h3>Reports</h3>
              <p>Download a clean summary image of any analysis to share or keep.</p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="section section--sunk">
        <div className="container uses">
          <Reveal className="uses__head">
            <p className="kicker">Where it helps</p>
            <h2>Built for curiosity, not surveillance.</h2>
            <p className="uses__note">Facial expressions aren’t the same as feelings. People show emotion differently across cultures and contexts — treat every result as a prompt to reflect, never a verdict about a person.</p>
          </Reveal>
          <ul className="uses__list">
            {USES.map(([t, d], i) => (
              <Reveal as="li" key={t} delay={i * 0.05}>
                <span className="num faint">{String(i + 1).padStart(2, '0')}</span>
                <div><h3>{t}</h3><p>{d}</p></div>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="section cta">
        <div className="container">
          <Reveal className="cta__box">
            <div>
              <h2>Start reading expressions in under a minute.</h2>
              <p className="lead">Free, private and nothing to install.</p>
            </div>
            <div className="cta__btns">
              {user ? (
                <Link to="/emotion-detection" className="btn btn-signal btn-lg">Start a session <FiArrowRight /></Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-signal btn-lg">Create free account <FiArrowRight /></Link>
                  <Link to="/login" className="btn btn-outline btn-lg">Sign in</Link>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
