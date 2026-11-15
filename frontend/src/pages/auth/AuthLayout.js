import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowLeft, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { emotionMeta } from '../../lib/emotions';
import { Logo, ThemeToggle } from '../../components/ui';
import PointFace from '../../components/fx/PointFace';
import { EASE, SplitReveal } from '../../components/fx';
import './Auth.css';

const WORDS = { happy: 'smile', surprised: 'gasp', neutral: 'poker face', sad: 'frown', angry: 'scowl', fear: 'flinch', disgust: 'sneer' };

function Panel({ title, text }) {
  const [emo, setEmo] = useState('happy');
  const meta = emotionMeta(emo);
  return (
    <aside className="auth-panel" style={{ '--emo': meta.dark }} aria-hidden="true">
      <div className="auth-panel__glow" />
      <div className="auth-panel__face"><PointFace onEmotion={setEmo} labels={false} interval={2800} zoom={0.95} /></div>
      <motion.div className="auth-panel__reading" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.5 }}>
        <span><span className="auth-panel__dot" />Live reading</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.strong key={emo} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} style={{ color: meta.dark }}>{meta.label}</motion.strong>
        </AnimatePresence>
      </motion.div>
      <div className="auth-panel__copy">
        <h2>{title} <span className="auth-panel__word" style={{ color: meta.dark }}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={emo} initial={{ opacity: 0, y: '40%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '-40%' }} transition={{ duration: 0.35, ease: EASE }}>{WORDS[emo]}.</motion.span>
          </AnimatePresence>
        </span></h2>
        <p>{text}</p>
        <ul className="auth-panel__facts">
          <li><strong className="num">0</strong><span>frames uploaded</span></li>
          <li><strong className="num">7</strong><span>expressions</span></li>
          <li><strong className="num">~3/s</strong><span>live readings</span></li>
        </ul>
      </div>
    </aside>
  );
}

export default function AuthLayout({ heading, sub, panelTitle = 'Every', panelText, children }) {
  return (
    <div className="auth">
      <div className="auth-main">
        <header className="auth-top">
          <Link to="/" aria-label="FER home"><Logo /></Link>
          <div className="auth-top__tools">
            <Link to="/" className="btn btn-ghost btn-sm"><FiArrowLeft /> Home</Link>
            <ThemeToggle />
          </div>
        </header>
        <div className="auth-body">
          <div className="auth-form">
            {heading && <SplitReveal as="h1" text={heading} delay={0.15} />}
            {sub && <motion.p className="auth-sub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }}>{sub}</motion.p>}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}>
              {children}
            </motion.div>
          </div>
        </div>
        <p className="auth-foot"><FiLock /> Your camera never leaves your device. Only labels and scores are stored.</p>
      </div>
      <Panel title={panelTitle} text={panelText} />
    </div>
  );
}

export function PasswordInput({ id, value, onChange, autoComplete = 'current-password', ...rest }) {
  const [show, setShow] = useState(false);
  return (
    <div className="input-wrap">
      <input id={id} className="input" type={show ? 'text' : 'password'} value={value} onChange={onChange} autoComplete={autoComplete} {...rest} />
      <button type="button" className="input-action" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? <FiEyeOff /> : <FiEye />}
      </button>
    </div>
  );
}
