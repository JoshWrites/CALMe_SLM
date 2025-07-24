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
                const modelData = await this.downloadModel(progressCallback);
                await this.initializeModel(modelData, progressCallback);
                
                // Cache the model
                await this.cacheModel(modelData);
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
        const urls = [CONFIG.models.mt5.huggingface_url, ...CONFIG.models.mt5.fallback_urls];
        
        for (const url of urls) {
            try {
                this.debugConsole.log(`Attempting to download from: ${url}`, 'verbose');
                
                // For demo purposes, we'll simulate the download
                // In production, this would be a real fetch with progress tracking
                return await this.simulateModelDownload(progressCallback);
                
                // Real implementation would be:
                // return await this.fetchWithProgress(url, progressCallback);
                
            } catch (error) {
                this.debugConsole.log(`Download failed from ${url}: ${error.message}`, 'warn');
                continue;
            }
        }
        
        throw new Error('Failed to download model from all sources');
    }

    async simulateModelDownload(progressCallback) {
        // Simulate download progress
        const totalSize = CONFIG.models.mt5.expected_size;
        let downloaded = 0;
        
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                downloaded += totalSize * 0.1;
                
                if (downloaded >= totalSize) {
                    downloaded = totalSize;
                    clearInterval(interval);
                    
                    // Create mock model data
                    const mockData = new ArrayBuffer(1024); // Small mock data
                    resolve(mockData);
                }
                
                const progress = (downloaded / totalSize) * 100;
                progressCallback(progress);
            }, 500);
        });
    }

    async fetchWithProgress(url, progressCallback) {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
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
        
        return result.buffer;
    }

    async initializeModel(modelData, progressCallback) {
        try {
            progressCallback(90);
            
            // Check if ONNX Runtime is available
            if (typeof ort !== 'undefined') {
                this.debugConsole.log('ONNX Runtime available, attempting real model loading', 'info');
                // In a real implementation, we would load the actual model here
                // For now, we'll still use simulation but with better logging
            } else {
                this.debugConsole.log('ONNX Runtime not available, using mock implementation', 'warn');
            }
            
            // Initialize model session (simulated for demo)
            await this.simulateModelInitialization();
            
            progressCallback(95);
            
            // Initialize tokenizer
            this.initializeTokenizer();
            
            progressCallback(100);
            
        } catch (error) {
            this.debugConsole.log(`Model initialization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async simulateModelInitialization() {
        // Simulate model initialization delay
        return new Promise((resolve) => {
            setTimeout(() => {
                this.session = {
                    run: async (feeds) => {
                        // Mock inference
                        return {
                            output: new Float32Array([0.1, 0.2, 0.3, 0.4])
                        };
                    }
                };
                resolve();
            }, 1000);
        });
    }

    initializeTokenizer() {
        // Mock tokenizer for demo
        this.tokenizer = {
            encode: (text) => {
                // Simple mock encoding
                return text.split(' ').map((_, i) => i + 1);
            },
            decode: (tokens) => {
                // Mock responses for therapy context
                const responses = [
                    "I understand how you're feeling. Can you tell me more about what's been on your mind?",
                    "That sounds challenging. How has this been affecting your daily life?",
                    "Thank you for sharing that with me. What do you think might help in this situation?",
                    "It's normal to feel this way sometimes. What coping strategies have you tried?",
                    "I hear you. Let's explore these feelings together. When did you first notice this?",
                    "Your feelings are valid. What support systems do you have in place?",
                    "That's a lot to carry. How can we work together to lighten this burden?",
                    "I appreciate your openness. What would a positive outcome look like for you?"
                ];
                
                return responses[Math.floor(Math.random() * responses.length)];
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
            
            // Run inference (mocked for demo)
            const output = await this.runInference(inputTokens);
            
            // Decode output
            const response = this.tokenizer.decode(output);
            
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
        
        // Mock inference with timeout
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Response generation timeout'));
            }, CONFIG.performance.response_generation_timeout);
            
            // Simulate processing delay
            setTimeout(() => {
                clearTimeout(timeout);
                resolve(inputTokens); // Return input as mock output
            }, 500 + Math.random() * 1000);
        });
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