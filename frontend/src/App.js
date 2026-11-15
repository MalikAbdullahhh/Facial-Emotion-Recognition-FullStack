import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import { AppShell, AnimatedOutlet, RequireAuth, ScrollManager, SiteLayout } from './components/layout';
import Home from './pages/Home';

const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const EmotionDetection = lazy(() => import('./pages/EmotionDetection'));
const ImageAnalyses = lazy(() => import('./pages/ImageAnalyses'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

const Loading = () => (
  <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: 'var(--faint)' }} aria-busy="true">
    <span className="spinner" />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <MotionConfig reducedMotion="user">
          <BrowserRouter>
            <ScrollManager />
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route element={<SiteLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route element={<AnimatedOutlet />}>
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
            </Suspense>
          </BrowserRouter>
        </MotionConfig>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
