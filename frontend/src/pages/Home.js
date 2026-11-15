import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion';
import { FiArrowDown, FiArrowRight, FiArrowUpRight, FiCamera, FiCheck, FiClock, FiDownload, FiGrid, FiImage, FiLock, FiSquare, FiUpload, FiZap } from 'react-icons/fi';
import { EMOTIONS, emotionMeta, topEmotion } from '../lib/emotions';
import useFaceCamera, { analyseImage } from '../lib/useFaceCamera';
import { useDocTitle, useUser } from '../lib/hooks';
import { EmotionBars, FaceBox, LogoMark } from '../components/ui';
import PointFace, { ACTION_UNITS } from '../components/fx/PointFace';
import { CountUp, EASE, Magnetic, scrollToEl, SplitReveal } from '../components/fx';
import { homeFor } from '../components/layout';
import './Home.css';

const WORDS = { happy: 'smile', surprised: 'gasp', neutral: 'poker face', sad: 'frown', angry: 'scowl', fear: 'flinch', disgust: 'sneer' };
const SCORES = {
  happy: { happy: 0.84, neutral: 0.09, surprised: 0.04, sad: 0.01, angry: 0.01, fear: 0.005, disgust: 0.005 },
  surprised: { happy: 0.06, neutral: 0.08, surprised: 0.79, sad: 0.01, angry: 0.01, fear: 0.04, disgust: 0.01 },
  neutral: { happy: 0.08, neutral: 0.81, surprised: 0.03, sad: 0.05, angry: 0.02, fear: 0.005, disgust: 0.005 },
  sad: { happy: 0.02, neutral: 0.19, surprised: 0.01, sad: 0.71, angry: 0.03, fear: 0.03, disgust: 0.01 },
  angry: { happy: 0.01, neutral: 0.12, surprised: 0.02, sad: 0.05, angry: 0.74, fear: 0.02, disgust: 0.04 },
  fear: { happy: 0.01, neutral: 0.08, surprised: 0.16, sad: 0.06, angry: 0.02, fear: 0.66, disgust: 0.01 },
  disgust: { happy: 0.02, neutral: 0.1, surprised: 0.01, sad: 0.06, angry: 0.09, fear: 0.01, disgust: 0.71 },
};

/* ── Hero ───────────────────────────────────────────────── */
function Hero({ user }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [emo, setEmo] = useState('happy');
  const meta = emotionMeta(emo);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const faceScale = useTransform(scrollYProgress, [0, 1], [1, 0.82]);
  const faceOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const top = Math.round((SCORES[emo][emo] || 0) * 100);

  return (
    <section className="hero" ref={ref} data-nav-dark style={{ '--emo': meta.dark }}>
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__grid-lines" aria-hidden="true" />
      <motion.div className="hero__face" style={reduce ? undefined : { scale: faceScale, opacity: faceOpacity }}>
        <PointFace onEmotion={setEmo} />
      </motion.div>

      <motion.div className="container hero__inner" style={reduce ? undefined : { y: copyY }}>
        <div className="hero__copy">
          <motion.p className="hero__eyebrow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}>
            <span className="dot dot-live" /> On-device expression AI
          </motion.p>
          <h1 className="hero__title">
            <span className="hero__line"><motion.span initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.25 }}>Read every</motion.span></span>
            <span className="hero__line hero__line--word">
              <AnimatePresence initial={false}>
                <motion.span key={emo} className="hero__word" style={{ color: meta.dark }} initial={{ y: '105%' }} animate={{ y: '0%' }} exit={{ y: '-105%' }} transition={{ duration: 0.7, ease: EASE }}>
                  {WORDS[emo]}.
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
          <motion.p className="hero__lead" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}>
            FER reads seven facial expressions from your camera or photos — live, in the browser. Not a single frame is uploaded.
          </motion.p>
          <motion.div className="hero__ctas" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.62 }}>
            <Magnetic>
              <button type="button" className="btn btn-lg hero__cta-main" onClick={() => scrollToEl(document.getElementById('demo'))}>
                <FiCamera /> Try it on your face
              </button>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Link to={user ? homeFor(user) : '/signup'} className="btn btn-lg hero__cta-alt">{user ? 'Open your dashboard' : 'Create free account'} <FiArrowRight /></Link>
            </Magnetic>
          </motion.div>
        </div>
      </motion.div>

      <motion.div className="hero__reading" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.9 }} aria-hidden="true">
        <span className="hero__reading-label">Live reading</span>
        <span className="hero__reading-row">
          <AnimatePresence mode="wait" initial={false}>
            <motion.strong key={emo} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }} style={{ color: meta.dark }}>{meta.label}</motion.strong>
          </AnimatePresence>
          <span className="num">{top}%</span>
        </span>
        <span className="hero__reading-bar"><motion.i animate={{ width: `${top}%`, backgroundColor: meta.dark }} transition={{ duration: 0.8, ease: EASE }} /></span>
      </motion.div>

      <div className="container hero__foot">
        <ul className="hero__stats">
          <li><strong className="num">7</strong><span>expressions per frame</span></li>
          <li><strong className="num">~3/s</strong><span>live readings</span></li>
          <li><strong className="num">0</strong><span>frames uploaded</span></li>
        </ul>
        <button type="button" className="hero__scroll" onClick={() => scrollToEl(document.getElementById('signal'), 0)}>
          <span>Scroll to explore</span>
          <span className="hero__scroll-line"><i /></span>
        </button>
      </div>
    </section>
  );
}

