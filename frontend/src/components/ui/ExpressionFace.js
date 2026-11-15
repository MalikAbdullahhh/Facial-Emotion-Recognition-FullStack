import React from 'react';
import { motion } from 'framer-motion';
import { EASE } from './index';

/* ── Expression face (morphs between the seven) ─────────── */
const FACE = {
  neutral: { brow: 'M62 80 Q76 74 90 77', eye: 5.5, mouth: 'M80 142 Q90 143 100 143 Q110 143 120 142' },
  happy: { brow: 'M62 78 Q76 70 90 75', eye: 3.2, mouth: 'M74 134 Q87 158 100 158 Q113 158 126 134' },
  surprised: { brow: 'M62 66 Q76 56 90 63', eye: 8.5, mouth: 'M90 141 Q100 117 110 141 Q100 165 90 141' },
  sad: { brow: 'M62 82 Q76 79 90 70', eye: 5, mouth: 'M80 152 Q90 139 100 139 Q110 139 120 152' },
  angry: { brow: 'M62 72 Q77 75 92 84', eye: 4, mouth: 'M82 147 Q91 140 100 140 Q109 140 118 147' },
  fear: { brow: 'M64 70 Q77 63 92 67', eye: 8, mouth: 'M80 148 Q90 138 100 141 Q110 144 120 138' },
  disgust: { brow: 'M62 79 Q77 77 92 82', eye: 3.4, mouth: 'M82 143 Q91 135 100 141 Q109 147 118 136' },
};
const mirror = (d) => d.replace(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g, (_, x, y) => `${200 - Number(x)} ${y}`);

export default function ExpressionFace({ emotion = 'neutral', color = 'currentColor' }) {
  const f = FACE[emotion] || FACE.neutral;
  const t = { duration: 0.6, ease: EASE };
  return (
    <svg viewBox="0 0 200 200" className="xface" aria-hidden="true">
      <ellipse cx="100" cy="108" rx="66" ry="80" className="xface__head" />
      <motion.path d={f.brow} animate={{ d: f.brow }} initial={false} transition={t} className="xface__line" />
      <motion.path d={mirror(f.brow)} animate={{ d: mirror(f.brow) }} initial={false} transition={t} className="xface__line" />
      <motion.ellipse cx="77" cy="98" rx="5.5" animate={{ ry: f.eye }} initial={false} transition={t} className="xface__eye" />
      <motion.ellipse cx="123" cy="98" rx="5.5" animate={{ ry: f.eye }} initial={false} transition={t} className="xface__eye" />
      <path d="M100 106 L95 125 L104 125" className="xface__line xface__nose" />
      <motion.path d={f.mouth} animate={{ d: f.mouth }} initial={false} transition={t} className="xface__line" style={{ stroke: color }} />
      <motion.g animate={{ opacity: emotion === 'disgust' ? 1 : 0 }} initial={false} transition={t}>
        <path d="M92 112 l-5 3 M108 112 l5 3" className="xface__line xface__thin" />
      </motion.g>
    </svg>
  );
}

