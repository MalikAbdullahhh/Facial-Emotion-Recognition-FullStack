import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiArrowLeft, FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { EMOTIONS } from '../../lib/emotions';
import { EmotionBars, Logo, ThemeToggle } from '../../components/ui';
import ExpressionFace from '../../components/ui/ExpressionFace';
import './Auth.css';

const CYCLE = ['happy', 'neutral', 'surprised', 'sad'];
const scoresFor = (key) => {
  const base = { happy: 0.03, neutral: 0.06, surprised: 0.02, sad: 0.02, angry: 0.01, fear: 0.01, disgust: 0.01 };
  base[key] = 0.84;
  return base;
};

function ProductPanel({ title, children }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return undefined;
    const id = setInterval(() => setI((n) => (n + 1) % CYCLE.length), 2600);
    return () => clearInterval(id);
  }, [reduce]);
  const key = CYCLE[i];
  const meta = EMOTIONS.find((e) => e.key === key);
  return (
    <aside className="auth-panel" aria-hidden="true">
      <div className="auth-panel__card">
        <div className="auth-panel__stage">
          <div className="auth-panel__face" style={{ color: meta.color }}><ExpressionFace emotion={key} color={meta.color} /></div>
          <span className="auth-panel__tag"><span className="dot dot-live" />Live · on-device</span>
        </div>
        <div className="auth-panel__read">
          <span>Dominant</span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.strong key={key} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} style={{ color: meta.color }}>{meta.label}</motion.strong>
          </AnimatePresence>
        </div>
        <EmotionBars scores={scoresFor(key)} compact />
      </div>
      <div className="auth-panel__copy">
        <h2>{title}</h2>
        {children}
      </div>
    </aside>
  );
}

export default function AuthLayout({ panelTitle, panelText, children }) {
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
          <motion.div className="auth-form" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
            {children}
          </motion.div>
        </div>
        <p className="auth-foot"><FiLock /> Your camera never leaves your device. We only store labels and scores.</p>
      </div>
      <ProductPanel title={panelTitle}><p>{panelText}</p></ProductPanel>
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