/* ── Kinetic word strip (scroll-linked) ─────────────────── */
function Strip() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x1 = useTransform(scrollYProgress, [0, 1], ['0%', '-28%']);
  const x2 = useTransform(scrollYProgress, [0, 1], ['-28%', '0%']);
  const row = [...EMOTIONS, ...EMOTIONS, ...EMOTIONS];
  return (
    <section className="strip" ref={ref} id="signal" data-nav-dark aria-hidden="true">
      <motion.div className="strip__row" style={{ x: x1 }}>
        {row.map((e, i) => <span key={i} style={{ '--c': e.dark }}>{WORDS[e.key]}<i /></span>)}
      </motion.div>
      <motion.div className="strip__row strip__row--ghost" style={{ x: x2 }}>
        {row.map((e, i) => <span key={i} style={{ '--c': e.dark }}>{e.label}<i /></span>)}
      </motion.div>
    </section>
  );
}

/* ── Cloud vs on-device ─────────────────────────────────── */
const COMPARE = [
  { k: 'Network round-trip', note: 'Per reading, typical cloud vision API', was: '~400 ms', to: 0, suffix: ' ms' },
  { k: 'Frames uploaded', note: 'Per minute of live camera', was: '180', to: 0, suffix: '' },
  { k: 'Cost per 1,000 readings', note: 'Pay-per-image face APIs', was: '$1.00', to: 0, prefix: '$', decimals: 2 },
];

