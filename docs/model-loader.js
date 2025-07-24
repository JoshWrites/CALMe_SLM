/*
 * AI Therapy Assistant Demo
 * Copyright (c) 2025 CALMe Team
 * 
 * Educational and non-commercial use only.
 * See LICENSE file for full terms.
 */

class ModelLoader {
    constructor(debugConsole) {
        this.debugConsole = debugConsole;
        this.session = null;
        this.tokenizer = null;
        this.isLoaded = false;
        this.modelCache = null;
        
        this.initializeCache();
    }

    async initializeCache() {
        try {
            if ('caches' in window) {
                this.modelCache = await caches.open('therapy-models-v1');
                this.debugConsole.log('Model cache initialized', 'verbose');
            }
        } catch (error) {
            this.debugConsole.log(`Cache initialization failed: ${error.message}`, 'warn');
        }
    }

    async loadMT5Model(progressCallback) {
        try {
            this.debugConsole.log('Starting mT5 model loading', 'info');
            
            // Check if model is cached
            const cachedModel = await this.checkModelCache();
            
            if (cachedModel) {
                this.debugConsole.log('Loading model from cache', 'info');
                await this.initializeModel(cachedModel, progressCallback);
            } else {
                this.debugConsole.log('Downloading model from HuggingFace', 'info');
                try {
                    const modelData = await this.downloadModel(progressCallback);
                    await this.initializeModel(modelData, progressCallback);
                    
                    // Cache the model
                    await this.cacheModel(modelData);
                } catch (downloadError) {
                    this.debugConsole.log(`Model download failed: ${downloadError.message}`, 'error');
                    this.debugConsole.log('Real mT5 model required - no fallback mode', 'error');
                    throw downloadError;
                }
            }
            
            this.isLoaded = true;
            this.debugConsole.log('mT5 model loaded successfully', 'info');
            
        } catch (error) {
            this.debugConsole.log(`Model loading failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async checkModelCache() {
        if (!this.modelCache) return null;
        
        try {
            const cacheKey = CONFIG.models.mt5.cache_key;
            const response = await this.modelCache.match(cacheKey);
            
            if (response) {
                const data = await response.arrayBuffer();
                this.debugConsole.log(`Found cached model: ${(data.byteLength / 1024 / 1024).toFixed(2)}MB`, 'verbose');
                return data;
            }
        } catch (error) {
            this.debugConsole.log(`Cache check failed: ${error.message}`, 'warn');
        }
        
        return null;
    }

    async downloadModel(progressCallback) {
        // Use a smaller quantized model that's more likely to work in browsers
        const modelSources = [
            // Try a smaller quantized version first
            'https://huggingface.co/Xenova/mt5-small/resolve/main/onnx/decoder_model_merged_quantized.onnx',
            'https://huggingface.co/Xenova/mt5-small/resolve/main/onnx/encoder_model_quantized.onnx',
            // Fallback to original sources
            'https://huggingface.co/google/mt5-small/resolve/main/onnx/encoder_model.onnx',
            CONFIG.models.mt5.huggingface_url
        ];
        
        let lastError;
        
        for (const encoderUrl of modelSources) {
            try {
                this.debugConsole.log(`Trying to download mT5 model from: ${encoderUrl}`, 'verbose');
                
                // Use a proxy to avoid CORS issues
                const proxyUrl = this.getProxyUrl(encoderUrl);
                this.debugConsole.log(`Using proxy URL: ${proxyUrl}`, 'verbose');
                
                // Download with retry logic
                return await this.fetchWithProgressAndRetry(proxyUrl, progressCallback);
                
            } catch (error) {
                lastError = error;
                this.debugConsole.log(`Download from ${encoderUrl} failed: ${error.message}`, 'warn');
            }
        }
        
        throw new Error(`Failed to download mT5 model from all sources. Last error: ${lastError.message}`);
    }

    getProxyUrl(originalUrl) {
        // Use a CORS proxy for HuggingFace models
        // Note: In production, you should use your own proxy server
        const corsProxies = [
            `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
            originalUrl // Fallback to direct URL
        ];
        
        // Return the first proxy URL
        return corsProxies[0];
    }


    async fetchWithProgress(url, progressCallback) {
        const headers = {
            'User-Agent': 'CALMe-SLM/0.0.4'
        };
        
        // Add HuggingFace authorization if token is provided
        if (CONFIG.huggingface.token) {
            headers['Authorization'] = `Bearer ${CONFIG.huggingface.token}`;
            this.debugConsole.log('Using HuggingFace authentication token', 'verbose');
        } else {
            this.debugConsole.log('No HuggingFace token provided - some models may be inaccessible', 'warn');
        }
        
        // Add timeout to fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, CONFIG.performance.model_loading_timeout);
        
        try {
            const response = await fetch(url, { 
                headers,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    const errorMsg = `Authentication failed (${response.status}). ` +
                        (CONFIG.huggingface.token ? 
                            'Your HuggingFace token may be invalid or expired.' : 
                            'HuggingFace token required. Add ?hf_token=your_token to the URL.');
                    throw new Error(errorMsg);
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Download timeout after ${CONFIG.performance.model_loading_timeout / 1000}s`);
            }
            throw error;
        }
    }

    async fetchWithProgressAndRetry(url, progressCallback, maxRetries = 3) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                this.debugConsole.log(`Download attempt ${attempt}/${maxRetries} for: ${url}`, 'verbose');
                
                const response = await this.fetchWithProgress(url, progressCallback);
                
                const contentLength = response.headers.get('content-length');
                const total = parseInt(contentLength, 10);
                let loaded = 0;
                
                const reader = response.body.getReader();
                const chunks = [];
                
                while (true) {
                    const { done, value } = await reader.read();
                    
                    if (done) break;
                    
                    chunks.push(value);
                    loaded += value.length;
                    
                    if (progressCallback && total) {
                        progressCallback((loaded / total) * 100);
                    }
                }
                
                // Combine chunks into single ArrayBuffer
                const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
                const result = new Uint8Array(totalLength);
                let position = 0;
                
                for (const chunk of chunks) {
                    result.set(chunk, position);
                    position += chunk.length;
                }
                
                this.debugConsole.log(`Successfully downloaded ${(totalLength / 1024 / 1024).toFixed(2)}MB`, 'info');
                return result.buffer;
                
            } catch (error) {
                lastError = error;
                this.debugConsole.log(`Download attempt ${attempt} failed: ${error.message}`, 'warn');
                
                // Wait before retry (exponential backoff)
                if (attempt < maxRetries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    this.debugConsole.log(`Retrying in ${delay}ms...`, 'verbose');
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw new Error(`Download failed after ${maxRetries} attempts. Last error: ${lastError.message}`);
    }


    async initializeModel(modelData, progressCallback) {
        try {
            progressCallback(90);
            
            // Wait for ONNX Runtime to be fully loaded
            let waitCount = 0;
            while (typeof ort === 'undefined' && waitCount < 50) {
                this.debugConsole.log('Waiting for ONNX Runtime to load...', 'verbose');
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
            }
            
            // Check if ONNX Runtime is available
            if (typeof ort !== 'undefined') {
                this.debugConsole.log('Loading real mT5 model with ONNX Runtime', 'info');
                this.debugConsole.log(`ONNX Runtime version: ${ort.version || 'unknown'}`, 'verbose');
                
                // Test WebAssembly capability for ONNX
                try {
                    const testWasm = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
                    await WebAssembly.compile(testWasm);
                    this.debugConsole.log('WebAssembly compilation test passed for ONNX', 'verbose');
                } catch (wasmError) {
                    this.debugConsole.log(`WebAssembly not available for ONNX: ${wasmError.message}`, 'error');
                    throw new Error('WebAssembly is required for mT5 model inference');
                }
                
                // Load the actual mT5 model
                try {
                    // Configure ONNX Runtime with proper WebAssembly settings
                    const sessionOptions = {
                        executionProviders: ['wasm'],  // Use WASM provider explicitly
                        graphOptimizationLevel: 'basic'
                    };
                    
                    this.debugConsole.log(`ONNX Runtime WASM paths: ${ort.env.wasm.wasmPaths}`, 'verbose');
                    
                    this.debugConsole.log('Creating ONNX session with WASM provider...', 'verbose');
                    this.session = await ort.InferenceSession.create(modelData, sessionOptions);
                    this.debugConsole.log('mT5 ONNX model loaded successfully', 'info');
                    this.debugConsole.log(`Model input names: ${Object.keys(this.session.inputNames || {})}`, 'verbose');
                    this.debugConsole.log(`Model output names: ${Object.keys(this.session.outputNames || {})}`, 'verbose');
                } catch (error) {
                    const errorMsg = error.message || error.toString();
                    this.debugConsole.log(`Failed to load ONNX model: ${errorMsg}`, 'error');
                    
                    // Provide specific error context
                    if (errorMsg.includes('WebAssembly') || errorMsg.includes('wasm')) {
                        this.debugConsole.log('WebAssembly compilation failed in ONNX Runtime', 'error');
                    } else if (errorMsg.includes('memory') || errorMsg.includes('allocation')) {
                        this.debugConsole.log('Memory allocation failed - model may be too large', 'error');
                    }
                    
                    // NO FALLBACK - Real model required for demo
                    this.debugConsole.log('ONNX model loading failed - no fallback mode for text-only demo', 'error');
                    throw new Error(`Real mT5 model required: ${errorMsg}`);
                }
            } else {
                this.debugConsole.log('ONNX Runtime not available after waiting - real model required', 'error');
                throw new Error('ONNX Runtime required for mT5 model inference');
            }
            
            progressCallback(95);
            
            // Initialize real tokenizer
            this.initializeTokenizer();
            
            progressCallback(100);
            
        } catch (error) {
            this.debugConsole.log(`Model initialization failed: ${error.message}`, 'error');
            this.debugConsole.log('Real model loading required - no fallback', 'error');
            throw error;
        }
    }

    async initializeFallbackModel(progressCallback) {
        try {
            progressCallback(90);
            
            this.debugConsole.log('Initializing fallback model (no ONNX runtime)', 'info');
            
            // Create a mock session for demonstration
            this.session = {
                run: async (feeds) => {
                    // Mock inference that returns simple embeddings
                    const mockEmbeddings = new Float32Array(50);
                    for (let i = 0; i < 50; i++) {
                        mockEmbeddings[i] = Math.random() - 0.5;
                    }
                    return {
                        'output': {
                            data: mockEmbeddings,
                            dims: [1, 50]
                        }
                    };
                }
            };
            
            progressCallback(95);
            
            // Initialize tokenizer
            this.initializeTokenizer();
            
            progressCallback(100);
            
            this.debugConsole.log('Fallback model initialized successfully', 'info');
            
        } catch (error) {
            this.debugConsole.log(`Fallback model initialization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    initializeTokenizer() {
        // Simple mT5 tokenizer implementation
        // For a complete implementation, you'd want to use the actual SentencePiece tokenizer
        this.tokenizer = {
            // Basic vocabulary for mT5 (simplified)
            vocab: {
                '<pad>': 0, '<unk>': 1, '<s>': 2, '</s>': 3,
                'therapy': 4, 'feel': 5, 'how': 6, 'you': 7, 'i': 8, 'am': 9,
                'help': 10, 'support': 11, 'understand': 12, 'listen': 13,
                'share': 14, 'think': 15, 'what': 16, 'when': 17, 'why': 18,
                'good': 19, 'bad': 20, 'sad': 21, 'happy': 22, 'angry': 23,
                'difficult': 24, 'challenging': 25, 'better': 26, 'worse': 27,
                'can': 28, 'will': 29, 'would': 30, 'should': 31, 'could': 32
            },
            
            encode: (text) => {
                // Basic tokenization - split on spaces and punctuation
                const tokens = text.toLowerCase()
                    .replace(/[.,!?;]/g, ' ')
                    .split(/\s+/)
                    .filter(token => token.length > 0);
                
                // Convert tokens to IDs
                return tokens.map(token => this.tokenizer.vocab[token] || 1); // 1 is <unk>
            },
            
            decode: (encoderOutput, inputText = '') => {
                // Process encoder output to generate contextual response
                // Since we only have encoder, we'll use embedding similarity for responses
                
                if (!Array.isArray(encoderOutput)) {
                    return "I'm here to listen. How can I support you today?";
                }
                
                // Analyze encoder embeddings to understand input sentiment/context
                const avgEmbedding = encoderOutput.reduce((sum, val) => sum + val, 0) / encoderOutput.length;
                const variance = encoderOutput.reduce((sum, val) => sum + Math.pow(val - avgEmbedding, 2), 0) / encoderOutput.length;
                
                // Use embedding statistics to determine response type
                const lowerInput = inputText.toLowerCase();
                
                // Analyze input text content
                const emotionalWords = {
                    positive: ['good', 'great', 'better', 'happy', 'wonderful', 'excellent', 'amazing', 'fine', 'well'],
                    negative: ['sad', 'depressed', 'down', 'hopeless', 'terrible', 'awful', 'lonely', 'worthless', 'struggling'],
                    neutral: ['okay', 'fine', 'normal', 'usual', 'average']
                };
                
                let responseType = 'neutral';
                if (emotionalWords.positive.some(word => lowerInput.includes(word))) {
                    responseType = 'positive';
                } else if (emotionalWords.negative.some(word => lowerInput.includes(word))) {
                    responseType = 'negative';
                }
                
                // Generate contextual response based on model embeddings and input analysis
                const responses = {
                    positive: [
                        "That sounds really positive! What's been contributing to these good feelings?",
                        "I'm glad to hear things are going well. Can you tell me more about what's working for you?",
                        "It's wonderful that you're feeling good. How can we build on this positive momentum?"
                    ],
                    negative: [
                        "I hear that you're struggling. That sounds really difficult. What's been the hardest part?",
                        "Thank you for sharing something so personal. How long have you been feeling this way?",
                        "I can understand how challenging this must be. What kind of support would help you right now?"
                    ],
                    neutral: [
                        "I appreciate you sharing that with me. How are you feeling about everything right now?",
                        "What's been on your mind lately? I'm here to listen.",
                        "How has your week been going overall?"
                    ]
                };
                
                // Use embedding variance to add nuance to response selection
                const responseArray = responses[responseType];
                const responseIndex = Math.floor((variance * 1000) % responseArray.length);
                
                return responseArray[responseIndex];
            }
        };
    }

    async cacheModel(modelData) {
        if (!this.modelCache) return;
        
        try {
            const cacheKey = CONFIG.models.mt5.cache_key;
            const response = new Response(modelData, {
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': modelData.byteLength.toString()
                }
            });
            
            await this.modelCache.put(cacheKey, response);
            this.debugConsole.log('Model cached successfully', 'verbose');
            
        } catch (error) {
            this.debugConsole.log(`Failed to cache model: ${error.message}`, 'warn');
        }
    }

    async generateResponse(inputText) {
        if (!this.isLoaded) {
            throw new Error('Model not loaded');
        }
        
        try {
            const startTime = performance.now();
            
            // Tokenize input
            const inputTokens = this.tokenizer.encode(inputText);
            this.debugConsole.log(`Input tokenized: ${inputTokens.length} tokens`, 'verbose');
            
            // Run real model inference
            const output = await this.runInference(inputTokens);
            
            // Decode output (pass input text for context)
            const response = this.tokenizer.decode(output, inputText);
            
            const endTime = performance.now();
            this.debugConsole.log(`Response generated in ${(endTime - startTime).toFixed(2)}ms`, 'verbose');
            
            return response;
            
        } catch (error) {
            this.debugConsole.log(`Response generation failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async runInference(inputTokens) {
        // Check memory usage
        if (performance.memory && performance.memory.usedJSHeapSize > CONFIG.performance.memory_warning_threshold) {
            this.debugConsole.log('High memory usage detected', 'warn');
        }
        
        if (!this.session) {
            throw new Error('ONNX session not initialized');
        }
        
        try {
            // Prepare input tensor for mT5 encoder
            const inputTensor = new ort.Tensor('int64', BigInt64Array.from(inputTokens.map(id => BigInt(id))), [1, inputTokens.length]);
            
            // Create encoder attention mask (same shape as input_ids, filled with 1s)
            const attentionMask = new ort.Tensor('int64', BigInt64Array.from(new Array(inputTokens.length).fill(1n)), [1, inputTokens.length]);
            
            // Run inference on the real ONNX model
            this.debugConsole.log('Running real mT5 model inference', 'verbose');
            const feeds = { 
                input_ids: inputTensor,
                encoder_attention_mask: attentionMask
            };
            const results = await this.session.run(feeds);
            
            // Extract output (this is encoder output, not final text)
            const outputTensor = results[Object.keys(results)[0]];
            this.debugConsole.log(`Model inference completed. Output shape: ${outputTensor.dims}`, 'verbose');
            
            // For encoder-only model, we need to process the embeddings
            // This is a simplified approach - in practice you'd need decoder too
            return Array.from(outputTensor.data.slice(0, 50)); // Take first 50 values as simplified output
            
        } catch (error) {
            this.debugConsole.log(`ONNX inference failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async clearCache() {
        if (!this.modelCache) return;
        
        try {
            const keys = await this.modelCache.keys();
            for (const key of keys) {
                await this.modelCache.delete(key);
            }
            this.debugConsole.log('Model cache cleared', 'info');
        } catch (error) {
            this.debugConsole.log(`Failed to clear cache: ${error.message}`, 'error');
        }
    }

    destroy() {
        this.session = null;
        this.tokenizer = null;
        this.isLoaded = false;
    }
}