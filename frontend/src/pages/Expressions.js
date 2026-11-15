import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiInfo } from 'react-icons/fi';
import { EMOTIONS } from '../lib/emotions';
import { useDocTitle, useUser } from '../lib/hooks';
import ExpressionFace from '../components/ui/ExpressionFace';
import PointFace, { ACTION_UNITS } from '../components/fx/PointFace';
import { EASE, Magnetic, SplitReveal } from '../components/fx';
import PageHero from '../components/landing/PageHero';
import { Closing, Wheel } from '../components/landing/sections';
import './Home.css';
import './Pages.css';

const DETAIL = {
  happy: 'The most reliably detected expression. A genuine (Duchenne) smile also lifts the cheeks and narrows the eyes — a polite smile mostly moves the mouth.',
  neutral: 'Not an absence of emotion — just no strong muscle signal. Most real-world frames land here, which is why it often dominates a session.',
  surprised: 'Brief by nature: true surprise rarely lasts more than a second before turning into another expression.',
  sad: 'Subtle and easily confused with neutral. The inner corners of the brows are the clearest tell.',
  angry: 'Concentrated in the brows and lips. Concentration and squinting into light can look similar.',
  fear: 'Shares raised brows and wide eyes with surprise; the tension around the lips is what separates them.',
  disgust: 'Centred on the nose and upper lip. Often appears as a quick, one-sided flicker.',
};

function ExpressionCard({ e, i }) {
  const [on, setOn] = useState(false);
  return (
    <motion.article
      className={`xcard ${on ? 'is-on' : ''}`}
      style={{ '--c': e.color }}
      onMouseEnter={() => setOn(true)}
      onMouseLeave={() => setOn(false)}
      onFocus={() => setOn(true)}
      onBlur={() => setOn(false)}
      tabIndex={0}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      onViewportEnter={() => { if (window.matchMedia('(hover: none)').matches) setTimeout(() => setOn(true), 400); }}
      viewport={{ once: true, margin: '0px 0px -12% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay: (i % 3) * 0.07 }}
    >
      <div className="xcard__face"><ExpressionFace emotion={on ? e.key : 'neutral'} color={e.color} /></div>
      <div className="xcard__body">
        <div className="xcard__top"><span className="num faint">0{i + 1}</span><span className="xcard__hint">{on ? 'Showing' : 'Hover to animate'}</span></div>
        <h3>{e.label}</h3>
        <p className="xcard__cue">{e.cue}</p>
        <p className="xcard__detail">{DETAIL[e.key]}</p>
        <ul className="xcard__aus">
          {(ACTION_UNITS[e.key] || []).length ? ACTION_UNITS[e.key].map(([c, n]) => <li key={c}><span className="num">{c}</span>{n}</li>) : <li><span className="num">—</span>Baseline</li>}
        </ul>
      </div>
    </motion.article>
  );
}

export default function Expressions() {
  useDocTitle('Expressions');
  const user = useUser();
  return (
    <div className="home page">
      <PageHero
        label="The seven expressions"
        title="Seven expressions. Dozens of muscles. One quick read."
        muted={[2, 3, 4]}
        lead="FER scores the seven expressions recognised across cultures in emotion research. Each one is a pattern of facial action units — here’s what the model is actually looking at."
        actions={<Magnetic><Link to="/#demo" className="btn btn-lg hero__cta-main">Make each face <FiArrowRight /></Link></Magnetic>}
        visual={<div className="phero__face"><PointFace labels interval={2600} zoom={0.92} /></div>}
      />
      <Wheel />
      <section className="section-tight">
        <div className="container">
          <div className="feat-head">
            <p className="label">Up close</p>
            <SplitReveal className="h-xl" text="What each expression looks like — and how it fools you." muted={[5, 6, 7, 8]} />
          </div>
          <div className="xgrid">
            {EMOTIONS.map((e, i) => <ExpressionCard key={e.key} e={e} i={i} />)}
            <motion.article className="xcard xcard--note" initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE }}>
              <FiInfo />
              <h3>Expressions aren’t feelings</h3>
              <p>People smile when they’re nervous and stay neutral when they’re delighted. Culture, context and neurodiversity all change how emotion shows on a face. Read FER’s output as a description of a face, never a verdict about a person.</p>
              <Link to="/privacy" className="more-link"><span>How FER handles your data</span><span className="more-link__icon"><FiArrowRight /></span></Link>
            </motion.article>
          </div>
        </div>
      </section>
      <Closing user={user} />
    </div>
  );
}
