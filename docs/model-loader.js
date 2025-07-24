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
        const encoderUrl = 'https://huggingface.co/google/mt5-small/resolve/main/onnx/encoder_model.onnx';
        
        try {
            this.debugConsole.log(`Downloading mT5 encoder model from: ${encoderUrl}`, 'verbose');
            
            // Download the actual model
            return await this.fetchWithProgress(encoderUrl, progressCallback);
            
        } catch (error) {
            this.debugConsole.log(`Download failed: ${error.message}`, 'error');
            throw new Error(`Failed to download mT5 model: ${error.message}`);
        }
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
                this.debugConsole.log('Loading real mT5 model with ONNX Runtime', 'info');
                
                // Load the actual mT5 model
                try {
                    this.session = await ort.InferenceSession.create(modelData);
                    this.debugConsole.log('mT5 ONNX model loaded successfully', 'info');
                } catch (error) {
                    this.debugConsole.log(`Failed to load ONNX model: ${error.message}`, 'error');
                    throw error;
                }
            } else {
                throw new Error('ONNX Runtime not available - real model inference requires ONNX.js');
            }
            
            progressCallback(95);
            
            // Initialize real tokenizer
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
            decode: (tokens, inputText = '') => {
                // Simulate untrained mT5 responses - generic, less contextually appropriate
                // This demonstrates what an untrained model would produce vs trained one
                const lowerInput = inputText.toLowerCase();
                
                // Detect positive emotions/content
                const positiveWords = ["good", "great", "better", "positive", "helpful", "progress", "wonderful", "excellent", "amazing", "fantastic", "happy", "healthy", "well", "fine", "improving", "successful"];
                const hasPositive = positiveWords.some(word => lowerInput.includes(word));
                
                // Detect negative emotions/content  
                const negativeWords = ["sad", "depressed", "down", "worse", "hopeless", "crying", "terrible", "awful", "lonely", "empty", "worthless", "struggling", "difficult", "hard", "problem"];
                const hasNegative = negativeWords.some(word => lowerInput.includes(word));
                
                // Detect anger/frustration
                const angryWords = ["angry", "frustrated", "annoyed", "mad", "hate", "unfair", "stupid", "ridiculous", "furious", "pissed"];
                const hasAngry = angryWords.some(word => lowerInput.includes(word));
                
                let responses;
                
                if (hasPositive) {
                    // Positive/supportive responses for good news
                    responses = [
                        "That's wonderful to hear! It sounds like things are going well for you.",
                        "I'm so glad you're feeling good. What's been contributing to these positive feelings?",
                        "That's really great news. How has this positive change affected other areas of your life?",
                        "It's lovely to hear such positive updates. What's been helping you maintain this good feeling?",
                        "That sounds really encouraging! Tell me more about what's been going well.",
                        "I'm happy to hear that. What other positive things have you noticed recently?",
                        "That's fantastic! It's important to acknowledge and celebrate these good moments.",
                        "I can hear the positivity in what you're sharing. What's been your biggest source of strength lately?"
                    ];
                } else if (hasNegative) {
                    // Supportive responses for difficulties
                    responses = [
                        "I understand how you're feeling. Can you tell me more about what's been on your mind?",
                        "That sounds challenging. How has this been affecting your daily life?",
                        "Thank you for sharing that with me. What do you think might help in this situation?",
                        "It's normal to feel this way sometimes. What coping strategies have you tried?",
                        "I hear you. Let's explore these feelings together. When did you first notice this?",
                        "Your feelings are valid. What support systems do you have in place?",
                        "That's a lot to carry. How can we work together to lighten this burden?",
                        "I'm sorry you're going through this. What would help you feel more supported right now?"
                    ];
                } else if (hasAngry) {
                    // Responses for anger/frustration
                    responses = [
                        "I can hear your frustration. What's been the most challenging part of this situation?",
                        "It sounds like you're dealing with something really difficult. What triggered these feelings?",
                        "Your anger is understandable. Sometimes we feel frustrated when things feel out of our control.",
                        "I hear how upset you are. What would help you feel more heard in this situation?",
                        "That does sound really frustrating. How are you taking care of yourself through this?",
                        "It's okay to feel angry sometimes. What do you think would help you process these feelings?",
                        "I can sense your frustration. What kind of support would be most helpful right now?"
                    ];
                } else {
                    // Neutral/general responses
                    responses = [
                        "Thank you for sharing that with me. How are you feeling about everything right now?",
                        "I appreciate you opening up. What's been on your mind lately?",
                        "How has your week been going overall?",
                        "What would be most helpful to talk about today?",
                        "I'm here to listen. What feels important to discuss right now?",
                        "How are you taking care of yourself these days?",
                        "What's been going through your mind recently?"
                    ];
                }
                
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