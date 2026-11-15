import { EMOTIONS, emotionMeta, normaliseScores } from './emotions';

const DISPLAY = '"Schibsted Grotesk Variable", "Instrument Sans Variable", system-ui, sans-serif';
const BODY = '"Instrument Sans Variable", system-ui, sans-serif';
const MONO = '"Geist Mono Variable", ui-monospace, monospace';

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

/**
 * Render a shareable PNG report for one analysis and trigger a download.
 * analysis: { image (data URL), emotion, confidence, scores|allEmotions, box|bbox, date, name }
 */
export async function downloadReport(analysis) {
  const img = await new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = analysis.image;
  });
  try { await document.fonts?.ready; } catch (e) { /* ignore */ }

  const W = 1200; const H = 1560; const P = 64;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  const meta = emotionMeta(analysis.emotion);
  const scores = normaliseScores(analysis.scores || analysis.allEmotions);

  ctx.fillStyle = '#f4f3ef';
  ctx.fillRect(0, 0, W, H);

  // Header
  ctx.fillStyle = '#111214';
  roundRect(ctx, P, P, 44, 44, 12); ctx.fill();
  ctx.strokeStyle = '#f4f3ef'; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  [[P + 11, P + 17, P + 11, P + 13, P + 15, P + 11], [P + 29, P + 11, P + 33, P + 11, P + 33, P + 15], [P + 33, P + 29, P + 33, P + 33, P + 29, P + 33], [P + 15, P + 33, P + 11, P + 33, P + 11, P + 29]].forEach(([a, b, d, e, f, g]) => { ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(d, e); ctx.lineTo(f, g); ctx.stroke(); });
  ctx.fillStyle = '#111214';
  ctx.font = `800 30px ${DISPLAY}`;
  ctx.fillText('FER', P + 60, P + 32);
  ctx.font = `500 22px ${BODY}`; ctx.fillStyle = '#5d6067';
  ctx.textAlign = 'right';
  ctx.fillText(`Expression report · ${new Date(analysis.date || Date.now()).toLocaleString()}`, W - P, P + 30);
  ctx.textAlign = 'left';

  // Image
  const boxX = P; const boxY = P + 88; const boxW = W - P * 2; const boxH = 720;
  ctx.save();
  roundRect(ctx, boxX, boxY, boxW, boxH, 28); ctx.clip();
  ctx.fillStyle = '#0f1012'; ctx.fillRect(boxX, boxY, boxW, boxH);
  const s = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
  const iw = img.naturalWidth * s; const ih = img.naturalHeight * s;
  const ix = boxX + (boxW - iw) / 2; const iy = boxY + (boxH - ih) / 2;
  ctx.drawImage(img, ix, iy, iw, ih);
  const b = analysis.box || analysis.bbox;
  if (b && b.length === 4) {
    const fx = ix + b[0] * s; const fy = iy + b[1] * s; const fw = (b[2] - b[0]) * s; const fh = (b[3] - b[1]) * s;
    const L = Math.min(34, fw / 3);
    ctx.strokeStyle = meta.hex; ctx.lineWidth = 5;
    [[fx, fy + L, fx, fy, fx + L, fy], [fx + fw - L, fy, fx + fw, fy, fx + fw, fy + L], [fx + fw, fy + fh - L, fx + fw, fy + fh, fx + fw - L, fy + fh], [fx + L, fy + fh, fx, fy + fh, fx, fy + fh - L]].forEach(([a, bb, d, e, f, g]) => { ctx.beginPath(); ctx.moveTo(a, bb); ctx.lineTo(d, e); ctx.lineTo(f, g); ctx.stroke(); });
  }
  ctx.restore();

  // Result
  let y = boxY + boxH + 84;
  ctx.fillStyle = '#5d6067'; ctx.font = `500 24px ${BODY}`;
  ctx.fillText('Dominant expression', P, y);
  ctx.textAlign = 'right';
  ctx.fillText('Confidence', W - P, y);
  ctx.textAlign = 'left';
  y += 72;
  ctx.fillStyle = meta.hex; ctx.font = `700 72px ${DISPLAY}`;
  ctx.fillText(meta.label, P, y);
  ctx.fillStyle = '#111214'; ctx.font = `500 64px ${MONO}`; ctx.textAlign = 'right';
  ctx.fillText(`${Math.round((analysis.confidence || 0) * 100)}%`, W - P, y);
  ctx.textAlign = 'left';

  // Bars
  y += 56;
  const labelW = 170; const valW = 90; const trackW = W - P * 2 - labelW - valW;
  EMOTIONS.forEach((e) => {
    const v = scores[e.key] || 0;
    y += 50;
    ctx.fillStyle = e.key === meta.key ? '#111214' : '#5d6067';
    ctx.font = `${e.key === meta.key ? 600 : 500} 24px ${BODY}`;
    ctx.fillText(e.label, P, y);
    ctx.fillStyle = '#e4e2dc'; roundRect(ctx, P + labelW, y - 14, trackW, 14, 7); ctx.fill();
    ctx.fillStyle = e.hex; ctx.globalAlpha = e.key === meta.key ? 1 : 0.6;
    roundRect(ctx, P + labelW, y - 14, Math.max(14, trackW * v), 14, 7); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#5d6067'; ctx.font = `500 22px ${MONO}`; ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(v * 100)}%`, W - P, y);
    ctx.textAlign = 'left';
  });

  ctx.fillStyle = '#8b8e95'; ctx.font = `500 20px ${BODY}`;
  ctx.fillText('Analysed on-device with FER. Expressions are signals, not feelings.', P, H - P + 10);

  const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fer-report-${meta.key}-${new Date(analysis.date || Date.now()).toISOString().slice(0, 10)}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
