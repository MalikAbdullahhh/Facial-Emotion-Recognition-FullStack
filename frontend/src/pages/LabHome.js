import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { FiArrowUpRight, FiCamera, FiCpu, FiEyeOff, FiImage, FiLock, FiTrendingUp, FiUpload, FiZap } from 'react-icons/fi';
import { predictEmotion, checkPythonApiHealth } from '../utils/pythonApi';
import './LabHome.css';

const EASE = [0.22, 1, 0.36, 1];
const EMOTIONS = [
  { key: 'happy', label: 'Happy', note: 'Raised cheeks, lip corners pulled up.' },
  { key: 'neutral', label: 'Neutral', note: 'Relaxed muscles, no strong signal.' },
  { key: 'surprised', label: 'Surprised', note: 'Lifted brows, open eyes and mouth.' },
  { key: 'sad', label: 'Sad', note: 'Inner brows raised, lip corners down.' },
  { key: 'angry', label: 'Angry', note: 'Lowered brows, pressed lips.' },
  { key: 'fear', label: 'Fear', note: 'Raised, drawn-together brows; tense lips.' },
  { key: 'disgust', label: 'Disgust', note: 'Wrinkled nose, raised upper lip.' },
];

/** Scripted preview shown before the visitor starts their camera. */
const PREVIEW = [
  { happy: 0.82, neutral: 0.11, surprised: 0.04, sad: 0.01, angry: 0.01, fear: 0.005, disgust: 0.005 },
  { happy: 0.18, neutral: 0.71, surprised: 0.05, sad: 0.03, angry: 0.02, fear: 0.005, disgust: 0.005 },
  { happy: 0.08, neutral: 0.12, surprised: 0.74, sad: 0.01, angry: 0.01, fear: 0.03, disgust: 0.01 },
  { happy: 0.03, neutral: 0.22, surprised: 0.02, sad: 0.66, angry: 0.03, fear: 0.03, disgust: 0.01 },
];

function Reveal({ children, delay = 0, className }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

function Bars({ scores, live }) {
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]?.[0];
  return (
    <div className="lab-bars" aria-live="polite">
      {EMOTIONS.map((e) => {
        const v = scores[e.key] || 0;
        return (
          <div key={e.key} className={`lab-bar ${top === e.key ? 'is-top' : ''}`}>
            <span className="lab-bar__label">{e.label}</span>
            <span className="lab-bar__track">
              <motion.span className="lab-bar__fill" animate={{ width: `${Math.max(2, v * 100)}%` }} transition={{ duration: live ? 0.35 : 0.9, ease: EASE }} />
            </span>
            <span className="lab-bar__value">{Math.round(v * 100)}%</span>
          </div>
        );
      })}
    </div>
  );
}

