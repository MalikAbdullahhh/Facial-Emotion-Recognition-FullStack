import React, { useEffect, useState } from 'react';
import { Link, NavLink, Navigate, useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FiArrowUpRight, FiCheck, FiCamera, FiClock, FiGrid, FiLogOut, FiMenu, FiShield, FiUser, FiX, FiUsers, FiMail, FiInbox, FiExternalLink } from 'react-icons/fi';
import { Logo, ThemeToggle, EASE } from '../ui';
import { useUser } from '../../lib/hooks';
import { initials, signOut } from '../../lib/auth';
import api from '../../utils/api';
import './layout.css';

/** Keeps the outgoing page rendered while it animates out. */
function Frozen() {
  const outlet = useOutlet();
  const [o] = useState(outlet);
  return o;
}

export function AnimatedOutlet({ className }) {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        className={className}
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
        exit={reduce ? undefined : { opacity: 0, transition: { duration: 0.15 } }}
      >
        <Frozen />
      </motion.div>
    </AnimatePresence>
  );
}

/** Scroll to top (or to #hash) after each navigation. */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const t = setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 220);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => window.scrollTo({ top: 0 }), 160);
    return () => clearTimeout(t);
  }, [pathname, hash]);
  return null;
}

export const homeFor = (user) => (user?.role === 'admin' ? '/admin/dashboard' : '/dashboard');

