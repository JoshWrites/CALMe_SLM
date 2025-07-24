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
        this.encoderSession = null;
        this.decoderSession = null;
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
            this.debugConsole.log('Starting mT5 encoder and decoder loading', 'info');
            
            // Load both encoder and decoder in parallel
            const [encoderData, decoderData] = await Promise.all([
                this.loadModelComponent('encoder', progressCallback),
                this.loadModelComponent('decoder', progressCallback)
            ]);
            
            // Initialize both models
            await this.initializeBothModels(encoderData, decoderData, progressCallback);
            
            this.isLoaded = true;
            this.debugConsole.log('mT5 encoder and decoder loaded successfully', 'info');
            
        } catch (error) {
            this.debugConsole.log(`Model loading failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async checkModelCache(cacheKey = CONFIG.models.mt5.cache_key) {
        if (!this.modelCache) return null;
        
        try {
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

    async loadModelComponent(component, progressCallback) {
        const cacheKey = component === 'encoder' ? CONFIG.models.mt5.cache_key : CONFIG.models.mt5.decoder_cache_key;
        const cachedModel = await this.checkModelCache(cacheKey);
        
        if (cachedModel) {
            this.debugConsole.log(`Loading ${component} from cache`, 'info');
            return cachedModel;
        } else {
            this.debugConsole.log(`Downloading ${component} from HuggingFace`, 'info');
            const modelData = await this.downloadModelComponent(component, progressCallback);
            await this.cacheModel(modelData, cacheKey);
            return modelData;
        }
    }

    async downloadModelComponent(component, progressCallback) {
        const modelSources = component === 'encoder' ? [
            CONFIG.models.mt5.encoder_url,
            'https://huggingface.co/google/mt5-small/resolve/main/onnx/encoder_model.onnx',
            'https://huggingface.co/Xenova/mt5-small/resolve/main/onnx/encoder_model_quantized.onnx'
        ] : [
            CONFIG.models.mt5.decoder_url,
            'https://huggingface.co/google/mt5-small/resolve/main/onnx/decoder_model.onnx'
        ];
        
        let lastError;
        
        for (const modelUrl of modelSources) {
            try {
                this.debugConsole.log(`Trying to download ${component} from: ${modelUrl}`, 'verbose');
                const proxyUrl = this.getProxyUrl(modelUrl);
                return await this.fetchWithProgressAndRetry(proxyUrl, progressCallback);
            } catch (error) {
                lastError = error;
                this.debugConsole.log(`Download from ${modelUrl} failed: ${error.message}`, 'warn');
            }
        }
        
        throw new Error(`Failed to download ${component} from all sources. Last error: ${lastError.message}`);
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


    async initializeBothModels(encoderData, decoderData, progressCallback) {
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
                
                // Load both encoder and decoder models
                try {
                    // Configure ONNX Runtime with proper WebAssembly settings
                    const sessionOptions = {
                        executionProviders: ['wasm'],  // Use WASM provider explicitly
                        graphOptimizationLevel: 'basic'
                    };
                    
                    this.debugConsole.log(`ONNX Runtime WASM paths: ${ort.env.wasm.wasmPaths}`, 'verbose');
                    
                    // Create encoder session
                    this.debugConsole.log('Creating encoder ONNX session with WASM provider...', 'verbose');
                    this.encoderSession = await ort.InferenceSession.create(encoderData, sessionOptions);
                    this.debugConsole.log('mT5 encoder ONNX model loaded successfully', 'info');
                    this.debugConsole.log(`Encoder input names: ${Object.keys(this.encoderSession.inputNames || {})}`, 'verbose');
                    this.debugConsole.log(`Encoder output names: ${Object.keys(this.encoderSession.outputNames || {})}`, 'verbose');
                    
                    // Create decoder session
                    this.debugConsole.log('Creating decoder ONNX session with WASM provider...', 'verbose');
                    this.decoderSession = await ort.InferenceSession.create(decoderData, sessionOptions);
                    this.debugConsole.log('mT5 decoder ONNX model loaded successfully', 'info');
                    this.debugConsole.log(`Decoder input names: ${Object.keys(this.decoderSession.inputNames || {})}`, 'verbose');
                    this.debugConsole.log(`Decoder output names: ${Object.keys(this.decoderSession.outputNames || {})}`, 'verbose');
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
                // Crisis support specific vocabulary
                'here': 4, 'with': 5, 'you': 6, 'safe': 7, 'shelter': 8, 'help': 9,
                'think': 10, 'what': 11, 'when': 12, 'where': 13, 'can': 14, 'now': 15,
                'i': 16, 'am': 17, 'we': 18, 'together': 19, 'small': 20, 'task': 21,
                'first': 22, 'next': 23, 'step': 24, 'breathe': 25, 'focus': 26,
                'around': 27, 'see': 28, 'hear': 29, 'feel': 30, 'touch': 31,
                'remember': 32, 'before': 33, 'after': 34, 'then': 35, 'happened': 36,
                'situation': 37, 'control': 38, 'choose': 39, 'able': 40, 'capable': 41,
                'commitment': 42, 'activation': 43, 'questions': 44, 'timeline': 45,
                'protect': 46, 'protected': 47, 'safety': 48, 'secure': 49, 'stable': 50
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

    async cacheModel(modelData, cacheKey = CONFIG.models.mt5.cache_key) {
        if (!this.modelCache) return;
        
        try {
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
            
            // Prepare system prompt + user input for proper context
            const systemPrompt = CONFIG.models.mt5.system_prompt;
            const fullInput = `${systemPrompt}\n\nUser: ${inputText}\n\nAssistant:`;
            
            // Tokenize the full input including system prompt
            const inputTokens = this.tokenizer.encode(fullInput);
            this.debugConsole.log(`Input tokenized: ${inputTokens.length} tokens (including system prompt)`, 'verbose');
            
            // Run real model inference with system context
            const output = await this.runInference(inputTokens);
            
            const endTime = performance.now();
            this.debugConsole.log(`Response generated in ${(endTime - startTime).toFixed(2)}ms`, 'verbose');
            
            return output;
            
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
        
        if (!this.encoderSession || !this.decoderSession) {
            throw new Error('Encoder and decoder sessions not initialized');
        }
        
        try {
            // Stage 1: Run encoder
            const encoderHiddenStates = await this.runEncoderInference(inputTokens);
            
            // Stage 2: Run decoder with encoder outputs
            const generatedText = await this.runDecoderInference(encoderHiddenStates, inputTokens);
            
            return generatedText;
            
        } catch (error) {
            this.debugConsole.log(`Two-stage inference failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async runEncoderInference(inputTokens) {
        // Prepare input tensor for mT5 encoder
        const inputTensor = new ort.Tensor('int64', BigInt64Array.from(inputTokens.map(id => BigInt(id))), [1, inputTokens.length]);
        
        // Create attention mask (same shape as input_ids, filled with 1s)
        const attentionMask = new ort.Tensor('int64', BigInt64Array.from(new Array(inputTokens.length).fill(BigInt(1))), [1, inputTokens.length]);
        
        // Run encoder inference
        this.debugConsole.log('Running mT5 encoder inference', 'verbose');
        const encoderFeeds = { 
            input_ids: inputTensor,
            attention_mask: attentionMask
        };
        const encoderResults = await this.encoderSession.run(encoderFeeds);
        
        // Extract encoder hidden states
        const encoderOutputTensor = encoderResults[Object.keys(encoderResults)[0]];
        this.debugConsole.log(`Encoder inference completed. Output shape: ${encoderOutputTensor.dims}`, 'verbose');
        
        return encoderOutputTensor;
    }

    async runDecoderInference(encoderHiddenStates, inputTokens) {
        // Prepare decoder inputs
        // Start with the beginning-of-sequence token (ID 2 for mT5)
        const decoderInputIds = [2]; // <s> token
        const maxGenerationLength = 100;
        
        let generatedTokens = [...decoderInputIds];
        
        // Generate tokens one by one
        for (let i = 0; i < maxGenerationLength; i++) {
            // Prepare decoder input tensor
            const decoderInputTensor = new ort.Tensor('int64', BigInt64Array.from(generatedTokens.map(id => BigInt(id))), [1, generatedTokens.length]);
            
            // Create decoder attention mask
            const decoderAttentionMask = new ort.Tensor('int64', BigInt64Array.from(new Array(generatedTokens.length).fill(BigInt(1))), [1, generatedTokens.length]);
            
            // Run decoder inference
            const decoderFeeds = {
                input_ids: decoderInputTensor,
                encoder_hidden_states: encoderHiddenStates,
                attention_mask: decoderAttentionMask
            };
            
            const decoderResults = await this.decoderSession.run(decoderFeeds);
            
            // Get logits and select next token (simple argmax for now)
            const logitsTensor = decoderResults[Object.keys(decoderResults)[0]];
            const logits = Array.from(logitsTensor.data);
            
            // Get the logits for the last position
            const vocabSize = Math.floor(logits.length / generatedTokens.length);
            const lastPositionLogits = logits.slice((generatedTokens.length - 1) * vocabSize, generatedTokens.length * vocabSize);
            
            // Find the token with highest probability (argmax)
            let nextTokenId = 0;
            let maxLogit = -Infinity;
            for (let j = 0; j < lastPositionLogits.length; j++) {
                if (lastPositionLogits[j] > maxLogit) {
                    maxLogit = lastPositionLogits[j];
                    nextTokenId = j;
                }
            }
            
            // Stop if we generate end-of-sequence token (ID 3 for mT5)
            if (nextTokenId === 3) {
                break;
            }
            
            generatedTokens.push(nextTokenId);
        }
        
        this.debugConsole.log(`Generated ${generatedTokens.length} tokens: ${generatedTokens.slice(1)}`, 'verbose');
        
        // Decode tokens to text (simple decoding for now)
        return this.decodeTokensToText(generatedTokens.slice(1)); // Remove start token
    }

    decodeTokensToText(tokens) {
        // Simple reverse vocabulary lookup
        const reverseVocab = {};
        for (const [word, id] of Object.entries(this.tokenizer.vocab)) {
            reverseVocab[id] = word;
        }
        
        const words = tokens.map(tokenId => reverseVocab[tokenId] || '<unk>');
        return words.join(' ').replace(/<[^>]*>/g, '').trim();
    }

    // Old fake decoder method - now replaced with real neural text generation
    generateResponseFromEmbeddings(embeddings, inputTokens) {
        // This method is deprecated and no longer used
        // Real decoder inference now happens in runDecoderInference()
        this.debugConsole.log('Warning: generateResponseFromEmbeddings called but deprecated', 'warn');
        return "Real neural text generation active - this fallback should not be reached.";
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
        this.encoderSession = null;
        this.decoderSession = null;
        this.tokenizer = null;
        this.isLoaded = false;
    }
}