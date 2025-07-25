# CALMe SLM - SmolLM2 Migration Handoff

## Current Status: SMOL v0.0.1

**Branch:** `SmolLM2`  
**Last Commit:** `3ef077a` - Switch to SmolLM2-360M-Instruct - SMOL v0.0.1  
**GitHub PR:** https://github.com/JoshWrites/CALMe_SLM/pull/new/SmolLM2

## What Was Done

### 1. Problem Identification
- **Issue:** mT5 model pipeline only generating 1 token due to tokenizer failure
- **Root Cause:** Transformers.js failing to load proper SentencePiece tokenizer for mT5
- **Debug Output:** "[TOKENIZER ISSUE]" prefix showing fallback decoder active

### 2. Research & Solution Selection
- **Evaluated Options:**
  - Fix mT5 tokenizer using `@sctg/sentencepiece-js` (complex)
  - Switch to browser-compatible SLM (recommended)
- **Selected:** SmolLM2-360M-Instruct (HuggingFaceTB)
  - 360M parameters vs mT5's 580M
  - Native Transformers.js support
  - Instruction-tuned for better conversations
  - ~400MB quantized model

### 3. Migration Started
- ✅ Created new `SmolLM2` branch
- ✅ Updated version to "SMOL v0.0.1" across all files
- ✅ Configured SmolLM2 model URLs in `docs/config.js`
- ✅ Committed and pushed initial changes

## Next Steps Required

### CRITICAL: Update Model Loader Architecture

The current `docs/model-loader.js` is designed for **mT5's encoder/decoder** architecture but SmolLM2 is **decoder-only**. Major refactoring needed:

#### 1. Remove Encoder/Decoder Split
```javascript
// REMOVE these mT5-specific methods:
- runEncoderInference()
- runDecoderInference() 
- runOptimizedDecoder()

// REPLACE with single SmolLM2 inference:
- runSmolLM2Inference()
```

#### 2. Update Model Loading
```javascript
// Change from:
this.encoderSession = await ort.InferenceSession.create(encoderBuffer);
this.decoderSession = await ort.InferenceSession.create(decoderBuffer);

// To:
this.modelSession = await ort.InferenceSession.create(modelBuffer);
```

#### 3. Simplify Tokenization
SmolLM2 uses standard GPT-style tokenization (supported by Transformers.js):
- Remove mT5 SentencePiece complexity
- Use native Transformers.js tokenizer
- Remove fallback decoder (`decodeMT5Tokens()`)

#### 4. Update Model URLs
Current config points to:
- `model_url: "https://huggingface.co/HuggingFaceTB/SmolLM2-360M-Instruct/resolve/main/onnx/model_q4.onnx"`

Verify this URL exists or find correct ONNX model path.

### Implementation Steps

1. **Research SmolLM2 ONNX availability**
   - Check HuggingFace repo for correct ONNX paths
   - Verify Transformers.js compatibility

2. **Refactor model-loader.js**
   - Replace encoder/decoder with single model loading
   - Update inference methods for decoder-only architecture
   - Remove mT5-specific tokenization code

3. **Update inference pipeline**
   - Implement proper SmolLM2 text generation
   - Add proper prompt formatting for instruction model
   - Test with therapeutic conversation scenarios

4. **Test & Debug**
   - Ensure model loads without tokenizer issues
   - Verify meaningful text generation
   - Remove "[TOKENIZER ISSUE]" fallbacks

## Key Files to Modify

- `docs/model-loader.js` - **Major refactor needed**
- `docs/lib/transformers-loader.js` - May need SmolLM2-specific updates
- `docs/config.js` - Verify model URLs are correct

## Expected Outcomes

- ✅ Single model architecture (simpler than mT5)
- ✅ Native tokenizer support (no SentencePiece issues)
- ✅ Better therapeutic conversations (instruction-tuned)
- ✅ Smaller model size and faster loading
- ✅ Removal of all "[TOKENIZER ISSUE]" fallbacks

## Debug Information

Last working state showed:
- Model loading successful
- Token generation happening but wrong tokenization
- Debug console showing proper token generation flow
- Need to maintain verbose logging for SmolLM2 debugging

## Context for Next Developer

This is a **browser-based therapeutic AI chat application** designed for crisis support. The switch from mT5 to SmolLM2 should result in:
- Better conversational abilities
- No tokenizer compatibility issues  
- Faster inference
- Easier maintenance

The Ma'aseh Model therapeutic approach should be maintained in the system prompt (already configured in `config.js`).