/** Live demo: camera or photo, analysed entirely in the browser. */
function LiveDemo() {
  const reduce = useReducedMotion();
  const videoRef = useRef(null);
  const loopRef = useRef(null);
  const fileRef = useRef(null);
  const [mode, setMode] = useState('preview'); // preview | loading | camera | photo | error
  const [scores, setScores] = useState(PREVIEW[0]);
  const [box, setBox] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [frame, setFrame] = useState({ w: 1, h: 1 });

  // Scripted preview cycle
  useEffect(() => {
    if (mode !== 'preview' || reduce) return undefined;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % PREVIEW.length;
      setScores(PREVIEW[i]);
    }, 2200);
    return () => clearInterval(id);
  }, [mode, reduce]);

  const stopCamera = useCallback(() => {
    clearTimeout(loopRef.current);
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const analyseFrame = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) {
      loopRef.current = setTimeout(analyseFrame, 300);
      return;
    }
    const c = document.createElement('canvas');
    c.width = 480;
    c.height = Math.round((v.videoHeight / v.videoWidth) * 480);
    const ctx = c.getContext('2d');
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const r = await predictEmotion(c.toDataURL('image/jpeg', 0.7));
    setFrame({ w: c.width, h: c.height });
    if (r.success) {
      setScores(r.all_emotions);
      setBox(r.bbox);
      setMessage('');
    } else {
      setBox(null);
      setMessage(r.error);
    }
    loopRef.current = setTimeout(analyseFrame, 350);
  }, []);

  const startCamera = async () => {
    setMode('loading');
    setMessage('Loading the on-device model…');
    try {
      const [stream] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 } }, audio: false }),
        checkPythonApiHealth(),
      ]);
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setPhoto(null);
      setMode('camera');
      setMessage('');
      analyseFrame();
    } catch (e) {
      setMode('error');
      setMessage(e?.name === 'NotAllowedError' ? 'Camera permission was blocked. Try uploading a photo instead.' : 'Camera unavailable on this device. Try uploading a photo.');
    }
  };

  const onPhoto = async (file) => {
    if (!file) return;
    stopCamera();
    const url = URL.createObjectURL(file);
    setPhoto(url);
    setBox(null);
    setMode('loading');
    setMessage('Analysing on your device…');
    const img = new Image();
    img.onload = async () => {
      setFrame({ w: img.naturalWidth, h: img.naturalHeight });
      const r = await predictEmotion(url);
      if (r.success) {
        setScores(r.all_emotions);
        setBox(r.bbox);
        setMessage('');
      } else {
        setMessage(r.error);
      }
      setMode('photo');
    };
    img.src = url;
  };

  const stop = () => {
    stopCamera();
    setMode('preview');
    setBox(null);
    setPhoto(null);
    setMessage('');
  };

  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  const live = mode === 'camera' || mode === 'photo';
  const boxStyle = box
    ? { left: `${(box[0] / frame.w) * 100}%`, top: `${(box[1] / frame.h) * 100}%`, width: `${((box[2] - box[0]) / frame.w) * 100}%`, height: `${((box[3] - box[1]) / frame.h) * 100}%` }
    : null;

  return (
    <div className="lab-demo">
      <div className="lab-demo__head">
        <span className="lab-dot" data-live={live} />
        <span>{live ? 'Live · on-device' : 'Preview · press start'}</span>
        <span className="lab-mono lab-demo__engine">TF.js · 0 uploads</span>
      </div>

      <div className="lab-demo__stage" style={live && frame.w > 1 ? { aspectRatio: `${frame.w} / ${frame.h}` } : undefined}>
        <video ref={videoRef} className={`lab-demo__video ${mode === 'camera' ? 'is-on' : ''}`} playsInline muted />
        {photo && <img src={photo} alt="Your upload" className="lab-demo__photo" />}
        {!live && mode !== 'loading' && (
          <svg className="lab-face" viewBox="0 0 200 220" aria-hidden>
            <ellipse cx="100" cy="108" rx="62" ry="80" />
            <path d="M68 92 q12 -8 24 0" />
            <path d="M108 92 q12 -8 24 0" />
            <circle cx="80" cy="104" r="4" />
            <circle cx="120" cy="104" r="4" />
            <path d="M100 112 l-6 22 h12" />
            <path d="M80 152 q20 16 40 0" />
            {[[60, 70], [140, 70], [100, 40], [52, 120], [148, 120], [100, 182], [72, 170], [128, 170]].map(([x, y], i) => (
              <circle key={i} className="lab-face__pt" cx={x} cy={y} r="2.2" style={{ animationDelay: `${i * 0.18}s` }} />
            ))}
          </svg>
        )}
        {!live && !reduce && <span className="lab-scan" aria-hidden />}
        {boxStyle && (
          <motion.div className="lab-box" style={boxStyle} layout transition={{ duration: 0.25 }}>
            <span className="lab-mono">{top?.[0]} · {Math.round((top?.[1] || 0) * 100)}%</span>
          </motion.div>
        )}
        {message && <div className="lab-demo__msg">{message}</div>}
      </div>

      <div className="lab-demo__readout">
        <div>
          <span className="lab-mono lab-muted">Dominant expression</span>
          <motion.strong key={top?.[0]} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }}>
            {EMOTIONS.find((e) => e.key === top?.[0])?.label || '—'}
          </motion.strong>
        </div>
        <span className="lab-mono lab-demo__conf">{Math.round((top?.[1] || 0) * 100)}%</span>
      </div>
      <Bars scores={scores} live={live} />

      <div className="lab-demo__actions">
        {mode === 'camera' ? (
          <button type="button" className="lab-btn lab-btn--ink" onClick={stop}>Stop camera</button>
        ) : (
          <button type="button" className="lab-btn lab-btn--ink" onClick={startCamera} disabled={mode === 'loading'}>
            <FiCamera /> {mode === 'loading' ? 'Starting…' : 'Try it on your face'}
          </button>
        )}
        <button type="button" className="lab-btn lab-btn--line" onClick={() => fileRef.current?.click()}>
          <FiUpload /> Upload a photo
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPhoto(e.target.files?.[0])} />
      </div>
    </div>
  );
}

const STEPS = [
  { icon: FiEyeOff, t: 'Find the face', d: 'A lightweight detector locates the face in each frame — on your device, in milliseconds.' },
  { icon: FiCpu, t: 'Read seven expressions', d: 'A compact neural network scores happy, neutral, surprised, sad, angry, fear and disgust.' },
  { icon: FiTrendingUp, t: 'See patterns over time', d: 'Sign in to save sessions, compare photos and export a clear report of how expressions changed.' },
];

const USES = [
  { t: 'UX & product research', d: 'See where testers light up or frown during a prototype walkthrough — with their consent.' },
  { t: 'Presentation practice', d: 'Rehearse a talk and check whether your face says what your words do.' },
  { t: 'Classrooms & workshops', d: 'Teach how facial expressions work, live, without sending anyone’s face to a server.' },
  { t: 'Personal journaling', d: 'Track how your expressions shift across the week. A mirror, not a diagnosis.' },
];

