// ExecuTorch ML POC configuration
export const ML_CONFIG = {
  // Confidence threshold to accept on-device prediction without cloud fallback
  confidenceThreshold: 0.7,
  // Input size expected by MobileNetV3 models
  inputSize: 224,
  // Expected normalization parameters (Imagenet-like)
  normalization: {
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
  },
  // Model asset relative path (place the .pte file here)
  // COMMENTED OUT: model file not present, ExecuTorch will fallback to Gemini
  modelAsset: null, // require('../../assets/models/mobilenet_v3_clothes_int8.pte'),
};
