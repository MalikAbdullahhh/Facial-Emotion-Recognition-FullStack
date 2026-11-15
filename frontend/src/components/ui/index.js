import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiMoon, FiSun, FiX } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext';
import { EMOTIONS, emotionMeta, topEmotion } from '../../lib/emotions';

export const EASE = [0.22, 1, 0.36, 1];

/** Logomark: a face whose smile is drawn in the seven expression colours. */
const SMILE = [
  'M8.95 19.45A7.6 7.6 0 0 0 10.00 21.26',
  'M10.35 21.69A7.6 7.6 0 0 0 11.96 23.04',
  'M12.44 23.31A7.6 7.6 0 0 0 14.41 24.03',
  'M14.95 24.13A7.6 7.6 0 0 0 17.05 24.13',
  'M17.59 24.03A7.6 7.6 0 0 0 19.56 23.31',
  'M20.04 23.04A7.6 7.6 0 0 0 21.65 21.69',
  'M22.00 21.26A7.6 7.6 0 0 0 23.05 19.45',
];
const SMILE_COLORS = ['var(--e-happy)', 'var(--e-neutral)', 'var(--e-surprised)', 'var(--e-sad)', 'var(--e-angry)', 'var(--e-fear)', 'var(--e-disgust)'];

export function LogoMark({ size = 30, className = '', animate = false }) {
  return (
    <svg className={`logo-mark ${animate ? 'is-animated' : ''} ${className}`} width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#0d0e10" />
      <rect className="logo-eye" x="10.3" y="9.6" width="2.6" height="5" rx="1.3" fill="#f4f3ef" />
      <rect className="logo-eye" x="19.1" y="9.6" width="2.6" height="5" rx="1.3" fill="#f4f3ef" />
      {SMILE.map((d, i) => <path key={d} d={d} stroke={SMILE_COLORS[i]} strokeWidth="2.6" style={{ '--i': i }} className="logo-seg" />)}
    </svg>
  );
}

export function Logo({ sub = false }) {
  return (
    <span className="logo">
      <LogoMark />
      <span className="logo-word">FER{sub && <small>Expression lab</small>}</span>
    </span>
  );
}

export function ThemeToggle({ className = 'icon-btn' }) {
  const { theme, toggleTheme } = useTheme();
  const dark = theme === 'dark';
  return (
    <button type="button" className={className} onClick={toggleTheme} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'} title={dark ? 'Light theme' : 'Dark theme'}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={theme} initial={{ rotate: -60, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 60, opacity: 0 }} transition={{ duration: 0.25 }} style={{ display: 'grid' }}>
          {dark ? <FiSun /> : <FiMoon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

/** Scroll-reveal wrapper (once). */
export function Reveal({ children, delay = 0, y = 22, className, as = 'div', ...rest }) {
  const reduce = useReducedMotion();
  const C = motion[as];
  return (
    <C
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -8% 0px' }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      {...rest}
    >
      {children}
    </C>
  );
}

/** Seven horizontal bars, top emotion highlighted. */
export function EmotionBars({ scores = {}, fast = false, compact = false }) {
  const top = topEmotion(scores)?.[0];
  return (
    <div className="ebars" aria-live="polite" style={compact ? { gap: 7 } : undefined}>
      {EMOTIONS.map((e) => {
        const v = scores[e.key] || 0;
        return (
          <div key={e.key} className={`ebar ${top === e.key && v > 0 ? 'is-top' : ''}`} style={{ '--c': e.color }}>
            <span className="ebar-label"><span className="swatch" />{e.label}</span>
            <span className="ebar-track">
              <motion.span className="ebar-fill" initial={false} animate={{ width: `${Math.max(1.5, v * 100)}%` }} transition={{ duration: fast ? 0.3 : 0.8, ease: EASE }} />
            </span>
            <span className="ebar-value">{Math.round(v * 100)}%</span>
          </div>
        );
      })}
    </div>
  );
}

/** Proportional strip of the seven colours. counts: { key: number } */
export function Spectrum({ counts = {}, height }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <div className="spectrum" style={height ? { height } : undefined} role="img" aria-label="Expression distribution">
      {total > 0 && EMOTIONS.filter((e) => counts[e.key] > 0).map((e) => (
        <span key={e.key} style={{ '--c': e.color, flexGrow: counts[e.key] }} title={`${e.label}: ${Math.round((counts[e.key] / total) * 100)}%`} />
      ))}
    </div>
  );
}

/** Face box with viewfinder corners, positioned in % of the frame. */
export function FaceBox({ box, frame, emotion, confidence, mirrored = false }) {
  if (!box || !frame?.w) return null;
  const m = emotionMeta(emotion);
  const x = mirrored ? frame.w - box[2] : box[0];
  const style = {
    left: `${(x / frame.w) * 100}%`,
    top: `${(box[1] / frame.h) * 100}%`,
    width: `${((box[2] - box[0]) / frame.w) * 100}%`,
    height: `${((box[3] - box[1]) / frame.h) * 100}%`,
    '--c': m.color,
  };
  return (
    <div className="vf-box" style={style} aria-hidden="true">
      <i /><i /><i /><i />
      <span className={`vf-tag ${box[1] / frame.h < 0.1 ? 'is-below' : ''}`}>{m.label} <span className="num">{Math.round((confidence || 0) * 100)}%</span></span>
    </div>
  );
}

export function EmotionChip({ emotion, confidence }) {
  const m = emotionMeta(emotion);
  return (
    <span className="badge" style={{ '--c': m.color }}>
      <span className="swatch" />{m.label}{confidence != null && <span className="num faint">{Math.round(confidence * 100)}%</span>}
    </span>
  );
}

function useLockScroll(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
}

export function Drawer({ open, onClose, title, children, footer }) {
  useLockScroll(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside className="drawer" role="dialog" aria-modal="true" aria-label={title} initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.4, ease: EASE }}>
            <div className="drawer-head">
              <h2>{title}</h2>
              <button type="button" className="icon-btn" onClick={onClose} aria-label="Close"><FiX /></button>
            </div>
            <div className="drawer-body">{children}</div>
            {footer && <div className="drawer-head" style={{ borderTop: '1px solid var(--line)', borderBottom: 0 }}>{footer}</div>}
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export function Modal({ open, onClose, title, children }) {
  useLockScroll(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="modal" role="dialog" aria-modal="true" aria-label={title} initial={{ opacity: 0, x: '-50%', y: 'calc(-50% + 16px)', scale: 0.98 }} animate={{ opacity: 1, x: '-50%', y: '-50%', scale: 1 }} exit={{ opacity: 0, x: '-50%', y: 'calc(-50% + 10px)', scale: 0.98 }} transition={{ duration: 0.3, ease: EASE }}>
            {title && <h2>{title}</h2>}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/** Segmented control with a sliding pill. */
export function Segmented({ value, onChange, options, id = 'seg' }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={value === o.value} onClick={() => onChange(o.value)}>
          {value === o.value && <motion.span layoutId={`${id}-pill`} className="seg-pill" transition={{ duration: 0.35, ease: EASE }} />}
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}
