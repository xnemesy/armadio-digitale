// Lightweight ExecuTorch React Native client with graceful fallback
import { Asset } from 'expo-asset';
import * as ImageManipulator from 'expo-image-manipulator';
import { ML_CONFIG } from './config';
import { CLOTHING_LABELS } from './labels';

let _model = null;
let _executorch = null;

// Try to dynamically import the native module; if it fails, we keep null
async function getExecuTorch() {
  if (_executorch) return _executorch;
  try {
    // eslint-disable-next-line no-undef
    const mod = await import('react-native-executorch');
    _executorch = mod?.default || mod;
    return _executorch;
  } catch (e) {
    console.warn('[ML] ExecuTorch not available, falling back to cloud. Error:', e?.message);
    return null;
  }
}

export async function ensureModelLoaded() {
  if (_model) return true;
  const ET = await getExecuTorch();
  if (!ET) return false;
  try {
    // Resolve asset file path (supports OTA/downloaded assets too)
    const asset = Asset.fromModule(ML_CONFIG.modelAsset);
    if (!asset.localUri) await asset.downloadAsync();
    const modelPath = asset.localUri;
    _model = await ET.loadModel(modelPath);
    return true;
  } catch (e) {
    console.warn('[ML] Failed to load model:', e?.message);
    return false;
  }
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

export async function classifyClothingFromUri(uri) {
  const ready = await ensureModelLoaded();
  if (!ready) return null;

  // Resize to expected input and fetch base64
  const { inputSize, normalization } = ML_CONFIG;
  const manip = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: inputSize, height: inputSize } }],
    { base64: true, compress: 1, format: ImageManipulator.SaveFormat.JPEG }
  );
  if (!manip.base64) return null;

  // Convert base64 -> Float32Array normalized CHW
  const byteCharacters = atob(manip.base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
  const byteArray = new Uint8Array(byteNumbers);

  // Very lightweight JPEG decode is not available in pure JS here; ExecuTorch RN
  // usually ships image helpers. For POC, we rely on ImageManipulator output's
  // width/height and use its base64 as RGBA via an optional helper.
  // If the runtime exposes ET.image.decodeToTensor, prefer that.

  const ET = await getExecuTorch();
  if (ET?.image?.decodeJpegToTensor) {
    const inputTensor = await ET.image.decodeJpegToTensor(byteArray, {
      width: inputSize,
      height: inputSize,
      mean: normalization.mean,
      std: normalization.std,
    });
    const outputs = await _model.run({ input: inputTensor });
    const logits = outputs?.logits || outputs?.output || outputs?.[0] || [];
    const probs = softmax(Array.from(logits));
    const maxIdx = probs.reduce((bestIdx, v, i, arr) => (v > arr[bestIdx] ? i : bestIdx), 0);
    return {
      label: CLOTHING_LABELS[maxIdx] || `class_${maxIdx}`,
      confidence: probs[maxIdx] || 0,
      topK: probs
        .map((p, i) => ({ label: CLOTHING_LABELS[i] || `class_${i}`, p }))
        .sort((a, b) => b.p - a.p)
        .slice(0, 5),
    };
  }

  console.warn('[ML] ET.image.decodeJpegToTensor not available; skipping on-device inference.');
  return null;
}
