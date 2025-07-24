# Models Directory

This directory contains the AI models used by the therapy assistant demo.

## Contents

### VOSK Speech Recognition
- **vosk-model-small-en-us-0.15/**: English speech recognition model (~45MB)
- Download from: https://alphacephei.com/vosk/models

### mT5 Language Model
- **Downloaded automatically** from Hugging Face Hub on first run
- **Size**: ~600MB (cached locally after first download)
- **Source**: https://huggingface.co/google/mt5-small

## Model Caching

Models are automatically cached in the browser to avoid repeated downloads:
- IndexedDB storage for model files
- LocalStorage for configuration
- Cache keys defined in `config.js`

## Custom Models

To use your own trained models:
1. Convert to ONNX format
2. Place in this directory
3. Update `config.js` with new model path
4. See `SWAP-MODEL-INSTRUCTIONS.md` for detailed steps

## File Size Limits

- GitHub repository limit: 100MB per file
- Large models (>100MB) are downloaded externally
- Use Git LFS for version controlling large model files

## Privacy

All models run locally in the browser:
- No data sent to external servers after download
- Complete offline operation possible
- Models cached for performance