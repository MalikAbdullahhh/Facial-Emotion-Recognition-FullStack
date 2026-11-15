import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiArrowUpRight } from 'react-icons/fi';
import { useDocTitle } from '../lib/hooks';
import { Reveal } from '../components/ui';
import abdullah from '../assets/team/abdullah.jpg';
import farhan from '../assets/team/farhan.jpg';
import './Pages.css';

const PRINCIPLES = [
  ['Private by default', 'If a feature needs a face to leave the device, we don’t build it. Inference happens in the browser, full stop.'],
  ['Honest about limits', 'Expressions are signals, not feelings. We show probabilities, not verdicts, and say so wherever results appear.'],
  ['Fast enough to feel live', 'Small models, careful frame budgets and no network round-trips keep readings at around three per second on a mid-range phone.'],
];

const TIMELINE = [
  ['Prototype', 'A MobileNetV2 classifier fine-tuned on AffectNet, served from a Python API. Accurate, but every frame had to travel to a server.'],
  ['Rethink', 'We moved detection into the browser with TensorFlow.js — a tiny face detector plus an expression network, about 0.5 MB in total.'],
  ['Today', 'A full web app: live sessions, photo analysis, history and reports — with only labels and scores ever stored.'],
];

const STACK = [
  ['Face detection', 'Tiny Face Detector'],
  ['Expression model', 'FaceExpressionNet · 7 classes'],
  ['Runtime', 'TensorFlow.js (WebGL / WASM)'],
  ['App', 'React · Express · MongoDB'],
  ['Hosting', 'Cloudflare Workers'],
];

const TEAM = [
  { name: 'Malik Abdullah', role: 'Machine learning & engineering', img: abdullah, bio: 'Trained the original classifier, designed the on-device pipeline and built the API.', link: 'https://abdullah-malik-portfolio.malikabdullah0120.workers.dev', pos: '50% 30%' },
  { name: 'Malik M. Farhan', role: 'Full-stack development & design', img: farhan, bio: 'Built the web app, the dashboards and the reporting flow, and shaped the product experience.', pos: '50% 25%' },
];

export default function About() {
  useDocTitle('About');
  return (
    <div className="page">
      <section className="page-hero">
        <div className="container page-hero__grid">
          <Reveal>
            <p className="kicker">About FER</p>
            <h1>A small lab project with one firm rule: faces stay on the device.</h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="lead">FER started as a university research project on facial expression recognition. Along the way we decided the most useful thing we could build wasn’t a more accurate model — it was one people could trust with their camera.</p>
          </Reveal>
        </div>
      </section>

      <section className="section page-sec">
        <div className="container">
          <Reveal className="section-head"><p className="kicker">Principles</p><h2>What we hold ourselves to.</h2></Reveal>
          <div className="principles">
            {PRINCIPLES.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.07} className="principle">
                <span className="num faint">{String(i + 1).padStart(2, '0')}</span>
                <h3>{t}</h3>
                <p>{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--sunk page-sec">
        <div className="container split">
          <Reveal>
            <p className="kicker">How we got here</p>
            <h2 className="split__title">From a server model to an in-browser one.</h2>
            <ol className="timeline">
              {TIMELINE.map(([t, d]) => (
                <li key={t}><h3>{t}</h3><p>{d}</p></li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.1} className="card card-pad stack">
            <h3>Under the hood</h3>
            <dl>
              {STACK.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
            </dl>
            <p className="hint">Models are cached by your browser after the first visit, so later sessions start instantly — even on a slow connection.</p>
          </Reveal>
        </div>
      </section>

      <section className="section page-sec" id="team">
        <div className="container">
          <Reveal className="section-head"><p className="kicker">Team</p><h2>Two people, one shared obsession with detail.</h2></Reveal>
          <div className="team">
            {TEAM.map((m, i) => (
              <Reveal key={m.name} delay={i * 0.08} className="member">
                <div className="member__img"><img src={m.img} alt={m.name} loading="lazy" style={{ objectPosition: m.pos }} /></div>
                <div className="member__body">
                  <div>
                    <h3>{m.name}</h3>
                    <p className="member__role">{m.role}</p>
                  </div>
                  <p>{m.bio}</p>
                  {m.link && <a href={m.link} target="_blank" rel="noopener noreferrer" className="link">Portfolio <FiArrowUpRight style={{ display: 'inline', verticalAlign: '-2px' }} /></a>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="section page-sec page-sec--last">
        <div className="container">
          <Reveal className="band">
            <h2>Questions, collaborations or a bug to report?</h2>
            <Link to="/contact" className="btn btn-primary btn-lg">Get in touch <FiArrowRight /></Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
