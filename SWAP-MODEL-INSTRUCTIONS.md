# Model Swapping Instructions

This guide provides step-by-step instructions for replacing the default mT5-small model with your own trained model.

## Prerequisites

- Your model must be in ONNX format
- Model should be compatible with text-to-text generation
- Ensure your model size is reasonable for browser deployment (under 2GB recommended)
- Test your model with ONNX.js before integration

## Step-by-Step Process

### 1. Prepare Your Model

#### Convert to ONNX (if needed)
```bash
# For PyTorch models
python -m transformers.onnx --model=your-model-path --feature=text2text-generation onnx/

# For TensorFlow models
python -m tf2onnx.convert --saved-model your-model-path --output model.onnx
```

#### Validate ONNX Model
```javascript
// Test with ONNX.js
const ort = require('onnxruntime-web');
ort.InferenceSession.create('your-model.onnx').then(session => {
    console.log('Model loaded successfully');
}).catch(err => {
    console.error('Model validation failed:', err);
});
```

### 2. Update Configuration

Edit `docs/config.js`:

```javascript
const CONFIG = {
    models: {
        mt5: {
            source: "local",  // Change from "huggingface" to "local"
            path: "google/mt5-small",  // Keep for fallback
            huggingface_url: "https://huggingface.co/google/mt5-small/resolve/main/onnx/model.onnx",
            local_path: "./models/your-custom-model.onnx",  // Update this path
            cache_key: "custom-model-v1",  // Change cache key
            fallback_urls: [
                // Add your backup URLs if available
            ],
            expected_size: 800 * 1024 * 1024  // Update expected size
        }
        // ... rest of config
    }
};
```

### 3. Place Model File

#### Option A: Direct Placement
1. Copy your ONNX model to `docs/models/your-custom-model.onnx`
2. Ensure the filename matches the `local_path` in config.js

#### Option B: Model Directory Structure
```
docs/models/
├── your-custom-model/
│   ├── model.onnx
│   ├── tokenizer.json  (if needed)
│   └── config.json     (if needed)
└── vosk-model-small-en-us-0.15/  (keep existing)
```

### 4. Update Model Loader (if needed)

If your model requires special preprocessing or postprocessing, modify `docs/model-loader.js`:

```javascript
// In the ModelLoader class, update the tokenizer initialization
initializeTokenizer() {
    this.tokenizer = {
        encode: (text) => {
            // Your custom encoding logic
            return yourCustomTokenizer.encode(text);
        },
        decode: (tokens) => {
            // Your custom decoding logic
            return yourCustomTokenizer.decode(tokens);
        }
    };
}

// Update inference if needed
async runInference(inputTokens) {
    // Custom inference logic for your model
    const feeds = {
        'input_ids': new ort.Tensor('int64', inputTokens, [1, inputTokens.length])
    };
    
    const results = await this.session.run(feeds);
    return results.output_ids.data;
}
```

### 5. Clear Browser Cache

#### Method 1: Developer Tools
1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Clear all storage for your domain
4. Refresh the page

#### Method 2: Incognito Mode
1. Open an incognito/private browsing window
2. Navigate to your demo
3. Test the new model

#### Method 3: Programmatic Cache Clear
```javascript
// Add to browser console
caches.delete('therapy-models-v1').then(() => {
    location.reload();
});
```

### 6. Validation Steps

#### Test Model Loading
1. Open the demo with debug mode enabled (`?debug=true`)
2. Watch the debug console for model loading messages
3. Verify no errors during initialization

#### Test Responses
1. Send a simple test message: "Hello, how are you?"
2. Verify the response is appropriate and coherent
3. Test with emotional content to ensure detection still works

#### Performance Check
1. Monitor memory usage in debug console
2. Check response generation times
3. Test on multiple devices/browsers

### 7. Troubleshooting

#### Model Won't Load
**Symptoms**: Loading screen doesn't disappear, errors in console

