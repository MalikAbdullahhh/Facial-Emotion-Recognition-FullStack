/**
 * In-browser emotion recognition.
 *
 * This replaces the external Python/Flask model server. Detection now runs entirely on the
 * visitor's device with TensorFlow.js (via @vladmandic/face-api): no image ever leaves the
 * browser, nothing extra to host, and it works on Cloudflare's free plan.
 *
 * The exported functions keep the same names and response shapes as the old API client
 * so the pages that use them did not need to change.
 */
import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = `${process.env.PUBLIC_URL || ''}/models`;

// face-api expression labels -> labels used across this app
const LABELS = {
  neutral: 'neutral',
  happy: 'happy',
  sad: 'sad',
  angry: 'angry',
  fearful: 'fear',
  disgusted: 'disgust',
  surprised: 'surprised',
};

let loading = null;

/** Loads the face detector + expression models once (≈0.5 MB, cached by the browser). */
const loadModels = () => {
  if (!loading) {
    loading = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]).catch((error) => {
      loading = null;
      throw error;
    });
  }
  return loading;
};

const detectorOptions = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.45 });

const toImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the image'));
    img.src = src;
  });

/**
 * Convert canvas/video frame to base64
 * @param {HTMLCanvasElement} canvas - Canvas element to convert
 * @param {number} quality - JPEG quality (0-1)
 */
export const frameToBase64 = (canvas, quality = 0.5) => {
  try {
    return canvas.toDataURL('image/jpeg', quality);
  } catch (error) {
    console.error('Error converting frame to base64:', error);
    return null;
  }
};

/**
 * Predict emotion from an image (data URL or object URL).
 * Resolves to { success, emotion, confidence, all_emotions, bbox:[x1,y1,x2,y2] } or { success:false, error }.
 */
export const predictEmotion = async (imageSrc /* , clientId */) => {
  try {
    await loadModels();
    const img = await toImage(imageSrc);
    const detection = await faceapi.detectSingleFace(img, detectorOptions).withFaceExpressions();
    if (!detection) {
      return { success: false, error: 'No face detected — face the camera with good, even light.', emotion: null, confidence: 0 };
    }
    const allEmotions = {};
    for (const [key, value] of Object.entries(detection.expressions)) {
      if (LABELS[key]) allEmotions[LABELS[key]] = Number(value.toFixed(4));
    }
    const [emotion, confidence] = Object.entries(allEmotions).sort((a, b) => b[1] - a[1])[0];
    const box = detection.detection.box;
    return {
      success: true,
      emotion,
      confidence,
      all_emotions: allEmotions,
      bbox: [Math.round(box.x), Math.round(box.y), Math.round(box.x + box.width), Math.round(box.y + box.height)],
    };
  } catch (error) {
    console.error('Error predicting emotion:', error);
    return { success: false, error: error.message || 'Emotion detection failed', emotion: null, confidence: 0 };
  }
};

/** Reports "loaded" once the in-browser models are ready (same shape the page already checks). */
export const checkPythonApiHealth = async () => {
  try {
    await loadModels();
    return { status: 'ok', model_status: 'loaded', engine: 'browser' };
  } catch (error) {
    console.error('Emotion model failed to load:', error);
    return null;
  }
};

/** Kept for API compatibility — detection is stateless in the browser. */
export const resetClientState = async () => {};

const emotionEngine = { predictEmotion, checkPythonApiHealth, resetClientState, frameToBase64 };
export default emotionEngine;
