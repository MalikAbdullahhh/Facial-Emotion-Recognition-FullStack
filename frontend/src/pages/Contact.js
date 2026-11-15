import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAlertCircle, FiCheck, FiChevronDown, FiCopy, FiMail, FiSend } from 'react-icons/fi';
import api from '../utils/api';
import { apiError } from '../lib/auth';
import { useDocTitle } from '../lib/hooks';
import { EASE, Reveal } from '../components/ui';
import { Magnetic } from '../components/fx';
import PageHero from '../components/landing/PageHero';
import './Home.css';
import './Pages.css';

const TOPICS = ['General question', 'Bug report', 'Research collaboration', 'Accessibility', 'Privacy'];

const FAQS = [
  ['Is my camera feed uploaded anywhere?', 'No. The detector and expression model run inside your browser tab. Frames are analysed in memory and discarded — they never reach our servers.'],
  ['What do you store if I sign in?', 'For live sessions: the expression label, a confidence score and a timestamp. For photo analyses: the image you chose to save and its result, so you can review it later. You can delete any analysis from History.'],
  ['How accurate is it?', 'It’s reliable for clear, front-facing faces in good light, and less so with strong shadows, side angles, glasses glare or partial faces. Treat results as probabilities, not facts.'],
  ['Which devices are supported?', 'Any recent version of Chrome, Edge, Safari or Firefox on desktop or mobile. Live mode needs a camera; photo mode works everywhere.'],
  ['Can I use FER for research?', 'Yes — get in touch and tell us about your study. We’re happy to talk about consent, data handling and exports.'],
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq">
      {FAQS.map(([q, a], i) => (
        <div key={q} className={`faq__item ${open === i ? 'is-open' : ''}`}>
          <button type="button" aria-expanded={open === i} onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{q}</span><FiChevronDown />
          </button>
          <AnimatePresence initial={false}>
            {open === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} style={{ overflow: 'hidden' }}>
                <p>{a}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

const EMAIL = 'malikabdullah0120@gmail.com';

function EmailCard() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(EMAIL); } catch (e) { /* clipboard blocked */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  return (
    <div className="mailcard">
      <span className="label label--dark">Email directly</span>
      <a className="mailcard__addr" href={`mailto:${EMAIL}`}>
        <span>malikabdullah0120</span><span className="mailcard__domain">@gmail.com</span>
      </a>
      <div className="mailcard__actions">
        <Magnetic><a className="btn btn-lg hero__cta-main" href={`mailto:${EMAIL}?subject=${encodeURIComponent('Hello from the FER website')}`}><FiMail /> Write an email</a></Magnetic>
        <Magnetic strength={0.25}>
          <button type="button" className="btn btn-lg hero__cta-alt" onClick={copy} aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={copied ? 'y' : 'n'} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                {copied ? <><FiCheck /> Copied</> : <><FiCopy /> Copy address</>}
              </motion.span>
            </AnimatePresence>
          </button>
        </Magnetic>
      </div>
      <dl className="mailcard__facts">
        <div><dt>Replies</dt><dd>Within 2 working days</dd></div>
        <div><dt>Based in</dt><dd>Lahore, Pakistan</dd></div>
      </dl>
    </div>
  );
}

export default function Contact() {
  useDocTitle('Contact');
  const [form, setForm] = useState({ name: '', email: '', subject: TOPICS[0], message: '' });
  const [state, setState] = useState({ status: 'idle', error: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'sending', error: '' });
    try {
      await api.post('/contact', form);
      setState({ status: 'sent', error: '' });
    } catch (err) {
      setState({ status: 'idle', error: apiError(err, 'Your message couldn’t be sent. Please try again.') });
    }
  };

  return (
    <div className="home page">
      <PageHero
        label="Contact"
        title="Talk to the person who built it."
        muted={[0, 1]}
        lead="Questions, bugs, research ideas or collaborations — every message gets read, and replies usually go out within two working days."
        visual={<EmailCard />}
      />

      <section className="page-sec contact section-tight">
        <div className="container contact__grid">
          <Reveal className="card card-pad contact__form">
            <AnimatePresence mode="wait" initial={false}>
              {state.status === 'sent' ? (
                <motion.div key="ok" className="contact__done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <span className="contact__done-icon"><FiCheck /></span>
                  <h2>Message sent</h2>
                  <p className="muted">Thanks, {form.name.split(' ')[0] || 'there'}. We’ll reply to <strong>{form.email}</strong> soon.</p>
                  <button type="button" className="btn btn-outline" onClick={() => { setForm({ name: '', email: '', subject: TOPICS[0], message: '' }); setState({ status: 'idle', error: '' }); }}>Send another</button>
                </motion.div>
              ) : (
                <motion.form key="form" onSubmit={submit} className="form-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="field">
                    <span className="field-label">What’s it about?</span>
                    <div className="topics" role="radiogroup" aria-label="Topic">
                      {TOPICS.map((t) => (
                        <button key={t} type="button" role="radio" aria-checked={form.subject === t} className={`topic ${form.subject === t ? 'is-on' : ''}`} onClick={() => setForm((f) => ({ ...f, subject: t }))}>{t}</button>
                      ))}
                    </div>
                  </div>
                  <div className="form-2">
                    <div className="field"><label htmlFor="c-name">Your name</label><input id="c-name" className="input" required value={form.name} onChange={set('name')} autoComplete="name" /></div>
                    <div className="field"><label htmlFor="c-email">Email</label><input id="c-email" type="email" className="input" required value={form.email} onChange={set('email')} autoComplete="email" /></div>
                  </div>
                  <div className="field"><label htmlFor="c-msg">Message</label><textarea id="c-msg" className="input" required minLength={10} value={form.message} onChange={set('message')} placeholder="A few lines about what you need…" /></div>
                  {state.error && <div className="alert alert-error" role="alert"><FiAlertCircle />{state.error}</div>}
                  <button type="submit" className="btn btn-primary btn-lg" disabled={state.status === 'sending'}>
                    {state.status === 'sending' ? <><span className="spinner" />Sending…</> : <>Send message <FiSend /></>}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </Reveal>

          <Reveal delay={0.08} className="contact__side">
            <h2 className="contact__faq-title" style={{ marginTop: 0 }}>Common questions</h2>
            <Faq />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