export function RequireAuth({ children, role }) {
  const user = useUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

/* ── Public site ──────────────────────────────────────────── */
const SITE_LINKS = [
  { to: '/#how', label: 'How it works' },
  { to: '/#privacy', label: 'Privacy' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

function SiteNav() {
  const user = useUser();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const isActive = (to) => !to.includes('#') && pathname === to;

  return (
    <header className={`site-nav ${scrolled || open ? 'is-solid' : ''}`}>
      <div className="container site-nav__in">
        <Link to="/" aria-label="FER home" className="site-nav__brand"><Logo /></Link>
        <nav className="site-nav__links" aria-label="Primary">
          {SITE_LINKS.map((l) => (
            <Link key={l.to} to={l.to} className={isActive(l.to) ? 'is-active' : ''}>{l.label}</Link>
          ))}
        </nav>
        <div className="site-nav__actions">
          <ThemeToggle />
          {user ? (
            <Link to={homeFor(user)} className="btn btn-primary btn-sm site-nav__cta">Open app <FiArrowUpRight /></Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm site-nav__signin">Sign in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm site-nav__cta">Get started</Link>
            </>
          )}
          <button type="button" className="icon-btn site-nav__burger" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            {open ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div className="site-sheet" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: EASE }}>
            <nav className="container site-sheet__links" aria-label="Mobile">
              {[{ to: '/', label: 'Home' }, ...SITE_LINKS].map((l, i) => (
                <motion.div key={l.to} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i + 0.05, duration: 0.4, ease: EASE }}>
                  <Link to={l.to} onClick={() => setOpen(false)}>{l.label}</Link>
                </motion.div>
              ))}
            </nav>
            <div className="container site-sheet__cta">
              {user ? (
                <Link to={homeFor(user)} className="btn btn-primary btn-lg btn-block">Open app <FiArrowUpRight /></Link>
              ) : (
                <>
                  <Link to="/signup" className="btn btn-primary btn-lg btn-block">Create free account</Link>
                  <Link to="/login" className="btn btn-outline btn-lg btn-block">Sign in</Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Updates() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | busy | done | error
  const [msg, setMsg] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setState('busy');
    try {
      await api.post('/newsletter', { email });
      setState('done');
    } catch (err) {
      setMsg(err?.response?.data?.message || 'Couldn’t subscribe right now. Try again later.');
      setState('error');
    }
  };
  if (state === 'done') return <p className="updates__done"><FiCheck /> You’re on the list. We send a short note when something ships.</p>;
  return (
    <form className="updates" onSubmit={submit}>
      <label htmlFor="updates-email">Product updates, a few times a year</label>
      <div className="updates__row">
        <input id="updates-email" type="email" required className="input" placeholder="you@example.com" value={email} onChange={(e) => { setEmail(e.target.value); if (state === 'error') setState('idle'); }} />
        <button type="submit" className="btn btn-primary" disabled={state === 'busy'}>{state === 'busy' ? <span className="spinner" /> : 'Subscribe'}</button>
      </div>
      {state === 'error' && <span className="updates__err">{msg}</span>}
    </form>
  );
}

function SiteFooter() {
  const user = useUser();
  return (
    <footer className="site-foot">
      <div className="container">
        <div className="site-foot__top">
          <div className="site-foot__brand">
            <Logo />
            <p>Facial expression recognition that runs entirely in your browser. Built as an open research project in Lahore.</p>
            <Updates />
          </div>
          <div className="site-foot__cols">
            <div>
              <h4>Product</h4>
              <Link to="/#demo">Live demo</Link>
              <Link to="/#how">How it works</Link>
              <Link to="/#privacy">Privacy</Link>
            </div>
            <div>
              <h4>Project</h4>
              <Link to="/about">About</Link>
              <Link to="/about#team">Team</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <div>
              <h4>Account</h4>
              {user ? <Link to={homeFor(user)}>Open app</Link> : (<><Link to="/login">Sign in</Link><Link to="/signup">Create account</Link></>)}
            </div>
          </div>
        </div>
        <div className="site-foot__bottom">
          <span>© {new Date().getFullYear()} FER</span>
          <span>Designed and built by Malik Abdullah &amp; Malik M. Farhan</span>
        </div>
      </div>
    </footer>
  );
}

export function SiteLayout() {
  return (
    <div className="site">
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteNav />
      <main id="main"><AnimatedOutlet /></main>
      <SiteFooter />
    </div>
  );
}

/* ── App shell ────────────────────────────────────────────── */
const APP_NAV = [
  { to: '/dashboard', label: 'Overview', icon: FiGrid },
  { to: '/emotion-detection', label: 'Detect', icon: FiCamera },
  { to: '/image-analyses', label: 'History', icon: FiClock },
  { to: '/profile', label: 'Account', icon: FiUser },
];
const ADMIN_NAV = [
  { to: '/admin/dashboard', tab: 'overview', label: 'Admin overview', short: 'Admin', icon: FiShield },
  { to: '/admin/dashboard?tab=users', tab: 'users', label: 'Users', icon: FiUsers },
  { to: '/admin/dashboard?tab=messages', tab: 'messages', label: 'Messages', icon: FiMail },
  { to: '/admin/dashboard?tab=subscribers', tab: 'subscribers', label: 'Subscribers', icon: FiInbox },
];

function useActive() {
  const { pathname, search } = useLocation();
  const tab = new URLSearchParams(search).get('tab') || 'overview';
  return (item) => (item.tab ? pathname === '/admin/dashboard' && tab === item.tab : pathname === item.to);
}

export function AppShell() {
  const user = useUser();
  const navigate = useNavigate();
  const active = useActive();
  const isAdmin = user?.role === 'admin';

  const out = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  const mobile = isAdmin ? [ADMIN_NAV[0], ADMIN_NAV[1], APP_NAV[1], APP_NAV[3]] : APP_NAV;

  return (
    <div className="app">
      <a href="#app-main" className="skip-link">Skip to content</a>
      <aside className="app-side">
        <Link to="/" className="app-side__brand" aria-label="FER home"><Logo /></Link>
        <nav className="app-side__nav" aria-label="App">
          {isAdmin && (
            <>
              <span className="app-side__label">Admin</span>
              {ADMIN_NAV.map((n) => (
                <NavLink key={n.to} to={n.to} className={() => `app-link ${active(n) ? 'is-active' : ''}`} end>
                  <n.icon />{n.label}
                </NavLink>
              ))}
              <span className="app-side__label">Workspace</span>
            </>
          )}
          {APP_NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={() => `app-link ${active(n) ? 'is-active' : ''}`}>
              <n.icon />{n.label}
            </NavLink>
          ))}
          <Link to="/" className="app-link app-link--quiet"><FiExternalLink />Public site</Link>
        </nav>
        <div className="app-side__foot">
          <Link to="/profile" className="app-user">
            <span className="avatar">{initials(user?.name)}</span>
            <span className="app-user__meta"><strong>{user?.name}</strong><small>{user?.email}</small></span>
          </Link>
          <div className="app-side__tools">
            <ThemeToggle />
            <button type="button" className="btn btn-ghost btn-sm" onClick={out}><FiLogOut />Sign out</button>
          </div>
        </div>
      </aside>

      <header className="app-top">
        <Link to={homeFor(user)} aria-label="FER home"><Logo /></Link>
        <div className="app-top__tools">
          <ThemeToggle />
          <button type="button" className="icon-btn" onClick={out} aria-label="Sign out"><FiLogOut /></button>
        </div>
      </header>

      <main id="app-main" className="app-main">
        <AnimatedOutlet />
      </main>

      <nav className="app-tabs" aria-label="App">
        {mobile.map((n) => (
          <NavLink key={n.to} to={n.to} className={() => `app-tab ${active(n) ? 'is-active' : ''}`} end>
            <n.icon /><span>{n.short || n.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, description, actions, eyebrow }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <p className="page-head__eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-head__desc">{description}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </div>
  );
}
