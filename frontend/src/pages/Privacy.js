import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiCheck, FiEyeOff, FiToggleLeft, FiTrash2, FiUserX, FiX } from 'react-icons/fi';
import { useDocTitle, useUser } from '../lib/hooks';
import { EASE, Magnetic, SplitReveal } from '../components/fx';
import PageHero from '../components/landing/PageHero';
import { Closing, Compare } from '../components/landing/sections';
import './Home.css';
import './Pages.css';

/** Animated data-flow: frames circulate inside the browser; only a tiny payload leaves. */
function FlowVisual() {
  return (
    <div className="pflow" aria-hidden="true">
      <div className="pflow__box">
        <span className="pflow__box-label">Your browser tab</span>
        {['Camera', 'Detector', 'Model'].map((n, i) => (
          <div key={n} className="pflow__node" style={{ '--i': i }}><span className="num">0{i + 1}</span>{n}</div>
        ))}
        <span className="pflow__loop" />
        {[0, 1, 2, 3].map((i) => <span key={i} className="pflow__pkt" style={{ '--d': `${i * 0.7}s` }} />)}
      </div>
      <div className="pflow__out">
        <span className="pflow__wire"><i /></span>
        <div className="pflow__payload"><span>Leaves the device — only if you’re signed in</span><code className="num">{'{ "emotion": "Happy", "confidence": 0.84 }'}</code></div>
      </div>
    </div>
  );
}

const NEVER = ['Camera video or individual frames', 'Live session images of any kind', 'Face landmarks or face geometry', 'Biometric templates for identification'];
const STORED = ['Live readings: expression label, score, time and session', 'Photo analyses you choose to save, with their result', 'Your name, email and a hashed password', 'Sign-in times, for your own activity history'];
const CONTROLS = [
  { icon: FiUserX, t: 'Use it without an account', d: 'The live demo works signed out. Nothing at all is stored.' },
  { icon: FiToggleLeft, t: 'Switch saving off', d: 'A toggle on the Detect page stops live readings from being recorded.' },
  { icon: FiTrash2, t: 'Delete any analysis', d: 'Remove a saved photo and its result from History in two clicks.' },
];

export default function Privacy() {
  useDocTitle('Privacy');
  const user = useUser();
  return (
    <div className="home page">
      <PageHero
        label="Privacy"
        title="Your face never leaves the tab."
        muted={[0, 1]}
        lead="FER was designed around one constraint: no camera frame, ever, goes to a server. Here’s exactly what runs where, and what — if anything — is kept."
        actions={<Magnetic><Link to="/#demo" className="btn btn-lg hero__cta-main">Try it signed out <FiArrowRight /></Link></Magnetic>}
        visual={<FlowVisual />}
      />
      <Compare />
      <section className="section-tight pstore">
        <div className="container">
          <div className="feat-head">
            <p className="label">What’s kept</p>
            <SplitReveal className="h-xl" text="A short list, and a shorter one." />
          </div>
          <div className="pstore__grid">
            {[{ t: 'Never stored', items: NEVER, icon: FiX, cls: 'is-never' }, { t: 'Stored only when you’re signed in', items: STORED, icon: FiCheck, cls: 'is-stored' }].map((col, ci) => (
              <motion.div key={col.t} className={`pstore__col ${col.cls}`} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE, delay: ci * 0.1 }}>
                <h3>{col.t}</h3>
                <ul>{col.items.map((it, i) => <motion.li key={it} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.07 }}><col.icon />{it}</motion.li>)}</ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <section className="section-tight how" style={{ height: 'auto' }}>
        <div className="container">
          <div className="feat-head">
            <p className="label"><FiEyeOff /> Your controls</p>
            <SplitReveal className="h-xl" text="You decide what’s remembered." muted={[0, 1]} />
          </div>
          <div className="principles">
            {CONTROLS.map((c, i) => (
              <motion.div key={c.t} className="principle pcontrol" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}>
                <span className="feat__icon"><c.icon /></span>
                <h3>{c.t}</h3>
                <p>{c.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <Closing user={user} />
    </div>
  );
}