**Solutions**:
- Verify file path matches config.js exactly
- Check model file isn't corrupted (try re-downloading/converting)
- Ensure model is in correct ONNX format
- Check browser console for specific error messages

#### Poor Performance
**Symptoms**: Slow responses, high memory usage, browser freezing

**Solutions**:
- Consider model quantization to reduce size
- Implement model sharding for large models
- Use Web Workers for processing (modify model-loader.js)
- Test on devices with more RAM

#### Incorrect Responses
**Symptoms**: Nonsensical output, errors during generation

**Solutions**:
- Verify tokenizer configuration matches your model
- Check input/output tensor shapes and types
- Test model independently with ONNX.js
- Review preprocessing/postprocessing logic

#### Caching Issues
**Symptoms**: Old model still loading despite changes

**Solutions**:
- Change the `cache_key` in config.js
- Clear all browser storage
- Use incognito mode for testing
- Check Network tab in dev tools for actual requests

## Advanced Configuration

### Custom Model Metadata

Add model-specific metadata to help with debugging:

```javascript
// In config.js
CONFIG.models.mt5.metadata = {
    name: "Custom Therapy Model v2.1",
    description: "Fine-tuned on therapy conversations",
    version: "2.1.0",
    created: "2025-01-01",
    vocab_size: 32128,
    max_length: 512,
    special_tokens: {
        pad_token: "<pad>",
        eos_token: "</s>",
        unk_token: "<unk>"
    }
};
```

### Custom Response Processing

For specialized response formats:

```javascript
// In model-loader.js, update generateResponse method
async generateResponse(inputText) {
    // ... existing code ...
    
    // Custom post-processing
    let response = this.tokenizer.decode(output);
    
    // Apply therapy-specific filtering
    response = this.applyTherapyFilters(response);
    
    // Ensure appropriate tone
    response = this.ensureTherapeuticTone(response);
    
    return response;
}

applyTherapyFilters(text) {
    // Remove inappropriate content
    // Ensure supportive language
    // Format response appropriately
    return text;
}
```

### Multiple Model Support

To support swapping between multiple models:

```javascript
// In config.js
CONFIG.models.available = {
    "mt5-small": {
        path: "./models/mt5-small.onnx",
        cache_key: "mt5-small-v1"
    },
    "custom-therapy": {
        path: "./models/custom-therapy.onnx", 
        cache_key: "custom-therapy-v1"
    },
    "enhanced-model": {
        path: "./models/enhanced-model.onnx",
        cache_key: "enhanced-v1"
    }
};

CONFIG.models.mt5.active = "custom-therapy";
```

## Testing Checklist

Before considering your model swap complete:

- [ ] Model loads without errors in debug console
- [ ] Response generation works for basic inputs
- [ ] Emotional state detection continues to function
- [ ] Performance is acceptable (< 3 second response times)
- [ ] Memory usage stays within reasonable limits
- [ ] Responses are appropriate for therapy context
- [ ] Model persists across browser sessions (caching works)
- [ ] Offline functionality maintained
- [ ] Works across different browsers (Chrome, Firefox, Safari)
- [ ] Mobile compatibility if required

## Best Practices

1. **Test Extensively**: Always test your model thoroughly before deployment
2. **Version Control**: Keep track of model versions and configuration changes
3. **Backup Models**: Keep the original working model as fallback
4. **Document Changes**: Update README.md with any custom requirements
5. **Monitor Performance**: Use debug mode to monitor resource usage
6. **User Experience**: Ensure model swaps don't break the user interface

## Getting Help

If you encounter issues:

1. Enable debug mode and check console logs
2. Test your ONNX model independently 
3. Verify all file paths and configurations
4. Check the browser's Network tab for loading issues
5. Review this guide step-by-step
6. Consult the [DEBUG-GUIDE.md](DEBUG-GUIDE.md) for debugging tips

Remember: The goal is to maintain the same user experience while using your custom model. Take time to test thoroughly and ensure all features continue to work as expected.