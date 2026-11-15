/** Single source of truth for the seven expressions the model reports. */
export const EMOTIONS = [
  { key: 'happy', dark: '#f2b04a', label: 'Happy', api: 'Happy', color: 'var(--e-happy)', hex: '#e39a2d', cue: 'Raised cheeks, lip corners pulled up and back.' },
  { key: 'neutral', dark: '#9ea2ab', label: 'Neutral', api: 'Neutral', color: 'var(--e-neutral)', hex: '#8a8e97', cue: 'Relaxed brows and mouth — no strong muscle signal.' },
  { key: 'surprised', dark: '#a787ff', label: 'Surprised', api: 'Surprise', color: 'var(--e-surprised)', hex: '#8f63ee', cue: 'Lifted brows, widened eyes, dropped jaw.' },
  { key: 'sad', dark: '#5d93ff', label: 'Sad', api: 'Sad', color: 'var(--e-sad)', hex: '#3a77e6', cue: 'Inner brows raised, lip corners drawn down.' },
  { key: 'angry', dark: '#ff6a6a', label: 'Angry', api: 'Anger', color: 'var(--e-angry)', hex: '#dc4a4a', cue: 'Lowered, pulled-together brows; pressed lips.' },
  { key: 'fear', dark: '#33c2b0', label: 'Fear', api: 'Fear', color: 'var(--e-fear)', hex: '#1b998a', cue: 'Raised, tense brows; stretched lips.' },
  { key: 'disgust', dark: '#9bc24b', label: 'Disgust', api: 'Disgust', color: 'var(--e-disgust)', hex: '#789a2f', cue: 'Wrinkled nose, raised upper lip.' },
];

const BY_KEY = Object.fromEntries(EMOTIONS.map((e) => [e.key, e]));
const ALIASES = { anger: 'angry', surprise: 'surprised', fearful: 'fear', disgusted: 'disgust', contempt: 'disgust' };

/** Normalise any label (model, API enum, legacy) to an internal key. */
export const toKey = (label) => {
  const k = String(label || '').toLowerCase();
  return BY_KEY[k] ? k : ALIASES[k] || 'neutral';
};
export const emotionMeta = (label) => BY_KEY[toKey(label)];
/** Label the backend enum accepts (Anger / Surprise / …). */
export const toApiLabel = (label) => emotionMeta(label).api;

/** Normalise a { label: score } map to internal keys, filling missing ones with 0. */
export const normaliseScores = (scores = {}) => {
  const out = Object.fromEntries(EMOTIONS.map((e) => [e.key, 0]));
  Object.entries(scores || {}).forEach(([k, v]) => { out[toKey(k)] += Number(v) || 0; });
  return out;
};

export const topEmotion = (scores = {}) => {
  const entries = Object.entries(scores);
  if (!entries.length) return null;
  return entries.sort((a, b) => b[1] - a[1])[0];
};

export const pct = (v, digits = 0) => `${(Number(v || 0) * 100).toFixed(digits)}%`;

/** Concrete colour for canvas/SVG contexts where CSS variables aren't available. */
export const emotionHex = (label, theme = 'light') => { const m = emotionMeta(label); return theme === 'dark' ? m.dark : m.hex; };
