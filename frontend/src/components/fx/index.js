import React, { useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useMotionValue, useReducedMotion, useSpring } from 'framer-motion';
import Lenis from 'lenis';

export const EASE = [0.22, 1, 0.36, 1];

/** Lenis smooth scrolling for the public site (disabled for reduced motion and touch). */
export function useSmoothScroll(enabled = true) {
  useEffect(() => {
    if (!enabled) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    if (window.matchMedia('(pointer: coarse)').matches) return undefined;
    const lenis = new Lenis({ duration: 1.1, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    window.__lenis = lenis;
    let raf = 0;
    const tick = (time) => { lenis.raf(time); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); window.__lenis = null; };
  }, [enabled]);
}

export const scrollToEl = (el, offset = -72) => {
  if (!el) return;
  if (window.__lenis) window.__lenis.scrollTo(el, { offset, duration: 1.3 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: 'smooth' });
};

/** Splits text into words that rise out of a mask when scrolled into view. */
export function SplitReveal({ text, as = 'h2', className = '', delay = 0, stagger = 0.045, muted = [] }) {
  const reduce = useReducedMotion();
  const Tag = motion[as];
  const words = text.split(' ');
  return (
    <Tag className={`split ${className}`} initial="hidden" whileInView="show" viewport={{ once: true, margin: '0px 0px -12% 0px' }} transition={{ staggerChildren: stagger, delayChildren: delay }} aria-label={text}>
      {words.map((w, i) => (
        <React.Fragment key={i}>
          <span className="split__mask" aria-hidden="true">
            <motion.span
              className={`split__word ${muted.includes(i) ? 'is-muted' : ''}`}
              variants={reduce ? {} : { hidden: { y: '110%' }, show: { y: '0%', transition: { duration: 0.9, ease: EASE } } }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? ' ' : null}
        </React.Fragment>
      ))}
    </Tag>
  );
}

/** Element that leans towards the cursor. */
export function Magnetic({ children, strength = 0.35, className = '' }) {
  const ref = useRef(null);
  const x = useMotionValue(0); const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  const onMove = (e) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  return (
    <motion.span ref={ref} className={`magnetic ${className}`} style={{ x: sx, y: sy }} onPointerMove={onMove} onPointerLeave={() => { x.set(0); y.set(0); }}>
      {children}
    </motion.span>
  );
}

/** Number that counts up once it scrolls into view. */
export function CountUp({ to, decimals = 0, prefix = '', suffix = '', duration = 1.6, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' });
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (!inView || reduce) return undefined;
    const c = animate(0, to, { duration, ease: EASE, onUpdate: setV });
    return () => c.stop();
  }, [inView, to, duration, reduce]);
  return <span ref={ref} className={className}>{prefix}{Number(v).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

/** The router's current location, provided above animated route trees so curtains can name the destination. */
export const NavLocationContext = React.createContext(null);

// Curtains that mount with the very first page are already "open" — no wipe on initial load.
let booted = false;
export const markBooted = () => { booted = true; };

const PAGE_NAMES = {
  '/': 'Home', '/product': 'Product', '/expressions': 'Expressions', '/privacy': 'Privacy', '/about': 'About', '/contact': 'Contact',
  '/login': 'Sign in', '/signup': 'Create account', '/admin/login': 'Admin', '/dashboard': 'Overview', '/emotion-detection': 'Detect',
  '/image-analyses': 'History', '/profile': 'Account', '/admin/dashboard': 'Admin',
};
const CURVE = [0.76, 0, 0.24, 1];

/** Full-screen curtain: wipes up over the outgoing page, then lifts off the incoming one, naming the destination. */
export function Curtain() {
  const loc = React.useContext(NavLocationContext);
  const name = PAGE_NAMES[loc?.pathname] || 'FER';
  const [first] = React.useState(() => !booted);
  return (
    <motion.div
      className="curtain"
      aria-hidden="true"
      initial={first ? false : { clipPath: 'inset(0% 0% 0% 0%)' }}
      animate={{ clipPath: 'inset(0% 0% 100% 0%)', transition: { duration: 0.7, ease: CURVE, delay: 0.12 } }}
      exit={{ clipPath: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'], transition: { duration: 0.5, ease: CURVE } }}
    >
      <motion.div
        className="curtain__label"
        initial={first ? false : { opacity: 1, y: 0 }}
        animate={{ opacity: 0, y: -24, transition: { duration: 0.45, ease: EASE, delay: 0.05 } }}
        exit={{ opacity: [0, 1], y: [24, 0], transition: { duration: 0.45, ease: EASE, delay: 0.12 } }}
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="9" fill="#17181c" /><rect x="10.3" y="9.6" width="2.6" height="5" rx="1.3" fill="#f4f3ef" /><rect x="19.1" y="9.6" width="2.6" height="5" rx="1.3" fill="#f4f3ef" /><path d="M10.4 20.2c3 3 8.2 3 11.2 0" stroke="#8a97ff" strokeWidth="2.4" strokeLinecap="round" /></svg>
        <span>{name}</span>
      </motion.div>
    </motion.div>
  );
}
