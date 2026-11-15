import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { FiArrowRight, FiCamera, FiMousePointer } from 'react-icons/fi';
import { EMOTIONS, emotionMeta } from '../lib/emotions';
import { useDocTitle, useUser } from '../lib/hooks';
import PointFace from '../components/fx/PointFace';
import { EASE, Magnetic, scrollToEl } from '../components/fx';
import { homeFor } from '../components/layout';
import { Closing, Compare, DemoSection, Product, SCORES, Strip, Uses, Wheel, WORDS } from '../components/landing/sections';
import './Home.css';

const ORDER = ['happy', 'surprised', 'neutral', 'sad', 'angry', 'fear', 'disgust'];

/** Types a line once, after an optional delay. */
function TypeLine({ text, start = 0, speed = 52, enabled = true, onDone }) {
  const [n, setN] = useState(enabled ? 0 : text.length);
  useEffect(() => {
    if (!enabled) return undefined;
    let i = 0; let id;
    const t = setTimeout(() => {
      id = setInterval(() => {
        i += 1; setN(i);
        if (i >= text.length) { clearInterval(id); onDone?.(); }
      }, speed);
    }, start);
    return () => { clearTimeout(t); clearInterval(id); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return <>{text.slice(0, n)}{n < text.length && <span className="caret" aria-hidden="true" />}</>;
}

/** Deletes the previous word and types the next one, terminal-style. */
function TypeWord({ word, ready }) {
  const [shown, setShown] = useState(ready ? word : '');
  const target = useRef(word);
  useEffect(() => {
    if (!ready) return undefined;
    target.current = word;
    let id;
    const step = () => {
      setShown((cur) => {
        const t = target.current;
        if (t.startsWith(cur) && cur.length < t.length) { id = setTimeout(step, 58); return t.slice(0, cur.length + 1); }
        if (!t.startsWith(cur)) { id = setTimeout(step, 26); return cur.slice(0, -1); }
        return cur;
      });
    };
    id = setTimeout(step, 30);
    return () => clearTimeout(id);
  }, [word, ready]);
  if (!ready) return null;
  return <>{shown}<span className="caret caret--word" aria-hidden="true" /></>;
}

function FrameCounter() {
  const ref = useRef(null);
  useEffect(() => {
    let f = 18240 + Math.floor(Math.random() * 900);
    const id = setInterval(() => { f += 3; if (ref.current) ref.current.textContent = f.toLocaleString(); }, 100);
    return () => clearInterval(id);
  }, []);
  return <span ref={ref} className="num">18,240</span>;
}

function Hero({ user }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const [first] = useState(() => {
    try {
      const v = !sessionStorage.getItem('fer-intro');
      sessionStorage.setItem('fer-intro', '1');
      return v && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch (e) { return false; }
  });
  const [emo, setEmo] = useState('happy');
  const [typed, setTyped] = useState(!first);
  const paused = useRef(0);
  const meta = emotionMeta(emo);
  const base = first ? 1 : 0; // seconds offset for the first-visit intro choreography
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const faceScale = useTransform(scrollYProgress, [0, 1], [1, 0.84]);
  const faceOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const top = Math.round((SCORES[emo][emo] || 0) * 100);

  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => {
      if (Date.now() < paused.current) return;
      setEmo((e) => ORDER[(ORDER.indexOf(e) + 1) % ORDER.length]);
    }, 3400);
    return () => clearInterval(id);
  }, [reduce]);

  const pick = (k) => { setEmo(k); paused.current = Date.now() + 9000; };
  const next = () => pick(ORDER[(ORDER.indexOf(emo) + 1) % ORDER.length]);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  const fade = (d) => ({ initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, ease: EASE, delay: d } });

  return (
    <section className="hero" ref={ref} data-nav-dark style={{ '--emo': meta.dark }} onPointerMove={onMove}>
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__spot" aria-hidden="true" />
      <div className="hero__grid-lines" aria-hidden="true" />

      <motion.div className="hero__face" style={reduce ? undefined : { scale: faceScale, opacity: faceOpacity }}>
        <button type="button" className="hero__face-hit" onClick={next} aria-label={`Showing ${meta.label}. Show the next expression`}>
          <PointFace emotion={emo} auto={false} intro={first} />
        </button>
        <motion.div className="hero__vf" aria-hidden="true" {...fade(base * 1.4 + 0.5)}>
          <i /><i /><i /><i />
          <span className="hero__vf-tl">REC · <FrameCounter /></span>
          <span className="hero__vf-br num">NETWORK 0 B · TF.js</span>
        </motion.div>
        <motion.span className="hero__hint" aria-hidden="true" {...fade(base * 1.8 + 0.8)}><FiMousePointer /> Click the face</motion.span>
      </motion.div>

      <motion.div className="container hero__inner" style={reduce ? undefined : { y: copyY }}>
        <div className="hero__copy">
          <motion.p className="hero__eyebrow" {...fade(base * 0.3 + 0.1)}>
            <span className="dot dot-live" /> On-device expression AI
          </motion.p>
          <h1 className="hero__title" aria-label={`Read every ${WORDS[emo]}.`}>
            <span className="hero__line" aria-hidden="true"><TypeLine text="Read every" start={650} enabled={first} onDone={() => setTyped(true)} /></span>
            <span className="hero__line hero__line--word" aria-hidden="true" style={{ color: meta.dark }}>
              <TypeWord word={`${WORDS[emo]}.`} ready={typed} />
            </span>
          </h1>
          <motion.p className="hero__lead" {...fade(base * 1.2 + 0.3)}>
            FER reads seven facial expressions from your camera or photos — live, in the browser. Not a single frame is uploaded.
          </motion.p>
          <motion.div className="hero__ctas" {...fade(base * 1.35 + 0.4)}>
            <Magnetic>
              <button type="button" className="btn btn-lg hero__cta-main" onClick={() => scrollToEl(document.getElementById('demo'))}><FiCamera /> Try it on your face</button>
            </Magnetic>
            <Magnetic strength={0.25}>
              <Link to={user ? homeFor(user) : '/signup'} className="btn btn-lg hero__cta-alt">{user ? 'Open your dashboard' : 'Create free account'} <FiArrowRight /></Link>
            </Magnetic>
          </motion.div>
          <motion.div className="dock" role="tablist" aria-label="Preview an expression" {...fade(base * 1.5 + 0.5)}>
            {EMOTIONS.map((e) => (
              <button key={e.key} type="button" role="tab" aria-selected={emo === e.key} className={`dock__item ${emo === e.key ? 'is-on' : ''}`} style={{ '--c': e.dark }} onMouseEnter={() => pick(e.key)} onFocus={() => pick(e.key)} onClick={() => pick(e.key)}>
                <span className="dock__dot" />
                <span className="dock__label">{e.label}</span>
              </button>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <motion.div className="hero__reading" aria-hidden="true" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.9, ease: EASE, delay: base * 1.6 + 0.5 }}>
        <span className="hero__reading-label">Live reading</span>
        <span className="hero__reading-row">
          <AnimatePresence mode="wait" initial={false}>
            <motion.strong key={emo} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} style={{ color: meta.dark }}>{meta.label}</motion.strong>
          </AnimatePresence>
          <span className="num">{top}%</span>
        </span>
        <span className="hero__reading-mini">
          {EMOTIONS.map((e) => <motion.i key={e.key} animate={{ height: `${Math.max(6, (SCORES[emo][e.key] || 0) * 100)}%`, opacity: e.key === emo ? 1 : 0.35 }} transition={{ duration: 0.6, ease: EASE }} style={{ background: e.dark }} />)}
        </span>
      </motion.div>

      <motion.div className="container hero__foot" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: base * 1.8 + 0.6 }}>
        <ul className="hero__stats">
          <li><strong className="num">7</strong><span>expressions per frame</span></li>
          <li><strong className="num">~3/s</strong><span>live readings</span></li>
          <li><strong className="num">0</strong><span>frames uploaded</span></li>
        </ul>
        <button type="button" className="hero__scroll" onClick={() => scrollToEl(document.getElementById('signal'), 0)}>
          <span>Scroll to explore</span>
          <span className="hero__scroll-line"><i /></span>
        </button>
      </motion.div>
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
      <Compare more={{ to: '/privacy', label: 'How FER protects your privacy' }} />
      <Wheel more={{ to: '/expressions', label: 'Explore all seven expressions' }} />
      <DemoSection />
      <Product more={{ to: '/product', label: 'See everything in the product' }} />
      <Uses />
      <Closing user={user} />
    </div>
  );
}
