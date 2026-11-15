import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { EASE, SplitReveal } from '../fx';
import '../../pages/Pages.css';

/** Dark, compact hero shared by inner marketing pages. Always shorter than the viewport. */
export default function PageHero({ label, title, muted = [], lead, actions, visual, className = '' }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const o = useTransform(scrollYProgress, [0, 0.9], [1, 0.2]);
  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <section ref={ref} className={`phero ${className}`} data-nav-dark onPointerMove={onMove}>
      <div className="phero__spot" aria-hidden="true" />
      <div className="container phero__grid">
        <div className="phero__copy">
          <motion.p className="label label--dark" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}>{label}</motion.p>
          <SplitReveal as="h1" className="phero__title" text={title} muted={muted} delay={0.25} />
          {lead && <motion.p className="phero__lead" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.6 }}>{lead}</motion.p>}
          {actions && <motion.div className="phero__actions" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.75 }}>{actions}</motion.div>}
        </div>
        {visual && <motion.div className="phero__visual" style={reduce ? undefined : { y, opacity: o }} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: EASE, delay: 0.3 }}>{visual}</motion.div>}
      </div>
    </section>
  );
}
