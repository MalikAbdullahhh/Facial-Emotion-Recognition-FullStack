import React, { useEffect, useRef } from 'react';
import { EMOTIONS } from '../../lib/emotions';

/*
 * A 3D point-cloud face rendered on canvas.
 * - Morphs between the seven expressions (brows, eyes, cheeks, mouth)
 * - Turns towards the cursor, repels points near it, and sweeps a scan line
 * - Labels the facial action units (FACS) that define the current expression
 */

const PARAMS = {
  neutral: { browRaise: 0, browInner: 0, eyeOpen: 1, curve: 0, open: 0, width: 1, cheek: 0, scrunch: 0 },
  happy: { browRaise: 0.05, browInner: 0, eyeOpen: 0.6, curve: 1, open: 0.25, width: 1.18, cheek: 1, scrunch: 0 },
  surprised: { browRaise: 0.75, browInner: 0.1, eyeOpen: 1.55, curve: 0.05, open: 1.05, width: 0.78, cheek: 0, scrunch: 0 },
  sad: { browRaise: 0.05, browInner: 0.75, eyeOpen: 0.82, curve: -0.75, open: 0.05, width: 0.95, cheek: 0, scrunch: 0 },
  angry: { browRaise: -0.35, browInner: -0.8, eyeOpen: 0.78, curve: -0.35, open: 0.12, width: 0.9, cheek: 0, scrunch: 0.3 },
  fear: { browRaise: 0.55, browInner: 0.55, eyeOpen: 1.4, curve: -0.25, open: 0.5, width: 1.08, cheek: 0, scrunch: 0 },
  disgust: { browRaise: -0.15, browInner: -0.25, eyeOpen: 0.7, curve: -0.45, open: 0.18, width: 0.92, cheek: 0.35, scrunch: 1 },
};

export const ACTION_UNITS = {
  happy: [['AU6', 'Cheek raiser'], ['AU12', 'Lip corner puller']],
  sad: [['AU1', 'Inner brow raiser'], ['AU4', 'Brow lowerer'], ['AU15', 'Lip corner depressor']],
  surprised: [['AU1', 'Inner brow raiser'], ['AU2', 'Outer brow raiser'], ['AU5', 'Upper lid raiser'], ['AU26', 'Jaw drop']],
  fear: [['AU1', 'Inner brow raiser'], ['AU2', 'Outer brow raiser'], ['AU4', 'Brow lowerer'], ['AU5', 'Upper lid raiser'], ['AU20', 'Lip stretcher'], ['AU26', 'Jaw drop']],
  angry: [['AU4', 'Brow lowerer'], ['AU5', 'Upper lid raiser'], ['AU7', 'Lid tightener'], ['AU23', 'Lip tightener']],
  disgust: [['AU9', 'Nose wrinkler'], ['AU15', 'Lip corner depressor'], ['AU16', 'Lower lip depressor']],
  neutral: [],
};

const ORDER = ['happy', 'surprised', 'neutral', 'sad', 'angry', 'fear', 'disgust'];
const HEX = Object.fromEntries(EMOTIONS.map((e) => [e.key, e.dark]));
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const RX = 0.92; const RY = 1.22; const RZ = 0.85;
const rxAt = (y) => (y < 0 ? RX * (1 - 0.3 * (-y / RY) ** 2) : RX * (1 - 0.06 * (y / RY) ** 2));
const surfaceZ = (x, y) => {
  const rx = rxAt(y);
  const base = RZ * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2 - (y / RY) ** 2));
  const nose = 0.24 * Math.exp(-((x / 0.12) ** 2 + ((y + 0.05) / 0.3) ** 2));
  const sockets = -0.07 * (Math.exp(-(((x - 0.36) / 0.17) ** 2 + ((y - 0.17) / 0.11) ** 2)) + Math.exp(-(((x + 0.36) / 0.17) ** 2 + ((y - 0.17) / 0.11) ** 2)));
  return base + nose + sockets;
};

