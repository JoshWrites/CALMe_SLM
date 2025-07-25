// Transformers.js loader for browser - SmolLM2 tokenizer
// This loads the HuggingFace Transformers.js library for proper SmolLM2 tokenization

window.TransformersTokenizer = null;

async function loadTransformersTokenizer() {
    try {
        console.log('Loading Transformers.js from CDN...');
        
        // Dynamic import of Transformers.js - try multiple CDNs
        let transformersModule;
        const cdnUrls = [
            'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2',
            'https://unpkg.com/@xenova/transformers@2.17.2',
            'https://cdn.skypack.dev/@xenova/transformers@2.17.2'
        ];
        
        let lastError;
        for (const cdnUrl of cdnUrls) {
            try {
                console.log(`Trying to load Transformers.js from: ${cdnUrl}`);
                transformersModule = await import(cdnUrl);
                console.log(`✅ Successfully loaded from: ${cdnUrl}`);
                break;
            } catch (cdnError) {
                console.warn(`Failed to load from ${cdnUrl}:`, cdnError.message);
                lastError = cdnError;
            }
        }
        
        if (!transformersModule) {
            throw new Error(`All CDN attempts failed. Last error: ${lastError.message}`);
        }
        
        const { AutoTokenizer, env } = transformersModule;
        
        // Configure environment for browser usage
        env.allowRemoteModels = true;
        env.remoteURL = 'https://huggingface.co/';
        
        console.log('Loading SmolLM2-360M-Instruct tokenizer...');
        
        // Load the SmolLM2 tokenizer
        // Note: SmolLM2 uses standard GPT-style tokenization, should work well with Transformers.js
        console.log('Attempting to load from HuggingFaceTB/SmolLM2-360M-Instruct...');
        const tokenizer = await AutoTokenizer.from_pretrained('HuggingFaceTB/SmolLM2-360M-Instruct', {
            progress_callback: (progress) => {
                console.log(`Tokenizer loading progress: ${JSON.stringify(progress)}`);
            }
        });
        
        // Create a wrapper class that matches our expected interface
        window.TransformersTokenizer = class {
            constructor() {
                this.tokenizer = tokenizer;
                console.log('✅ SmolLM2 tokenizer loaded successfully');
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
        console.error('❌ CRITICAL: Failed to load Transformers.js:', error);
        console.error('Error details:', error.message, error.stack);
        throw error; // NO FALLBACKS - fail fast for debugging
    }
}

// Auto-load on script load
loadTransformersTokenizer();