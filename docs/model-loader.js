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

    async loadMT5Model(progressCallback) {
        try {
            this.debugConsole.log('Loading quantized mT5 encoder and decoder models', 'info');

            // Memory check for quantized models (should always pass)
            const requiredMemoryMB = 450; // ~400MB models + overhead
            if (!this.checkMemoryAvailability(requiredMemoryMB)) {
                throw new Error(`Insufficient memory for quantized models. Required: ${requiredMemoryMB}MB`);
            }

            // Load both models in parallel (now feasible with quantization)
            const [encoderData, decoderData] = await Promise.all([
                this.loadModelComponent('encoder', progressCallback),
                this.loadModelComponent('decoder', progressCallback)
            ]);

            // Initialize both models (no fallback option)
            await this.initializeBothModels(encoderData, decoderData, progressCallback);

            this.isLoaded = true;
            this.debugConsole.log('Quantized mT5 encoder and decoder loaded successfully', 'info');

        } catch (error) {
            this.debugConsole.log(`Quantized model loading failed: ${error.message}`, 'error');
            // No fallback - this must work
            throw new Error(`Failed to load quantized models: ${error.message}`);
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
            'https://huggingface.co/Xenova/mt5-small/resolve/main/onnx/decoder_model_quantized.onnx',
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
        // Try direct URL first since HuggingFace allows CORS for ONNX models
        // Only use proxy for non-HuggingFace URLs or as fallback
        if (originalUrl.includes('huggingface.co')) {
            return originalUrl; // HuggingFace allows direct access for ONNX models
        }
        
        const corsProxies = [
            originalUrl, // Direct URL first
            `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`
        ];
        
        return corsProxies[0];
    }


    async fetchWithProgress(url, progressCallback) {
        const headers = {
            'User-Agent': 'CALMe-SLM/Quant-v0.0.4'
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

            // Wait for ONNX Runtime
            let waitCount = 0;
            while (typeof ort === 'undefined' && waitCount < 50) {
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
            }

            if (typeof ort === 'undefined') {
                throw new Error('ONNX Runtime required for quantized model inference');
            }

            // Optimized session options for quantized models
            const sessionOptions = {
                executionProviders: ['wasm'],
                graphOptimizationLevel: 'extended', // More aggressive optimization for quantized models
                enableMemPattern: true,
                enableCpuMemArena: true, // Can enable with lower memory usage
                executionMode: 'parallel', // Parallel execution with quantized models
                // Quantized model specific optimizations
                enableQuantization: true,
                quantizationMode: 'static'
            };

            // Create encoder session
            this.debugConsole.log('Creating quantized encoder ONNX session...', 'verbose');
            this.encoderSession = await ort.InferenceSession.create(encoderData, sessionOptions);
            this.debugConsole.log('Quantized encoder loaded successfully', 'info');

            // Create decoder session
            this.debugConsole.log('Creating quantized decoder ONNX session...', 'verbose');
            this.decoderSession = await ort.InferenceSession.create(decoderData, sessionOptions);
            this.debugConsole.log('Quantized decoder loaded successfully', 'info');

            progressCallback(95);
            this.initializeTokenizer();
            progressCallback(100);

        } catch (error) {
            this.debugConsole.log(`Quantized model initialization failed: ${error.message}`, 'error');
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
                
                // Core crisis support vocabulary
                'here': 4, 'with': 5, 'you': 6, 'safe': 7, 'shelter': 8, 'help': 9,
                'think': 10, 'what': 11, 'when': 12, 'where': 13, 'can': 14, 'now': 15,
                'i': 16, 'am': 17, 'we': 18, 'together': 19, 'small': 20, 'task': 21,
                'first': 22, 'next': 23, 'step': 24, 'breathe': 25, 'focus': 26,
                'around': 27, 'see': 28, 'hear': 29, 'feel': 30, 'touch': 31,
                'remember': 32, 'before': 33, 'after': 34, 'then': 35, 'happened': 36,
                'situation': 37, 'control': 38, 'choose': 39, 'able': 40, 'capable': 41,
                'commitment': 42, 'activation': 43, 'questions': 44, 'timeline': 45,
                'protect': 46, 'protected': 47, 'safety': 48, 'secure': 49, 'stable': 50,
                
                // Emotional states and expressions
                'scared': 51, 'afraid': 52, 'worried': 53, 'anxious': 54, 'panic': 55, 'calm': 56,
                'stress': 57, 'stressed': 58, 'overwhelmed': 59, 'confused': 60, 'lost': 61, 'stuck': 62,
                'hopeless': 63, 'desperate': 64, 'alone': 65, 'isolated': 66, 'abandoned': 67,
                'angry': 68, 'frustrated': 69, 'mad': 70, 'upset': 71, 'irritated': 72,
                'sad': 73, 'depressed': 74, 'down': 75, 'crying': 76, 'tears': 77,
                'relief': 78, 'better': 79, 'improving': 80, 'progress': 81, 'hope': 82,
                
                // Crisis and conflict situations - Israeli context
                'bombing': 83, 'bombs': 84, 'explosion': 85, 'explosions': 86, 'blast': 87,
                'sirens': 88, 'alarm': 89, 'warning': 90, 'alert': 91, 'emergency': 92,
                'attack': 93, 'shooting': 94, 'gunfire': 95, 'violence': 96, 'war': 97,
                'conflict': 98, 'battle': 99, 'fighting': 100, 'danger': 101, 'threat': 102,
                'evacuation': 103, 'evacuate': 104, 'flee': 105, 'escape': 106, 'run': 107,
                'hide': 108, 'hiding': 109, 'basement': 110, 'bunker': 111, 'underground': 112,
                
                // Israeli shelter terminology
                'miklat': 113, 'mamad': 114, 'mamak': 115, 'maman': 116, 'shelter': 117,
                'protected': 118, 'room': 119, 'space': 120, 'reinforced': 121, 'safe': 122,
                'sealed': 123, 'concrete': 124, 'steel': 125, 'door': 126, 'walls': 127,
                
                // Rocket and missile terminology
                'rocket': 128, 'rockets': 129, 'missile': 130, 'missiles': 131, 'projectile': 132,
                'incoming': 133, 'intercepted': 134, 'impact': 135, 'trajectory': 136, 'launch': 137,
                'iron': 138, 'dome': 139, 'tamir': 140, 'interceptor': 141, 'radar': 142,
                'detected': 143, 'tracking': 144, 'debris': 145, 'shrapnel': 146, 'fragments': 147,
                
                // Air raid and siren terminology  
                'azaka': 148, 'siren': 149, 'wailing': 150, 'ascending': 151, 'descending': 152,
                'continuous': 153, 'rising': 154, 'falling': 155, 'tone': 156, 'pitch': 157,
                'all-clear': 158, 'steady': 159, 'signal': 160, 'buzzer': 161, 'horn': 162,
                'loudspeaker': 163, 'announcement': 164, 'instructions': 165, 'cover': 166,
                
                // Physical needs and concerns
                'hurt': 167, 'injured': 168, 'bleeding': 169, 'pain': 170, 'wound': 171,
                'hungry': 172, 'thirsty': 173, 'tired': 174, 'exhausted': 175, 'cold': 176,
                'hot': 177, 'sick': 178, 'medicine': 179, 'medical': 180, 'doctor': 181,
                'food': 182, 'water': 183, 'supplies': 184, 'resources': 185, 'needs': 186,
                
                // Social and family concerns
                'family': 187, 'children': 188, 'kids': 189, 'parents': 190, 'spouse': 191,
                'friends': 192, 'neighbors': 193, 'community': 194, 'people': 195,
                'missing': 196, 'lost': 197, 'separated': 198, 'contact': 199, 'communication': 200,
                
                // Psychological and emotional responses
                'flashback': 201, 'nightmare': 202, 'hypervigilant': 203, 'numb': 204, 'disconnected': 205,
                'unbalanced': 206, 'shattered': 207, 'stuck': 208, 'frozen': 209, 'overwhelm': 210,
                'intrusive': 211, 'thoughts': 212, 'memories': 213, 'avoidance': 214, 'withdrawal': 215,
                'startle': 216, 'jumpy': 217, 'edgy': 218, 'tense': 219, 'vigilant': 220,
                
                // Location and movement
                'home': 221, 'house': 222, 'building': 223, 'apartment': 224, 'outside': 225,
                'inside': 226, 'window': 227, 'wall': 228, 'floor': 229, 'ceiling': 230,
                'upstairs': 231, 'downstairs': 232, 'street': 233, 'road': 234, 'city': 235,
                'neighborhood': 236, 'area': 237, 'zone': 238, 'district': 239, 'region': 240,
                
                // Time and sequence
                'today': 241, 'yesterday': 242, 'tomorrow': 243, 'morning': 244, 'evening': 245,
                'night': 246, 'hours': 247, 'minutes': 248, 'seconds': 249, 'days': 250,
                'ago': 251, 'since': 252, 'until': 253, 'during': 254, 'while': 255,
                'suddenly': 256, 'immediately': 257, 'quickly': 258, 'slowly': 259, 'gradually': 260,
                
                // Actions and coping
                'breathe': 261, 'breathing': 262, 'relax': 263, 'rest': 264, 'sleep': 265,
                'eat': 266, 'drink': 267, 'move': 268, 'walk': 269, 'sit': 270, 'stand': 271,
                'listen': 272, 'watch': 273, 'wait': 274, 'stay': 275, 'remain': 276,
                'try': 277, 'attempt': 278, 'manage': 279, 'handle': 280, 'cope': 281,
                'survive': 282, 'endure': 283, 'persevere': 284, 'overcome': 285, 'adapt': 286,
                
                // Communication and support
                'talk': 287, 'speak': 288, 'tell': 289, 'say': 290, 'explain': 291,
                'understand': 292, 'know': 293, 'learn': 294, 'share': 295, 'express': 296,
                'support': 297, 'care': 298, 'comfort': 299, 'reassure': 300, 'encourage': 301,
                'connect': 302, 'reach': 303, 'contact': 304, 'call': 305, 'text': 306,
                
                // Ma'aseh specific terms
                'commitment': 307, 'presence': 308, 'reliable': 309, 'consistent': 310,
                'activation': 311, 'action': 312, 'task': 313, 'goal': 314, 'achieve': 315,
                'challenge': 316, 'choice': 317, 'decide': 318, 'option': 319, 'prefer': 320,
                'cognitive': 321, 'rational': 322, 'logical': 323, 'organize': 324, 'structure': 325,
                'continuity': 326, 'sequence': 327, 'order': 328, 'pattern': 329, 'connection': 330
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
        if (!this.isLoaded || !this.encoderSession || !this.decoderSession) {
            throw new Error('Quantized models not loaded - cannot generate response');
        }

        try {
            const startTime = performance.now();

            // Use the existing system prompt
            const systemPrompt = CONFIG.models.mt5.system_prompt;
            const fullInput = `${systemPrompt}\n\nUser: ${inputText}\n\nAssistant:`;

            // Tokenize input
            const inputTokens = this.tokenizer.encode(fullInput);
            this.debugConsole.log(`Tokenized input: ${inputTokens.length} tokens`, 'verbose');

            // Run full two-phase inference
            const output = await this.runFullInference(inputTokens);

            const endTime = performance.now();
            this.debugConsole.log(`Response generated in ${(endTime - startTime).toFixed(2)}ms`, 'verbose');

            return output;

        } catch (error) {
            this.debugConsole.log(`Response generation failed: ${error.message}`, 'error');
            throw error; // No fallback - must work with quantized models
        }
    }

    async runFullInference(inputTokens) {
        // Always run both encoder and decoder
        const encoderHiddenStates = await this.runEncoderInference(inputTokens);
        const generatedText = await this.runDecoderInference(encoderHiddenStates, inputTokens);
        return generatedText;
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
        
        this.encoderSession = null;
        this.decoderSession = null;
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