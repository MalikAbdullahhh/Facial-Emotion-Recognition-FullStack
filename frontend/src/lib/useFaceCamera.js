import { useCallback, useEffect, useRef, useState } from 'react';
import { predictEmotion, checkPythonApiHealth } from '../utils/pythonApi';
import { normaliseScores } from './emotions';

/**
 * Webcam + on-device expression model.
 * One detection runs at a time (ref-guarded), results arrive via onResult.
 */
export default function useFaceCamera({ onResult, interval = 320, width = 480 } = {}) {
  const videoRef = useRef(null);
  const timer = useRef(null);
  const running = useRef(false);
  const cb = useRef(onResult);
  cb.current = onResult;
  const [status, setStatus] = useState('idle'); // idle | starting | live | error
  const [error, setError] = useState('');
  const [frame, setFrame] = useState({ w: 4, h: 3 });

  const stop = useCallback(() => {
    running.current = false;
    clearTimeout(timer.current);
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus((s) => (s === 'error' ? s : 'idle'));
  }, []);

  useEffect(() => () => {
    running.current = false;
    clearTimeout(timer.current);
    const stream = videoRef.current?.srcObject; // eslint-disable-line react-hooks/exhaustive-deps
    if (stream) stream.getTracks().forEach((t) => t.stop());
  }, []);

  const tick = useCallback(async () => {
    if (!running.current) return;
    const v = videoRef.current;
    if (!v || !v.videoWidth) { timer.current = setTimeout(tick, 200); return; }
    const c = document.createElement('canvas');
    c.width = width;
    c.height = Math.round((v.videoHeight / v.videoWidth) * width);
    const ctx = c.getContext('2d');
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, c.width, c.height);
    const started = performance.now();
    const r = await predictEmotion(c.toDataURL('image/jpeg', 0.75));
    if (!running.current) return;
    setFrame((f) => (f.w === c.width && f.h === c.height ? f : { w: c.width, h: c.height }));
    cb.current?.(r.success
      ? { ok: true, emotion: r.emotion, confidence: r.confidence, scores: normaliseScores(r.all_emotions), box: r.bbox, ms: performance.now() - started }
      : { ok: false, error: r.error });
    timer.current = setTimeout(tick, Math.max(60, interval - (performance.now() - started)));
  }, [interval, width]);

  const start = useCallback(async () => {
    setError('');
    setStatus('starting');
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('unsupported'), { name: 'NotSupportedError' });
      const [stream, health] = await Promise.all([
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 960 }, height: { ideal: 720 } }, audio: false }),
        checkPythonApiHealth(),
      ]);
      if (!health) { stream.getTracks().forEach((t) => t.stop()); throw Object.assign(new Error('model'), { name: 'ModelError' }); }
      const v = videoRef.current;
      v.srcObject = stream;
      v.muted = true;
      v.setAttribute('playsinline', '');
      await v.play();
      running.current = true;
      setStatus('live');
      tick();
    } catch (e) {
      setStatus('error');
      setError(
        e?.name === 'NotAllowedError' ? 'Camera access was blocked. Allow it in your browser’s site settings, or analyse a photo instead.'
          : e?.name === 'NotFoundError' || e?.name === 'NotSupportedError' ? 'No camera is available on this device. You can analyse a photo instead.'
            : e?.name === 'ModelError' ? 'The expression model couldn’t load. Check your connection and try again.'
              : 'The camera couldn’t start. Close other apps using it and try again.'
      );
    }
  }, [tick]);

  return { videoRef, status, error, frame, start, stop };
}

/** Analyse a single image (data URL / object URL). Resolves with natural size for overlay maths. */
export async function analyseImage(src) {
  const size = await new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 1, h: 1 });
    img.src = src;
  });
  // Still photos get a higher-resolution pass so small or distant faces are found.
  let r = await predictEmotion(src, { inputSize: 608 });
  if (!r.success) r = await predictEmotion(src, { inputSize: 416 });
  return r.success
    ? { ok: true, emotion: r.emotion, confidence: r.confidence, scores: normaliseScores(r.all_emotions), box: r.bbox, frame: size }
    : { ok: false, error: r.error || 'No face found in this image.', frame: size };
}