function Compare() {
  return (
    <section className="compare section-tight" id="privacy">
      <div className="container">
        <div className="compare__head">
          <div>
            <p className="label"><FiLock /> Privacy by architecture</p>
            <SplitReveal className="h-xl" text="The fastest server is no server at all." muted={[0, 1, 2, 3]} />
          </div>
          <p className="compare__intro">The detector and expression model download once (about half a megabyte) and run on your own hardware with TensorFlow.js. Frames are analysed in memory and discarded.</p>
        </div>
        <ul className="compare__rows">
          {COMPARE.map((r, i) => (
            <motion.li key={r.k} className="compare__row" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -10% 0px' }} transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}>
              <span className="compare__n num">0{i + 1}</span>
              <div className="compare__what"><strong>{r.k}</strong><span>{r.note}</span></div>
              <span className="compare__was num">{r.was}</span>
              <span className="compare__to num"><CountUp to={r.to} prefix={r.prefix} suffix={r.suffix} decimals={r.decimals} /></span>
              <span className="compare__tag">with FER</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── How it works (pinned on desktop) ───────────────────── */
const STEPS = [
  { t: 'Locate', d: 'A tiny face detector finds the face in each frame and crops it — in a few milliseconds, entirely on your device.' },
  { t: 'Read', d: 'A compact neural network scores all seven expressions at once. The highest probability becomes the reading.' },
  { t: 'Remember', d: 'Signed in, each reading is saved as a label and a score — never an image — so sessions become trends you can review.' },
];

function StepVisual({ step }) {
  return (
    <div className="hv">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="0" className="hv__frame" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.5, ease: EASE }}>
            <svg viewBox="0 0 200 200" className="hv__head" aria-hidden="true">
              <ellipse cx="100" cy="104" rx="58" ry="74" />
              {[[78, 92], [122, 92], [100, 116], [84, 138], [116, 138], [100, 146], [64, 84], [136, 84], [100, 60]].map(([x, y], i) => (
                <motion.circle key={i} cx={x} cy={y} r="2.6" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.06 }} />
              ))}
            </svg>
            <motion.div className="vf-box" style={{ '--c': '#8a97ff' }} initial={{ left: '8%', top: '6%', width: '84%', height: '88%' }} animate={{ left: '28%', top: '14%', width: '44%', height: '74%' }} transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}>
              <i /><i /><i /><i /><span className="vf-tag">Face · 0.98</span>
            </motion.div>
            <span className="hv__chip num">bbox [142, 61, 318, 287]</span>
          </motion.div>
        )}
        {step === 1 && (
          <motion.div key="1" className="hv__card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5, ease: EASE }}>
            <div className="hv__card-head"><span>Dominant expression</span><strong style={{ color: 'var(--e-happy)' }}>Happy <span className="num">84%</span></strong></div>
            <EmotionBars scores={SCORES.happy} />
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="2" className="hv__card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.5, ease: EASE }}>
            <div className="hv__card-head"><span>Session · 2m 51s · 171 readings</span><strong>Mostly happy</strong></div>
            <div className="hv__timeline">
              {Array.from({ length: 48 }).map((_, i) => {
                const k = ['happy', 'happy', 'neutral', 'happy', 'surprised', 'happy', 'neutral', 'neutral'][i % 8];
                return <motion.span key={i} style={{ background: emotionMeta(k).color }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.015, duration: 0.5, ease: EASE }} />;
              })}
            </div>
            <code className="hv__payload num">{'{ emotion: "Happy", confidence: 0.84, t: 12:04:31 }'}</code>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HowItWorks() {
  const ref = useRef(null);
  const [step, setStep] = useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  useMotionValueEvent(scrollYProgress, 'change', (v) => setStep(Math.min(2, Math.floor(v * 3))));
  return (
    <section className="how" ref={ref} id="how">
      <div className="how__sticky">
        <div className="container how__grid">
          <div className="how__copy">
            <p className="label">How it works</p>
            <h2 className="h-xl">Three passes. <span className="is-muted">Under a third of a second.</span></h2>
            <ol className="how__steps">
              {STEPS.map((s, i) => (
                <li key={s.t} className={i === step ? 'is-active' : ''}>
                  <button type="button" onClick={() => { const el = ref.current; const top = el.getBoundingClientRect().top + window.scrollY + (el.offsetHeight - window.innerHeight) * (i / 3 + 0.12); if (window.__lenis) window.__lenis.scrollTo(top); else window.scrollTo({ top, behavior: 'smooth' }); }}>
                    <span className="num how__n">0{i + 1}</span>
                    <span className="how__t">{s.t}</span>
                  </button>
                  <AnimatePresence initial={false}>
                    {i === step && (
                      <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: EASE }}>{s.d}</motion.p>
                    )}
                  </AnimatePresence>
                </li>
              ))}
            </ol>
            <div className="how__progress"><motion.i style={{ scaleX: progress }} /></div>
          </div>
          <StepVisual step={step} />
        </div>
      </div>
    </section>
  );
}

