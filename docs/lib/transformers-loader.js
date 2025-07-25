// Transformers.js loader for browser - mT5 tokenizer
// This loads the HuggingFace Transformers.js library for proper mT5 tokenization

window.TransformersTokenizer = null;

async function loadTransformersTokenizer() {
    try {
        console.log('Loading Transformers.js from CDN...');
        
        // Dynamic import of Transformers.js
        const { AutoTokenizer, env } = await import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2');
        
        // Configure environment for browser usage
        env.allowRemoteModels = true;
        env.remoteURL = 'https://huggingface.co/';
        
        console.log('Loading mT5-small tokenizer...');
        
        // Load the actual mT5 tokenizer
        const tokenizer = await AutoTokenizer.from_pretrained('google/mt5-small');
        
        // Create a wrapper class that matches our expected interface
        window.TransformersTokenizer = class {
            constructor() {
                this.tokenizer = tokenizer;
                console.log('✅ mT5 tokenizer loaded successfully');
            }
            
            encodeIds(text) {
                try {
                    const encoded = this.tokenizer(text, {
                        return_tensors: false,
                        padding: false,
                        truncation: false
                    });
                    return Array.from(encoded.input_ids.data);
                } catch (error) {
                    console.error('Tokenization error:', error);
                    return [1]; // Return <unk> token
                }
            }
            
            decodeIds(ids) {
                try {
                    // Convert array to proper format if needed
                    const tokenIds = Array.isArray(ids) ? ids : Array.from(ids);
                    return this.tokenizer.decode(tokenIds, { skip_special_tokens: true });
                } catch (error) {
                    console.error('Decoding error:', error);
                    return "[DECODE ERROR]";
                }
            }
        };
        
        console.log('✅ Transformers.js loaded and configured successfully');
        return true;
        
    } catch (error) {
        console.error('Failed to load Transformers.js:', error);
        
        // Create a mock tokenizer for fallback
        window.TransformersTokenizer = class MockTokenizer {
            constructor() {
                console.warn('Using mock tokenizer - Transformers.js failed to load');
            }
            
            encodeIds(text) {
                console.warn('Mock: encodeIds called with:', text);
                return text.split(/\s+/).map((_, i) => i + 4);
            }
            
            decodeIds(ids) {
                console.warn('Mock: decodeIds called with:', ids);
                return "[MOCK] Transformers.js not loaded - cannot decode";
            }
        };
        
        return false;
    }
}

// Auto-load on script load
loadTransformersTokenizer();