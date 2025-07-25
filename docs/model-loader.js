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
        this.modelSession = null;
        this.tokenizer = null;
        this.isLoaded = false;
        this.modelCache = null;
        
        // Memory monitoring properties
        this.memoryStats = {
            lastCheck: 0,
            peakUsage: 0,
            warningThreshold: 0.8 // 80% of available memory
        };
        
        this.initializeCache();
        this.setupMemoryMonitoring();
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

    setupMemoryMonitoring() {
        // Set up periodic memory monitoring
        if (performance.memory) {
            this.memoryMonitorInterval = setInterval(() => {
                const memInfo = performance.memory;
                const usedMemoryMB = memInfo.usedJSHeapSize / 1024 / 1024;
                
                // Track peak usage
                if (usedMemoryMB > this.memoryStats.peakUsage) {
                    this.memoryStats.peakUsage = usedMemoryMB;
                }
                
                // Log significant memory changes
                const timeSinceLastCheck = Date.now() - this.memoryStats.lastCheck;
                if (timeSinceLastCheck > 30000) { // Every 30 seconds
                    this.debugConsole.log(`Memory monitoring: ${usedMemoryMB.toFixed(2)}MB used (peak: ${this.memoryStats.peakUsage.toFixed(2)}MB)`, 'verbose');
                    this.memoryStats.lastCheck = Date.now();
                }
            }, 5000); // Check every 5 seconds
        }
    }

    checkMemoryAvailability(requiredMB) {
        if (!performance.memory) {
            this.debugConsole.log('Memory monitoring not available - proceeding without checks', 'warn');
            return true;
        }
        
        const memInfo = performance.memory;
        const availableMemoryMB = (memInfo.jsHeapSizeLimit - memInfo.usedJSHeapSize) / 1024 / 1024;
        
        if (availableMemoryMB < requiredMB) {
            this.debugConsole.log(`Insufficient memory: ${availableMemoryMB.toFixed(2)}MB available, ${requiredMB}MB required`, 'error');
            return false;
        }
        
        this.debugConsole.log(`Memory check passed: ${availableMemoryMB.toFixed(2)}MB available, ${requiredMB}MB required`, 'verbose');
        return true;
    }

    async loadSmolLM2Model(progressCallback) {
        try {
            this.debugConsole.log('Loading SmolLM2-360M-Instruct model', 'info');

            // Memory check for SmolLM2 model
            const requiredMemoryMB = 450; // ~400MB model + overhead
            if (!this.checkMemoryAvailability(requiredMemoryMB)) {
                throw new Error(`Insufficient memory for SmolLM2 model. Required: ${requiredMemoryMB}MB`);
            }

            // Load SmolLM2 model
            const modelData = await this.loadModelComponent('smollm2', progressCallback);

            // Initialize SmolLM2 model
            await this.initializeSmolLM2Model(modelData, progressCallback);

            this.isLoaded = true;
            this.debugConsole.log('SmolLM2-360M-Instruct model loaded successfully', 'info');

        } catch (error) {
            this.debugConsole.log(`SmolLM2 model loading failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async loadModelComponent(component, progressCallback) {
        const cacheKey = CONFIG.models.smollm2.cache_key;
        
        // Skip cache for debugging - always download fresh
        this.debugConsole.log(`Skipping cache, downloading ${component} fresh from HuggingFace`, 'info');
        this.debugConsole.log(`Cache key would be: ${cacheKey}`, 'verbose');
        
        const modelData = await this.downloadModelComponent(component, progressCallback);
        await this.cacheModel(modelData, cacheKey);
        return modelData;
    }

    async downloadModelComponent(component, progressCallback) {
        const modelSources = [
            CONFIG.models.smollm2.model_url,
            ...CONFIG.models.smollm2.fallback_urls
        ];
        
        this.debugConsole.log(`Download sources: ${JSON.stringify(modelSources)}`, 'info');
        
        let lastError;
        
        for (const modelUrl of modelSources) {
            try {
                this.debugConsole.log(`Trying to download ${component} from: ${modelUrl}`, 'verbose');
                const proxyUrl = this.getProxyUrl(modelUrl);
                this.debugConsole.log(`Proxy URL: ${proxyUrl}`, 'verbose');
                return await this.fetchWithProgressAndRetry(proxyUrl, progressCallback);
            } catch (error) {
                lastError = error;
                this.debugConsole.log(`Download from ${modelUrl} failed: ${error.message}`, 'error');
                this.debugConsole.log(`Error details: ${error.stack}`, 'verbose');
            }
        }
        
        throw new Error(`Failed to download ${component} from all sources. Last error: ${lastError.message}`);
    }

    getProxyUrl(originalUrl) {
        // Try direct URL first since HuggingFace allows CORS for ONNX models
        try {
            const url = new URL(originalUrl);
            if (url.hostname === 'huggingface.co' || url.hostname.endsWith('.huggingface.co')) {
                // Direct download from HuggingFace - should work with CORS
                return originalUrl;
            } else {
                // For other sources, might need proxy
                return `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`;
            }
        } catch (error) {
            this.debugConsole.log(`Invalid URL ${originalUrl}, trying as-is`, 'warn');
            return originalUrl;
        }
    }

    async fetchWithProgressAndRetry(url, progressCallback, retries = 3) {
        const retryDelays = [1000, 2000, 5000]; // Progressive delays
        
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                return await this.fetchWithProgress(url, progressCallback);
            } catch (error) {
                if (attempt < retries - 1) {
                    const delay = retryDelays[attempt];
                    this.debugConsole.log(`Fetch attempt ${attempt + 1} failed: ${error.message}. Retrying in ${delay}ms...`, 'warn');
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    throw error;
                }
            }
        }
    }

    async fetchWithProgress(url, progressCallback) {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const contentLength = parseInt(response.headers.get('content-length') || '0');
        const reader = response.body.getReader();
        const chunks = [];
        let receivedLength = 0;

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            chunks.push(value);
            receivedLength += value.length;
            
            if (contentLength > 0 && progressCallback) {
                const progress = Math.min((receivedLength / contentLength) * 100, 99);
                progressCallback(progress);
            }
        }
        
        // Combine chunks into single ArrayBuffer
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        
        return result.buffer;
    }

    async checkModelCache(cacheKey) {
        if (!this.modelCache) return null;
        
        try {
            const response = await this.modelCache.match(cacheKey);
            if (response) {
                this.debugConsole.log(`Model found in cache: ${cacheKey}`, 'verbose');
                return await response.arrayBuffer();
            }
            return null;
        } catch (error) {
            this.debugConsole.log(`Cache check failed: ${error.message}`, 'warn');
            return null;
        }
    }

    async initializeSmolLM2Model(modelData, progressCallback) {
        try {
            progressCallback(90);

            // Wait for ONNX Runtime
            let waitCount = 0;
            while (typeof ort === 'undefined' && waitCount < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
            }

            if (typeof ort === 'undefined') {
                throw new Error('ONNX Runtime required for SmolLM2 model inference');
            }

            // Try CPU execution first (more compatible than WASM)
            const sessionOptions = {
                executionProviders: ['cpu'],
                graphOptimizationLevel: 'disabled'
            };

            // Create SmolLM2 model session
            this.debugConsole.log('Creating SmolLM2 ONNX session...', 'verbose');
            this.debugConsole.log(`Model data size: ${modelData.byteLength / 1024 / 1024}MB`, 'verbose');
            this.debugConsole.log(`Session options: ${JSON.stringify(sessionOptions)}`, 'verbose');
            
            try {
                // Validate model data first
                this.debugConsole.log(`Model validation: ${modelData.byteLength > 0 ? 'Valid' : 'Invalid'} ArrayBuffer`, 'verbose');
                
                this.debugConsole.log('Starting ONNX session creation...', 'verbose');
                
                // Very short timeout for debugging
                const sessionPromise = ort.InferenceSession.create(modelData, sessionOptions);
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('ONNX session creation timeout after 15s - model too complex for browser')), 15000)
                );
                
                this.modelSession = await Promise.race([sessionPromise, timeoutPromise]);
                
                this.debugConsole.log('SmolLM2 model loaded successfully', 'info');
                this.debugConsole.log(`Model inputs: ${JSON.stringify(this.modelSession.inputNames)}`, 'verbose');
                this.debugConsole.log(`Model outputs: ${JSON.stringify(this.modelSession.outputNames)}`, 'verbose');
            } catch (ortError) {
                this.debugConsole.log(`ONNX Runtime error: ${ortError.message}`, 'error');
                this.debugConsole.log(`ONNX Runtime stack: ${ortError.stack}`, 'error');
                
                // Try with even simpler options
                this.debugConsole.log('Retrying with minimal session options...', 'info');
                try {
                    this.modelSession = await ort.InferenceSession.create(modelData, {});
                    this.debugConsole.log('SmolLM2 model loaded with minimal options', 'info');
                } catch (fallbackError) {
                    throw new Error(`ONNX model loading failed: ${ortError.message}`);
                }
            }

            progressCallback(95);
            await this.initializeTokenizer();
            progressCallback(100);

        } catch (error) {
            this.debugConsole.log(`SmolLM2 model initialization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async initializeTokenizer() {
        // Load SmolLM2 tokenizer using Transformers.js - NO FALLBACKS
        this.debugConsole.log('Loading SmolLM2 tokenizer using Transformers.js', 'info');
        
        // Wait for Transformers.js to load if not ready
        let retries = 0;
        while (typeof window.TransformersTokenizer === 'undefined' && retries < 30) {
            this.debugConsole.log(`Waiting for Transformers.js library... (${retries + 1}/30)`, 'verbose');
            await new Promise(resolve => setTimeout(resolve, 1000));
            retries++;
        }
        
        if (typeof window.TransformersTokenizer === 'undefined') {
            throw new Error('Transformers.js library not loaded after 30 seconds - STOPPING');
        }
        
        this.transformersTokenizer = new window.TransformersTokenizer();
        this.debugConsole.log('✅ SmolLM2 tokenizer loaded successfully via Transformers.js', 'info');
        
        // Create SmolLM2 tokenizer wrapper - NO FALLBACKS
        this.tokenizer = {
            encode: async (text) => {
                this.debugConsole.log(`Encoding text: "${text}"`, 'verbose');
                const result = await this.transformersTokenizer.encodeIds(text);
                this.debugConsole.log(`Encoded to ${result.length} tokens: ${result.slice(0, 10)}...`, 'verbose');
                return result;
            },
            decode: async (tokens) => {
                this.debugConsole.log(`Decoding ${tokens.length} tokens: ${tokens.slice(0, 10)}...`, 'verbose');
                const result = await this.transformersTokenizer.decodeIds(tokens);
                this.debugConsole.log(`Decoded to: "${result}"`, 'verbose');
                return result;
            }
        };
        
        this.debugConsole.log('SmolLM2 tokenizer wrapper initialized successfully', 'info');
    }

    async cacheModel(modelData, cacheKey = CONFIG.models.smollm2.cache_key) {
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
        if (!this.isLoaded || !this.modelSession) {
            throw new Error('SmolLM2 model not loaded - cannot generate response');
        }

        try {
            const startTime = performance.now();

            // Format input for SmolLM2 instruction model
            const prompt = `<|im_start|>system\n${CONFIG.models.smollm2.system_prompt}<|im_end|>\n<|im_start|>user\n${inputText}<|im_end|>\n<|im_start|>assistant\n`;

            // Tokenize input
            const inputTokens = await this.tokenizer.encode(prompt);
            this.debugConsole.log(`Tokenized input: ${inputTokens.length} tokens`, 'verbose');

            // Run SmolLM2 inference
            const output = await this.runSmolLM2Inference(inputTokens);

            const endTime = performance.now();
            this.debugConsole.log(`Response generated in ${(endTime - startTime).toFixed(2)}ms`, 'verbose');

            return output;

        } catch (error) {
            this.debugConsole.log(`Response generation failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async runSmolLM2Inference(inputTokens) {
        try {
            // Prepare input tensor for SmolLM2
            const inputTensor = new ort.Tensor('int64', BigInt64Array.from(inputTokens.map(id => BigInt(id))), [1, inputTokens.length]);
            
            // Create attention mask
            const attentionMask = new ort.Tensor('int64', BigInt64Array.from(new Array(inputTokens.length).fill(BigInt(1))), [1, inputTokens.length]);
            
            this.debugConsole.log('Running SmolLM2 inference', 'verbose');
            const feeds = { 
                input_ids: inputTensor,
                attention_mask: attentionMask
            };
            
            const results = await this.modelSession.run(feeds);
            
            // Get logits and perform simple token generation
            const logitsTensor = results[Object.keys(results)[0]];
            const logits = Array.from(logitsTensor.data);
            
            // Generate tokens using simple sampling
            const generatedTokens = await this.generateTokensFromLogits(logits, inputTokens.length);
            
            // Decode to text
            const decodedText = await this.tokenizer.decode(generatedTokens);
            
            this.debugConsole.log(`SmolLM2 generated: "${decodedText}"`, 'verbose');
            
            return decodedText;
            
        } catch (error) {
            this.debugConsole.log(`SmolLM2 inference failed: ${error.message}`, 'error');
            throw error; // NO FALLBACKS - fail fast for debugging
        }
    }

    async generateTokensFromLogits(logits, inputLength) {
        // Simple greedy sampling for the last position
        const vocabSize = Math.floor(logits.length / inputLength);
        const lastPositionLogits = logits.slice((inputLength - 1) * vocabSize, inputLength * vocabSize);
        
        // Find token with highest probability
        let maxLogit = -Infinity;
        let bestTokenId = 0;
        
        for (let i = 0; i < lastPositionLogits.length; i++) {
            if (lastPositionLogits[i] > maxLogit) {
                maxLogit = lastPositionLogits[i];
                bestTokenId = i;
            }
        }
        
        // Return single next token (can be extended for multi-token generation)
        return [bestTokenId];
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
        // Clean up memory monitoring
        if (this.memoryMonitorInterval) {
            clearInterval(this.memoryMonitorInterval);
            this.memoryMonitorInterval = null;
        }
        
        this.modelSession = null;
        this.tokenizer = null;
        this.isLoaded = false;
        
        // Reset memory stats
        this.memoryStats = {
            lastCheck: 0,
            peakUsage: 0,
            warningThreshold: 0.8
        };
    }
}