/* ── Expression wheel ───────────────────────────────────── */
function Wheel() {
  const [emo, setEmo] = useState('happy');
  const [locked, setLocked] = useState(false);
  const meta = emotionMeta(emo);
  const aus = ACTION_UNITS[emo];
  const n = EMOTIONS.length;
  const R = typeof window !== 'undefined' && window.innerWidth < 600 ? 39 : 47;
  return (
    <section className="wheel section-tight" data-nav-dark id="expressions" style={{ '--c': meta.dark }}>
      <div className="container wheel__grid">
        <div className="wheel__copy">
          <p className="label label--dark">The seven expressions</p>
          <SplitReveal className="h-xl" text="Every expression is a set of muscles. Here are the ones it reads." muted={[4, 5, 6, 7]} />
          <AnimatePresence mode="wait">
            <motion.div key={emo} className="wheel__info" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE }}>
              <h3 style={{ color: meta.dark }}>{meta.label}</h3>
              <p>{meta.cue}</p>
              <ul className="wheel__aus">
                {aus.length ? aus.map(([code, name]) => <li key={code}><span className="num">{code}</span>{name}</li>) : <li><span className="num">—</span>Relaxed baseline, no dominant action units</li>}
              </ul>
            </motion.div>
          </AnimatePresence>
          <p className="wheel__hint">{locked ? 'Hover another expression, or ' : 'Cycling automatically — hover any expression to inspect it.'}{locked && <button type="button" className="wheel__resume" onClick={() => setLocked(false)}>resume the cycle</button>}</p>
        </div>
        <div className="wheel__stage">
          <div className="wheel__ring" aria-hidden="true" />
          <div className="wheel__face">
            <PointFace emotion={emo} auto={!locked} onEmotion={(k) => !locked && setEmo(k)} labels={false} interval={2600} zoom={0.95} />
          </div>
          <div className="wheel__labels" role="tablist" aria-label="Expressions">
            {EMOTIONS.map((e, i) => {
              const a = (i / n) * Math.PI * 2 - Math.PI / 2;
              return (
                <button
                  key={e.key}
                  type="button"
                  role="tab"
                  aria-selected={emo === e.key}
                  className={`wheel__label ${emo === e.key ? 'is-on' : ''}`}
                  style={{ '--x': `${50 + Math.cos(a) * R}%`, '--y': `${50 + Math.sin(a) * R}%`, '--lc': e.dark }}
                  onMouseEnter={() => { setLocked(true); setEmo(e.key); }}
                  onFocus={() => { setLocked(true); setEmo(e.key); }}
                  onClick={() => { setLocked(true); setEmo(e.key); }}
                >
                  <span className="swatch" />{e.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Live demo ──────────────────────────────────────────── */
function LiveDemo() {
  const reduce = useReducedMotion();
  const fileRef = useRef(null);
  const [scores, setScores] = useState(SCORES.happy);
  const [reading, setReading] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoState, setPhotoState] = useState(null);
  const [hint, setHint] = useState('');
  const cam = useFaceCamera({ onResult: (r) => { if (r.ok) { setScores(r.scores); setReading(r); setHint(''); } else { setReading(null); setHint('Looking for a face…'); } } });
  const live = cam.status === 'live';
  const mode = photo ? 'photo' : live ? 'live' : cam.status === 'starting' ? 'starting' : 'preview';
  const [pv, setPv] = useState('happy');

  useEffect(() => {
    if (mode !== 'preview' || reduce) return undefined;
    const keys = ['happy', 'neutral', 'surprised', 'sad'];
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % keys.length; setPv(keys[i]); setScores(SCORES[keys[i]]); }, 2400);
    return () => clearInterval(id);
  }, [mode, reduce]);

  const start = () => { setPhoto(null); setPhotoState(null); cam.start(); };
  const stop = () => { cam.stop(); setReading(null); setHint(''); setScores(SCORES.happy); };
  const onFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    cam.stop(); setReading(null);
    const url = URL.createObjectURL(file);
    setPhoto(url); setPhotoState({ busy: true });
    const r = await analyseImage(url);
    if (r.ok) { setScores(r.scores); setPhotoState({ frame: r.frame, box: r.box, emotion: r.emotion, confidence: r.confidence }); } else setPhotoState({ frame: r.frame, error: r.error });
  };
  const top = topEmotion(scores);
  const meta = emotionMeta(top?.[0]);
  const ratio = mode === 'photo' && photoState?.frame ? photoState.frame.w / photoState.frame.h : mode === 'live' ? cam.frame.w / cam.frame.h : 4 / 3;

  return (
    <div className="demo">
      <div className="demo__bar">
        <span className={`demo__status ${live ? 'is-live' : ''}`}><span className={`dot ${live ? 'dot-live' : ''}`} />{live ? 'Live' : mode === 'photo' ? 'Photo' : mode === 'starting' ? 'Starting camera' : 'Preview'}</span>
        <span className="demo__meta num">{live && reading ? `${Math.round(reading.ms)} ms · on-device` : 'on-device · 0 uploads'}</span>
      </div>
      <div className="demo__stage" style={{ aspectRatio: String(ratio), maxWidth: ratio < 1 ? `calc(380px * ${ratio})` : undefined }}>
        <video ref={cam.videoRef} className={`demo__video ${live ? 'is-on' : ''}`} playsInline muted />
        {photo && <img src={photo} alt="Your upload" className="demo__photo" />}
        {mode === 'preview' && <div className="demo__idle"><PointFace emotion={pv} auto={false} labels={false} zoom={0.9} /></div>}
        {mode === 'starting' && <div className="demo__idle demo__scan"><span className="demo__scan-line" /><span className="demo__msg-inline">Waking the camera and model…</span></div>}
        {live && reading && <FaceBox box={reading.box} frame={cam.frame} emotion={reading.emotion} confidence={reading.confidence} />}
        {mode === 'photo' && photoState?.box && <FaceBox box={photoState.box} frame={photoState.frame} emotion={photoState.emotion} confidence={photoState.confidence} />}
        {mode === 'photo' && photoState?.busy && <div className="demo__idle demo__scan demo__scan--over"><span className="demo__scan-line" /></div>}
        {hint && live && <div className="demo__toast">{hint}</div>}
        {photoState?.error && <div className="demo__toast is-warn">{photoState.error}</div>}
        {cam.error && <div className="demo__toast is-warn">{cam.error}</div>}
      </div>
      <div className="demo__readout">
        <div>
          <span className="demo__label">Dominant expression</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.strong key={top?.[0]} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} style={{ color: meta.color }}>{meta.label}</motion.strong>
          </AnimatePresence>
        </div>
        <span className="demo__conf num">{Math.round((top?.[1] || 0) * 100)}<small>%</small></span>
      </div>
      <EmotionBars scores={scores} fast={live} compact />
      <div className="demo__actions">
        {live ? <button type="button" className="btn btn-primary" onClick={stop}><FiSquare /> Stop</button>
          : <button type="button" className="btn btn-primary" onClick={start} disabled={mode === 'starting'}><FiCamera /> {mode === 'starting' ? 'Starting…' : 'Use my camera'}</button>}
        {mode === 'photo' ? <button type="button" className="btn btn-outline" onClick={() => { setPhoto(null); setPhotoState(null); setScores(SCORES.happy); }}>Clear photo</button>
          : <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()}><FiUpload /> Try a photo</button>}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
    </div>
  );
}

