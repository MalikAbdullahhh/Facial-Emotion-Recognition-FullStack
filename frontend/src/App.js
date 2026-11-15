import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { AppShell, AuthGroup, RequireAuth, ScrollManager, SiteLayout } from './components/layout';
import { NavLocationContext, markBooted } from './components/fx';
import { AppSkeleton } from './components/ui/Skeletons';
// Public pages ship in the main bundle so navigation never waits on a download.
import Home from './pages/Home';
import Product from './pages/Product';
import Expressions from './pages/Expressions';
import Privacy from './pages/Privacy';
import About from './pages/About';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminLogin from './pages/AdminLogin';

/** lazy() that renders synchronously once preloaded, so there is no fallback flash. */
function lazyPreload(factory) {
  let mod = null;
  const load = () => factory().then((m) => { mod = m; return m; });
  const Lazy = lazy(load);
  const C = (props) => (mod ? React.createElement(mod.default, props) : React.createElement(Lazy, props));
  C.preload = load;
  return C;
}
const UserDashboard = lazyPreload(() => import('./pages/UserDashboard'));
const EmotionDetection = lazyPreload(() => import('./pages/EmotionDetection'));
const ImageAnalyses = lazyPreload(() => import('./pages/ImageAnalyses'));
const Profile = lazyPreload(() => import('./pages/Profile'));
const AdminDashboard = lazyPreload(() => import('./pages/AdminDashboard'));
const APP_PAGES = [UserDashboard, EmotionDetection, ImageAnalyses, Profile, AdminDashboard];

const groupOf = (p) => {
  if (['/login', '/signup', '/admin/login'].includes(p)) return 'auth';
  if (['/dashboard', '/emotion-detection', '/image-analyses', '/profile', '/admin/dashboard'].includes(p)) return 'app';
  return 'site';
};

function AnimatedRoutes() {
  const location = useLocation();
  const group = groupOf(location.pathname);

  useEffect(() => { const t = setTimeout(markBooted, 50); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const run = () => APP_PAGES.forEach((P) => P.preload().catch(() => {}));
    const id = 'requestIdleCallback' in window ? window.requestIdleCallback(run, { timeout: 2500 }) : setTimeout(run, 1500);
    return () => ('cancelIdleCallback' in window ? window.cancelIdleCallback(id) : clearTimeout(id));
  }, []);

  return (
    <NavLocationContext.Provider value={location}>
      <ScrollManager />
      <Suspense fallback={<AppSkeleton />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={group}>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/product" element={<Product />} />
              <Route path="/expressions" element={<Expressions />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route element={<AuthGroup />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/admin/login" element={<AdminLogin />} />
            </Route>
            <Route element={<RequireAuth><AppShell /></RequireAuth>}>
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/emotion-detection" element={<EmotionDetection />} />
              <Route path="/image-analyses" element={<ImageAnalyses />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route element={<RequireAuth role="admin"><AppShell /></RequireAuth>}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
            </Route>
          </Routes>
        </AnimatePresence>
      </Suspense>
    </NavLocationContext.Provider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </MotionConfig>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