function buildSurface() {
  const pts = [];
  const step = 0.062;
  let row = 0;
  for (let y = -RY; y <= RY; y += step * 0.88, row++) {
    const rx = rxAt(y);
    for (let x = -rx + (row % 2) * step * 0.5; x <= rx; x += step) {
      if ((x / rx) ** 2 + (y / RY) ** 2 > 0.98) continue;
      const jx = x + (Math.random() - 0.5) * 0.012;
      const jy = y + (Math.random() - 0.5) * 0.012;
      pts.push([jx, jy, surfaceZ(jx, jy)]);
    }
  }
  for (let i = 0; i < 120; i++) {
    const t = (i / 120) * Math.PI * 2;
    const y = Math.sin(t) * RY * 0.995;
    pts.push([Math.cos(t) * rxAt(y) * 0.995, y, 0.02]);
  }
  return pts;
}

function buildFeatures(P) {
  const lines = []; // arrays of points, drawn as connected strokes
  const z = (x, y, o = 0.012) => [x, y, surfaceZ(x, y) + o];
  for (const s of [-1, 1]) {
    // brows
    const brow = [];
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const x = s * (0.15 + t * 0.42);
      const y = 0.37 + P.browRaise * 0.13 + P.browInner * 0.11 * (1 - t) + 0.045 * Math.sin(Math.PI * t);
      brow.push(z(x, y, 0.03));
    }
    lines.push({ pts: brow, w: 1, tag: s === 1 ? 'brow' : null });
    // eye (closed ring)
    const eye = [];
    for (let i = 0; i <= 24; i++) {
      const t = (i / 24) * Math.PI * 2;
      const up = Math.sin(t) > 0 ? 1 : 0.7;
      eye.push(z(s * 0.36 + Math.cos(t) * 0.155, 0.17 + Math.sin(t) * 0.07 * P.eyeOpen * up));
    }
    lines.push({ pts: eye, w: 1 });
    const pupil = [];
    for (let i = 0; i <= 8; i++) {
      const t = (i / 8) * Math.PI * 2;
      const r = 0.032 * Math.min(1.2, P.eyeOpen);
      pupil.push(z(s * 0.36 + Math.cos(t) * r, 0.17 + Math.sin(t) * r));
    }
    lines.push({ pts: pupil, w: 1.4 });
    // cheek arcs
    if (P.cheek > 0.02) {
      const ch = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        ch.push(z(s * (0.26 + t * 0.24), -0.02 + P.cheek * 0.05 + 0.03 * Math.sin(Math.PI * t), 0.02));
      }
      lines.push({ pts: ch, w: 0.7, alpha: Math.min(1, P.cheek) });
    }
    // nose wrinkle
    if (P.scrunch > 0.02) {
      lines.push({ pts: [z(s * 0.06, 0.08), z(s * 0.13, 0.03), z(s * 0.18, 0.06)], w: 0.7, alpha: P.scrunch });
    }
  }
  // nose
  const ridge = [];
  for (let i = 0; i <= 8; i++) ridge.push(z(0, 0.12 - i * 0.042, 0.015));
  lines.push({ pts: ridge, w: 0.8, alpha: 0.6 });
  const nostrils = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const x = -0.13 + t * 0.26;
    nostrils.push(z(x, -0.255 + 0.035 * Math.cos(Math.PI * (t - 0.5) * 2) - P.scrunch * 0.02));
  }
  lines.push({ pts: nostrils, w: 0.8, alpha: 0.7 });
  // mouth
  const w = 0.33 * P.width;
  const mid = -0.57;
  const upper = []; const lower = [];
  for (let i = 0; i <= 18; i++) {
    const u = -1 + (i / 18) * 2;
    const x = u * w;
    const curve = P.curve * 0.1 * u * u;
    upper.push(z(x, mid + curve + P.open * 0.025 * (1 - u * u) + (P.scrunch * 0.03 * (1 - u * u))));
    lower.push(z(x, mid + curve - P.open * 0.17 * (1 - u * u) - 0.014 * (1 - u * u)));
  }
  lines.push({ pts: upper, w: 1.3, tag: 'mouth' });
  lines.push({ pts: lower, w: 1.3 });
  return lines;
}

const lerp = (a, b, t) => a + (b - a) * t;