function DemoSection() {
  return (
    <section className="try section-tight" id="demo">
      <div className="container try__grid">
        <div className="try__copy">
          <p className="label">Live demo</p>
          <SplitReveal className="h-xl" text="Your turn. Make a face." muted={[0, 1]} />
          <p className="try__lead">Allow the camera and the readout follows you in real time. Prefer not to? Drop in a photo instead — it never leaves this tab either.</p>
          <ul className="try__list">
            <li><FiZap /> About three readings a second on a mid-range phone</li>
            <li><FiLock /> Nothing is recorded or uploaded without an account</li>
            <li><FiCheck /> Works in Chrome, Safari, Edge and Firefox</li>
          </ul>
        </div>
        <motion.div initial={{ opacity: 0, y: 40, rotate: 1.5 }} whileInView={{ opacity: 1, y: 0, rotate: 0 }} viewport={{ once: true, margin: '0px 0px -15% 0px' }} transition={{ duration: 1, ease: EASE }}>
          <LiveDemo />
        </motion.div>
      </div>
    </section>
  );
}

/* ── Product preview (tilts flat on scroll) ─────────────── */
function Product() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const rotateX = useTransform(scrollYProgress, [0, 1], [32, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.86, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [60, 0]);
  const bars = [[5, 3, 1, 1], [3, 4, 2, 0], [6, 2, 1, 1], [4, 3, 3, 1], [7, 2, 1, 0], [5, 4, 1, 2], [6, 3, 2, 1]];
  const keys = ['happy', 'neutral', 'surprised', 'sad'];
  return (
    <section className="product section-tight" data-nav-dark ref={ref}>
      <div className="container">
        <div className="product__head">
          <p className="label label--dark">With a free account</p>
          <SplitReveal className="h-xl" text="Your expressions, on the record." muted={[2, 3, 4]} />
        </div>
        <div className="product__stage">
          <motion.div className="mock" style={reduce ? undefined : { rotateX, scale, y }}>
            <div className="mock__side">
              <span className="mock__brand"><LogoMark size={20} /> FER</span>
              {[['Overview', FiGrid], ['Detect', FiCamera], ['History', FiClock]].map(([l, I], i) => <span key={l} className={`mock__nav ${i === 0 ? 'is-on' : ''}`}><I />{l}</span>)}
            </div>
            <div className="mock__main">
              <div className="mock__title"><span>Good evening</span><strong>Ayesha’s overview</strong></div>
              <div className="mock__kpis">
                {[['Live readings', '1,967'], ['Sessions', '16'], ['Photos', '24'], ['Most frequent', 'Happy']].map(([l, v], i) => (
                  <div key={l}><span>{l}</span><strong className={i < 3 ? 'num' : ''} style={i === 3 ? { color: 'var(--e-happy)' } : undefined}>{v}</strong></div>
                ))}
              </div>
              <div className="mock__row">
                <div className="mock__chart">
                  {bars.map((b, i) => (
                    <span key={i} className="mock__col">
                      {b.map((v, j) => <i key={j} style={{ flexGrow: v, background: emotionMeta(keys[j]).color }} />)}
                    </span>
                  ))}
                </div>
                <div className="mock__dist">
                  {keys.map((k, i) => <span key={k}><em style={{ background: emotionMeta(k).color }} />{emotionMeta(k).label}<b className="num">{[39, 37, 16, 4][i]}%</b></span>)}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        <ul className="product__feats">
          {[[FiZap, 'Live sessions', 'Timed, charted and saved as labels and scores.'], [FiImage, 'Photo batches', 'Analyse up to twelve photos at once and compare them.'], [FiDownload, 'Reports', 'Export a clean, shareable summary of any analysis.']].map(([I, t, d], i) => (
            <motion.li key={t} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}>
              <I /><div><strong>{t}</strong><span>{d}</span></div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ── Use cases with cursor-follow preview ───────────────── */
const USES = [
  { t: 'UX research', d: 'See where testers light up or frown during a prototype walkthrough — with their consent.', k: ['happy', 'neutral', 'surprised'] },
  { t: 'Presentation practice', d: 'Rehearse a talk and check whether your face says what your words do.', k: ['neutral', 'happy', 'surprised'] },
  { t: 'Classrooms & workshops', d: 'Show how expressions are measured, live, without sending anyone’s face to a server.', k: ['surprised', 'happy', 'fear'] },
  { t: 'Personal reflection', d: 'Notice how your expressions shift across a week. A mirror, not a diagnosis.', k: ['neutral', 'sad', 'happy'] },
];

function Uses() {
  const [hover, setHover] = useState(-1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const listRef = useRef(null);
  return (
    <section className="uses section-tight">
      <div className="container uses__grid">
        <div className="uses__head">
          <p className="label">Where it helps</p>
          <SplitReveal className="h-xl" text="Built for curiosity, not surveillance." muted={[3, 4]} />
          <p className="uses__note">Facial expressions aren’t the same as feelings. People show emotion differently across cultures and contexts — treat every result as a prompt to reflect, never a verdict about a person.</p>
        </div>
        <ul className="uses__list" ref={listRef} onMouseMove={(e) => { const r = listRef.current.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }} onMouseLeave={() => setHover(-1)}>
          {USES.map((u, i) => (
            <motion.li key={u.t} onMouseEnter={() => setHover(i)} className={hover === i ? 'is-on' : hover >= 0 ? 'is-dim' : ''} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE, delay: i * 0.06 }}>
              <span className="num uses__n">0{i + 1}</span>
              <div><h3>{u.t}</h3><p>{u.d}</p></div>
              <FiArrowUpRight className="uses__arrow" />
            </motion.li>
          ))}
          <AnimatePresence>
            {hover >= 0 && (
              <motion.div className="uses__float" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1, x: pos.x + 24, y: pos.y - 60 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.6 }} aria-hidden="true">
                <span className="uses__float-label">{USES[hover].t}</span>
                <span className="spectrum" style={{ height: 8 }}>{USES[hover].k.map((k, j) => <span key={k} style={{ '--c': emotionMeta(k).color, flexGrow: [5, 3, 2][j] }} />)}</span>
                <span className="uses__float-row">{USES[hover].k.map((k) => <em key={k} style={{ color: emotionMeta(k).color }}>{emotionMeta(k).label}</em>)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}

/* ── Closing CTA ────────────────────────────────────────── */
function Closing({ user }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], ['-6%', '0%']);
  return (
    <section className="closing" data-nav-dark ref={ref}>
      <div className="container">
        <motion.h2 className="closing__title" style={{ x }}>
          Make a face<span className="closing__dot"><LogoMark size={96} animate /></span>
        </motion.h2>
        <div className="closing__row">
          <p>Free, private and nothing to install. Your first reading is about ten seconds away.</p>
          <div className="closing__btns">
            <Magnetic><Link to={user ? '/emotion-detection' : '/signup'} className="btn btn-lg hero__cta-main">{user ? 'Start a session' : 'Create free account'} <FiArrowRight /></Link></Magnetic>
            <Magnetic strength={0.25}><button type="button" className="btn btn-lg hero__cta-alt" onClick={() => scrollToEl(document.getElementById('demo'))}>Try the demo <FiArrowDown /></button></Magnetic>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  useDocTitle();
  const user = useUser();
  return (
    <div className="home">
      <Hero user={user} />
      <Strip />
      <Compare />
      <HowItWorks />
      <Wheel />
      <DemoSection />
      <Product />
      <Uses />
      <Closing user={user} />
    </div>
  );
}
