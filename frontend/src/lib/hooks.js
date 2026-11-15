import { useEffect, useState, useSyncExternalStore } from 'react';
import { getUser } from './auth';

export const useDocTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} · FER` : 'FER — Facial expression recognition in your browser';
  }, [title]);
};

const subscribe = (cb) => {
  window.addEventListener('fer:auth', cb);
  window.addEventListener('storage', cb);
  return () => { window.removeEventListener('fer:auth', cb); window.removeEventListener('storage', cb); };
};
const snapshot = () => localStorage.getItem('user') || '';

/** Current signed-in user, kept in sync across components and tabs. */
export const useUser = () => {
  const raw = useSyncExternalStore(subscribe, snapshot);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return raw ? getUser() : null;
};

export const useMediaQuery = (q) => {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [q]);
  return m;
};
