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

/** Full-screen curtain that wipes over the outgoing page and off the incoming one. */
export function Curtain() {
  return (
    <>
      <motion.div
        className="curtain"
        initial={{ scaleY: 1, transformOrigin: '50% 0%' }}
        animate={{ scaleY: 0, transformOrigin: '50% 0%', transition: { duration: 0.75, ease: [0.76, 0, 0.24, 1], delay: 0.05 } }}
        exit={{ scaleY: 1, transformOrigin: '50% 100%', transition: { duration: 0.55, ease: [0.76, 0, 0.24, 1] } }}
        aria-hidden="true"
      />
    </>
  );
}