export default function LabHome() {
  return (
    <div className="lab">
      <section className="lab-hero">
        <div className="lab-grid" aria-hidden />
        <div className="lab-wrap lab-hero__inner">
          <div className="lab-hero__copy">
            <Reveal><span className="lab-eyebrow"><FiZap /> Facial expression recognition · in your browser</span></Reveal>
            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }}>
              Read the room.<br /><em>In real time.</em>
            </motion.h1>
            <Reveal delay={0.15}>
              <p className="lab-lead">
                FER detects seven facial expressions from a camera or photo — instantly, privately and entirely on your device. Nothing you show it is ever uploaded.
              </p>
            </Reveal>
            <Reveal delay={0.25} className="lab-hero__ctas">
              <Link to="/signup" className="lab-btn lab-btn--ink">Create free account <FiArrowUpRight /></Link>
              <Link to="/about" className="lab-btn lab-btn--line">How it works</Link>
            </Reveal>
          </div>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}>
            <LiveDemo />
          </motion.div>
        </div>
      </section>

      <section className="lab-facts">
        <div className="lab-wrap lab-facts__row">
          {[['7', 'expressions scored per frame'], ['0', 'images sent to any server'], ['~0.5 MB', 'model, cached after first use'], ['~3/s', 'live updates on a mid-range phone']].map(([n, l]) => (
            <Reveal key={l} className="lab-fact"><strong>{n}</strong><span>{l}</span></Reveal>
          ))}
        </div>
      </section>

      <section className="lab-section">
        <div className="lab-wrap">
          <Reveal><span className="lab-eyebrow">How it works</span></Reveal>
          <Reveal><h2>Three steps, <em>zero uploads.</em></h2></Reveal>
          <div className="lab-steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.t} delay={i * 0.08} className="lab-card lab-step">
                <span className="lab-mono lab-step__n">0{i + 1}</span>
                <s.icon className="lab-step__icon" />
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="lab-section lab-section--tint">
        <div className="lab-wrap">
          <Reveal><span className="lab-eyebrow">The seven expressions</span></Reveal>
          <Reveal><h2>What the model <em>looks for.</em></h2></Reveal>
          <div className="lab-emotions">
            {EMOTIONS.map((e, i) => (
              <Reveal key={e.key} delay={(i % 4) * 0.06} className="lab-card lab-emotion">
                <span className="lab-mono lab-muted">0{i + 1}</span>
                <h3>{e.label}</h3>
                <p>{e.note}</p>
              </Reveal>
            ))}
            <Reveal delay={0.2} className="lab-card lab-emotion lab-emotion--cta">
              <h3>Try all seven</h3>
              <p>Make each face at the camera and watch the bars move.</p>
              <a href="#top" onClick={(ev) => { ev.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="lab-link">Back to the demo <FiArrowUpRight /></a>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="lab-section lab-dark">
        <div className="lab-wrap lab-privacy">
          <div>
            <Reveal><span className="lab-eyebrow"><FiLock /> Privacy by architecture</span></Reveal>
            <Reveal><h2>Your face never <em>leaves your browser.</em></h2></Reveal>
            <Reveal delay={0.1}>
              <p className="lab-lead">
                Detection runs with TensorFlow.js inside the page. Camera frames and photos are analysed in memory and discarded. If you sign in, only the result — an expression label and score — is saved to your history.
              </p>
            </Reveal>
          </div>
          <Reveal delay={0.15} className="lab-privacy__flow">
            {[['Camera / photo', 'stays on device'], ['Face detector', 'runs locally'], ['Expression model', 'runs locally'], ['Your history', 'label + score only']].map(([a, b], i) => (
              <div key={a} className="lab-flow">
                <span className="lab-mono">0{i + 1}</span>
                <strong>{a}</strong>
                <span className="lab-flow__tag">{b}</span>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="lab-section">
        <div className="lab-wrap">
          <Reveal><span className="lab-eyebrow">Where it helps</span></Reveal>
          <Reveal><h2>Built for curiosity, <em>not surveillance.</em></h2></Reveal>
          <div className="lab-uses">
            {USES.map((u, i) => (
              <Reveal key={u.t} delay={i * 0.06} className="lab-card lab-use">
                <h3>{u.t}</h3>
                <p>{u.d}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="lab-note">
            <FiImage />
            <p><strong>An honest note.</strong> Facial expressions are not the same as feelings. People express emotion differently across cultures, contexts and conditions. Treat results as a signal to reflect on — never as a judgement about a person.</p>
          </Reveal>
        </div>
      </section>

      <section className="lab-cta">
        <div className="lab-wrap">
          <Reveal><h2>Save sessions. <em>See your patterns.</em></h2></Reveal>
          <Reveal delay={0.1}><p className="lab-lead">A free account keeps your history, image analyses and downloadable reports in one place.</p></Reveal>
          <Reveal delay={0.2} className="lab-hero__ctas lab-cta__btns">
            <Link to="/signup" className="lab-btn lab-btn--accent">Create free account <FiArrowUpRight /></Link>
            <Link to="/login" className="lab-btn lab-btn--line-light">Sign in</Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
