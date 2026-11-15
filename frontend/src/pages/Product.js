import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { FiArrowRight, FiBarChart2, FiCamera, FiClock, FiDownload, FiImage, FiLock, FiShield } from 'react-icons/fi';
import { emotionMeta } from '../lib/emotions';
import { useDocTitle, useUser } from '../lib/hooks';
import { EmotionBars } from '../components/ui';
import { EASE, Magnetic, SplitReveal } from '../components/fx';
import PageHero from '../components/landing/PageHero';
import { Closing, HowItWorks, Product as ProductPreview, SCORES } from '../components/landing/sections';
import './Home.css';
import './Pages.css';

/** Floating product cards that tilt and separate with the cursor. */
function FloatingStack() {
  const ref = useRef(null);
  const mx = useMotionValue(0); const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18 }); const sy = useSpring(my, { stiffness: 120, damping: 18 });
  const rotY = useTransform(sx, [-1, 1], [-10, 10]); const rotX = useTransform(sy, [-1, 1], [8, -8]);
  const layer = (d) => ({ x: useTransform(sx, [-1, 1], [-d, d]), y: useTransform(sy, [-1, 1], [-d, d]) }); // eslint-disable-line react-hooks/rules-of-hooks
  const l1 = layer(10); const l2 = layer(26); const l3 = layer(44);
  return (
    <div
      ref={ref}
      className="fstack"
      onPointerMove={(e) => { const r = ref.current.getBoundingClientRect(); mx.set(((e.clientX - r.left) / r.width) * 2 - 1); my.set(((e.clientY - r.top) / r.height) * 2 - 1); }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
    >
      <motion.div className="fstack__scene" style={{ rotateX: rotX, rotateY: rotY }}>
        <motion.div className="fcard fcard--main" style={l1}>
          <div className="fcard__head"><span>Right now</span><span className="badge badge-ok"><span className="dot dot-live" />Live</span></div>
          <strong className="fcard__big" style={{ color: 'var(--e-happy)' }}>Happy <span className="num">84%</span></strong>
          <EmotionBars scores={SCORES.happy} compact />
        </motion.div>
        <motion.div className="fcard fcard--timeline" style={l2}>
          <span className="fcard__mini-label">Session · 02:51</span>
          <div className="fcard__strip">{Array.from({ length: 34 }).map((_, i) => <i key={i} style={{ background: emotionMeta(['happy', 'happy', 'neutral', 'surprised', 'happy', 'neutral'][i % 6]).color }} />)}</div>
        </motion.div>
        <motion.div className="fcard fcard--report" style={l3}>
          <FiDownload /><div><strong>Report ready</strong><span>fer-report-happy.png</span></div>
        </motion.div>
        <motion.div className="fcard fcard--chip" style={l3}><FiLock /> 0 frames uploaded</motion.div>
      </motion.div>
    </div>
  );
}

const FEATURES = [
  { icon: FiCamera, t: 'Live sessions', d: 'Readings about three times a second with a face box, timer, running timeline and a save toggle.', v: 'live' },
  { icon: FiImage, t: 'Photo batches', d: 'Drop, paste or link up to twelve photos. A higher-resolution pass finds small and distant faces.', v: 'photos' },
  { icon: FiBarChart2, t: 'Overview dashboard', d: 'Readings over 24 hours, 7 days or all time — stacked by expression, with sessions and distribution.', v: 'chart' },
  { icon: FiClock, t: 'History', d: 'Every saved photo with its full breakdown. Filter by expression, sort, inspect and delete.', v: 'history' },
  { icon: FiDownload, t: 'Reports', d: 'One click exports a clean PNG summary — the photo, the face box and all seven scores.', v: 'report' },
  { icon: FiShield, t: 'Admin console', d: 'Accounts, roles, password resets, an inbox and subscriber list for whoever runs the workspace.', v: 'admin' },
];

function FeatureViz({ v }) {
  if (v === 'live') return <div className="fviz fviz--live"><span className="vf-box" style={{ left: '32%', top: '18%', width: '36%', height: '64%', '--c': 'var(--e-happy)' }}><i /><i /><i /><i /></span></div>;
  if (v === 'photos') return <div className="fviz fviz--photos">{['happy', 'neutral', 'surprised'].map((k, i) => <span key={k} style={{ '--c': emotionMeta(k).color, '--i': i }} />)}</div>;
  if (v === 'chart') return <div className="fviz fviz--chart">{[5, 7, 4, 8, 6, 9, 7].map((h, i) => <span key={i} style={{ '--h': h }}><i style={{ background: 'var(--e-happy)' }} /><i style={{ background: 'var(--e-neutral)' }} /><i style={{ background: 'var(--e-surprised)' }} /></span>)}</div>;
  if (v === 'history') return <div className="fviz fviz--history">{['happy', 'sad', 'neutral', 'surprised', 'happy', 'fear'].map((k, i) => <span key={i} style={{ '--c': emotionMeta(k).color }} />)}</div>;
  if (v === 'report') return <div className="fviz fviz--report"><span /><span /><span className="spectrum" style={{ height: 6 }}>{['happy', 'neutral', 'surprised'].map((k, i) => <span key={k} style={{ '--c': emotionMeta(k).color, flexGrow: [5, 3, 1][i] }} />)}</span></div>;
  return <div className="fviz fviz--admin">{[0, 1, 2].map((i) => <span key={i}><em /><b /></span>)}</div>;
}

export default function Product() {
  useDocTitle('Product');
  const user = useUser();
  return (
    <div className="home page">
      <PageHero
        label="Product"
        title="Everything you need to read expressions. Nothing you don’t."
        muted={[5, 6, 7]}
        lead="Live camera sessions, photo batches, a dashboard that turns readings into trends, and reports you can share — all running on your device."
        actions={(
          <>
            <Magnetic><Link to={user ? '/emotion-detection' : '/signup'} className="btn btn-lg hero__cta-main">{user ? 'Start a session' : 'Create free account'} <FiArrowRight /></Link></Magnetic>
            <Magnetic strength={0.25}><Link to="/#demo" className="btn btn-lg hero__cta-alt">Try the live demo</Link></Magnetic>
          </>
        )}
        visual={<FloatingStack />}
      />
      <HowItWorks />
      <section className="section-tight">
        <div className="container">
          <div className="feat-head">
            <p className="label">Features</p>
            <SplitReveal className="h-xl" text="Six tools. One quiet, fast workspace." muted={[0, 1]} />
          </div>
          <div className="feats">
            {FEATURES.map((f, i) => (
              <motion.article key={f.t} className="feat" initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -10% 0px' }} transition={{ duration: 0.8, ease: EASE, delay: (i % 3) * 0.08 }}>
                <FeatureViz v={f.v} />
                <div className="feat__body">
                  <span className="feat__icon"><f.icon /></span>
                  <h3>{f.t}</h3>
                  <p>{f.d}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      <ProductPreview />
      <Closing user={user} />
    </div>
  );
}
