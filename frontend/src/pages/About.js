import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiArrowUpRight } from 'react-icons/fi';
import { useDocTitle } from '../lib/hooks';
import { EASE, Magnetic, SplitReveal } from '../components/fx';
import PointFace from '../components/fx/PointFace';
import abdullah from '../assets/team/abdullah.jpg';
import './Home.css';
import './Pages.css';

const PRINCIPLES = [
  ['Private by default', 'If a feature needs a face to leave the device, it doesn’t get built. Inference happens in the browser, full stop.'],
  ['Honest about limits', 'Expressions are signals, not feelings. FER shows probabilities, not verdicts — and says so wherever results appear.'],
  ['Fast enough to feel live', 'Small models, careful frame budgets and no network round-trips keep readings at about three per second on a mid-range phone.'],
];

const TIMELINE = [
  ['Prototype', 'A MobileNetV2 classifier fine-tuned on AffectNet, served from a Python API. Accurate — but every frame had to travel to a server.'],
  ['Rethink', 'Detection moved into the browser with TensorFlow.js: a tiny face detector plus an expression network, about 0.5 MB in total.'],
  ['Today', 'A full product: live sessions, photo batches, history and reports — with only labels and scores ever stored.'],
];

const STACK = [
  ['Face detection', 'Tiny Face Detector'],
  ['Expression model', 'FaceExpressionNet · 7 classes'],
  ['Runtime', 'TensorFlow.js (WebGL / WASM)'],
  ['App', 'React · Express · MongoDB'],
  ['Hosting', 'Cloudflare Workers'],
];

export default function About() {
  useDocTitle('About');
  return (
    <div className="home page">
      <section className="about-hero" data-nav-dark>
        <div className="about-hero__face" aria-hidden="true"><PointFace labels={false} zoom={0.9} /></div>
        <div className="container about-hero__inner">
          <motion.p className="label label--dark" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>About FER</motion.p>
          <SplitReveal as="h1" className="about-hero__title" text="A lab project with one firm rule: faces stay on the device." muted={[0, 1, 2]} delay={0.2} />
          <motion.p className="about-hero__lead" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.7 }}>
            FER began as research into facial expression recognition. Along the way it became clear the most useful thing to build wasn’t a more accurate model — it was one people could trust with their camera.
          </motion.p>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <p className="label">Principles</p>
          <SplitReveal className="h-xl" text="What FER holds itself to." muted={[0, 1]} />
          <div className="principles" style={{ marginTop: 40 }}>
            {PRINCIPLES.map(([t, d], i) => (
              <motion.div key={t} className="principle" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}>
                <span className="num faint">0{i + 1}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight how" style={{ height: 'auto' }}>
        <div className="container split-2">
          <div>
            <p className="label">How it got here</p>
            <SplitReveal className="h-xl" text="From a server model to an in-browser one." muted={[4, 5, 6, 7]} />
            <ol className="timeline">
              {TIMELINE.map(([t, d], i) => (
                <motion.li key={t} initial={{ opacity: 0, x: -14 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease: EASE, delay: i * 0.1 }}><h3>{t}</h3><p>{d}</p></motion.li>
              ))}
            </ol>
          </div>
          <motion.div className="card card-pad stack" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, ease: EASE }}>
            <h3>Under the hood</h3>
            <dl>{STACK.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}</dl>
            <p className="hint">Models are cached by your browser after the first visit, so later sessions start instantly — even on a slow connection.</p>
          </motion.div>
        </div>
      </section>

      <section className="section-tight" id="team">
        <div className="container founder">
          <motion.div className="founder__img" initial={{ clipPath: 'inset(12% 12% 12% 12% round 28px)', opacity: 0.4 }} whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 28px)', opacity: 1 }} viewport={{ once: true, margin: '0px 0px -15% 0px' }} transition={{ duration: 1.2, ease: EASE }}>
            <img src={abdullah} alt="Malik Abdullah" loading="lazy" />
          </motion.div>
          <div className="founder__body">
            <p className="label">Built by</p>
            <SplitReveal className="h-xl" text="Malik Abdullah" />
            <p className="founder__role">Machine learning, engineering & design</p>
            <p className="founder__bio">Malik trained the original expression classifier, designed the on-device pipeline, and built FER end to end — the model integration, the API, the dashboards and the reporting flow.</p>
            <Magnetic strength={0.25}>
              <a href="https://abdullah-malik-portfolio.malikabdullah0120.workers.dev" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-lg">View portfolio <FiArrowUpRight /></a>
            </Magnetic>
          </div>
        </div>
      </section>

      <section className="closing closing--compact" data-nav-dark>
        <div className="container closing__row" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
          <SplitReveal className="h-xl" text="Questions, collaborations or a bug to report?" />
          <Magnetic><Link to="/contact" className="btn btn-lg hero__cta-main">Get in touch <FiArrowRight /></Link></Magnetic>
        </div>
      </section>
    </div>
  );
}