export default function PointFace({ emotion, auto = true, onEmotion, interval = 3200, labels = true, className = '', zoom = 1, intro = false }) {
  const canvasRef = useRef(null);
  const state = useRef({ emotion: emotion || 'happy', P: { ...PARAMS[emotion || 'happy'] }, color: rgb(HEX[emotion || 'happy']) });
  const cb = useRef(onEmotion);
  cb.current = onEmotion;
  const controlled = emotion != null && !auto;

  useEffect(() => {
    if (emotion) { state.current.emotion = emotion; state.current.redraw?.(); }
  }, [emotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const surface = buildSurface();
    // Intro: every point starts scattered and flies into place with a random delay.
    const scatter = surface.map(() => [Math.random(), Math.random(), Math.random() * 0.55]);
    const introDur = intro && !reduce ? 1.7 : 0;
    const st = state.current;
    let w = 0; let h = 0; let dpr = 1;
    let raf = 0; let visible = true; let running = true;
    let mouse = null; let yaw = 0; let pitch = 0;
    let idx = Math.max(0, ORDER.indexOf(st.emotion));
    let lastSwitch = performance.now();
    const t0 = performance.now();

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (reduce || !running) draw(performance.now());
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !reduce) loop(); }, { threshold: 0 });
    io.observe(canvas);
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect();
      mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onLeave = () => { mouse = null; };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    const onVis = () => { running = !document.hidden; if (running && !reduce) loop(); };
    document.addEventListener('visibilitychange', onVis);

    function project(p, cy, sy, cp, sp, scale, cx, cyy) {
      const x1 = p[0] * cy + p[2] * sy;
      const z1 = -p[0] * sy + p[2] * cy;
      const y2 = p[1] * cp - z1 * sp;
      const z2 = p[1] * sp + z1 * cp;
      const f = 3.4 / (3.4 - z2);
      return [cx + x1 * scale * f, cyy - y2 * scale * f, z2];
    }

    function draw(now) {
      const t = (now - t0) / 1000;
      // expression cycling
      if (!controlled && auto && !reduce && now - lastSwitch > interval) {
        idx = (idx + 1) % ORDER.length;
        st.emotion = ORDER[idx];
        lastSwitch = now;
        cb.current?.(st.emotion);
      }
      const target = PARAMS[st.emotion] || PARAMS.neutral;
      const k = reduce ? 1 : 0.075;
      Object.keys(target).forEach((key) => { st.P[key] = lerp(st.P[key], target[key], k); });
      const tc = rgb(HEX[st.emotion] || HEX.neutral);
      st.color = st.color.map((c, i) => lerp(c, tc[i], k));

      // head orientation
      let ty = Math.sin(t * 0.45) * 0.22; let tp = Math.sin(t * 0.33) * 0.08 - 0.04;
      if (mouse) {
        ty = Math.max(-1, Math.min(1, (mouse.x - w / 2) / (w / 2))) * 0.55;
        tp = Math.max(-1, Math.min(1, (mouse.y - h / 2) / (h / 2))) * 0.3;
      }
      yaw = lerp(yaw, ty, reduce ? 1 : 0.06); pitch = lerp(pitch, tp, reduce ? 1 : 0.06);
      const cyw = Math.cos(yaw); const syw = Math.sin(yaw); const cp = Math.cos(pitch); const sp = Math.sin(pitch);
      const scale = Math.min(w * 0.44, h * 0.36) * zoom;
      const cx = w / 2; const cyy = h * 0.5;
      const scanY = RY - ((t * 0.55) % 2.9);
      const [cr, cg, cb2] = st.color.map(Math.round);

      ctx.clearRect(0, 0, w, h);
      const prog = introDur ? Math.min(1, Math.max(0, (t - 0.15) / introDur)) : 1;
      const featA = introDur ? Math.min(1, Math.max(0, (prog - 0.62) / 0.38)) : 1;

      // surface points
      for (let i = 0; i < surface.length; i++) {
        const p = surface[i];
        let [sx, sy, sz] = project(p, cyw, syw, cp, sp, scale, cx, cyy);
        if (prog < 1) {
          const sc = scatter[i];
          const k2 = Math.min(1, Math.max(0, (prog * 1.55 - sc[2]) / 1));
          const e = 1 - (1 - k2) ** 3;
          sx = sc[0] * w + (sx - sc[0] * w) * e;
          sy = sc[1] * h + (sy - sc[1] * h) * e;
        }
        if (mouse) {
          const dx = sx - mouse.x; const dy = sy - mouse.y; const d = Math.hypot(dx, dy);
          if (d < 90 && d > 0.1) { const f = (1 - d / 90) ** 2 * 18; sx += (dx / d) * f; sy += (dy / d) * f; }
        }
        const depth = (sz + 0.4) / 1.4;
        const band = Math.max(0, 1 - Math.abs(p[1] - scanY) / 0.09);
        const boost = prog < 1 ? (1 - prog) * 0.55 : 0;
        const a = Math.max(0.05, Math.min(0.9, 0.12 + depth * 0.4 + band * 0.5 + boost));
        const size = 0.7 + depth * 1.05 + band * 0.6 + boost * 1.6;
        ctx.fillStyle = band > 0.05 || (boost > 0 && i % 3 === 0) ? `rgba(${cr},${cg},${cb2},${a})` : `rgba(236,235,230,${a})`;
        ctx.fillRect(sx - size / 2, sy - size / 2, size, size);
      }

      // feature strokes + points
      const feats = buildFeatures(st.P);
      const anchors = {};
      feats.forEach((f, fi) => {
        const pr = f.pts.map((p) => project(p, cyw, syw, cp, sp, scale, cx, cyy));
        ctx.strokeStyle = `rgba(${cr},${cg},${cb2},${0.45 * (f.alpha ?? 1) * featA})`;
        ctx.lineWidth = f.w;
        ctx.beginPath();
        pr.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
        ctx.stroke();
        ctx.fillStyle = `rgba(${cr},${cg},${cb2},${0.95 * (f.alpha ?? 1) * featA})`;
        pr.forEach((q, i) => { if (i % 2 === 0) { const s = 1.6 + f.w * 0.6; ctx.fillRect(q[0] - s / 2, q[1] - s / 2, s, s); } });
        if (f.tag) anchors[f.tag] = pr[pr.length - 1];
      });

      // action-unit labels
      if (labels && w > 640 && featA >= 1) {
        const aus = ACTION_UNITS[st.emotion] || [];
        const items = aus.length ? [aus[0], aus[aus.length - 1]] : [['—', 'No dominant action units']];
        ctx.font = '500 11px "Geist Mono Variable", ui-monospace, monospace';
        const draws = [
          { a: anchors.brow, side: 1, item: items[0], val: Math.abs(st.P.browRaise * 0.6 + st.P.browInner * 0.4 + st.P.eyeOpen * 0.2) },
          { a: anchors.mouth, side: 1, item: items[1] || items[0], val: Math.abs(st.P.curve * 0.7) + st.P.open * 0.3 },
        ];
        draws.forEach(({ a, item, val }, i) => {
          if (!a || (i === 1 && items.length < 2 && aus.length)) return;
          const lx = Math.min(w - 12, cx + scale * 1.05);
          const ly = a[1] + (i ? 18 : -18);
          ctx.strokeStyle = 'rgba(236,235,230,0.28)';
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(a[0] + 4, a[1]); ctx.lineTo(Math.max(a[0] + 24, lx - 170), ly); ctx.lineTo(lx - 6, ly); ctx.stroke();
          ctx.fillStyle = `rgb(${cr},${cg},${cb2})`;
          ctx.beginPath(); ctx.arc(a[0], a[1], 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = 'rgba(236,235,230,0.85)';
          ctx.textAlign = 'right';
          ctx.fillText(`${item[0]} · ${item[1]}`, lx - 6, ly - 7);
          ctx.fillStyle = 'rgba(236,235,230,0.45)';
          ctx.fillText(aus.length ? `intensity ${Math.min(0.99, 0.35 + val * 0.5).toFixed(2)}` : 'baseline', lx - 6, ly + 14);
          ctx.textAlign = 'left';
        });
      }
    }

    function loop() {
      cancelAnimationFrame(raf);
      const tick = (now) => {
        if (!visible || !running) return;
        draw(now);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }
    st.redraw = reduce ? () => draw(performance.now()) : null;
    resize();
    if (reduce) draw(performance.now()); else loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [auto, controlled, interval, labels, zoom, intro]);

  return <canvas ref={canvasRef} className={`pointface ${className}`} aria-hidden="true" />;
}
