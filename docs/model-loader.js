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
            'User-Agent': 'CALMe-SLM/Quant-v0.1.0'
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
            // Expanded vocabulary for mT5 (1000 tokens)
            vocab: {
                // Special Tokens (0-3)
                '<pad>': 0, '<unk>': 1, '<s>': 2, '</s>': 3,
                
                // Core crisis support vocabulary (4-50)
                'here': 4, 'with': 5, 'you': 6, 'safe': 7, 'shelter': 8, 'help': 9,
                'think': 10, 'what': 11, 'when': 12, 'where': 13, 'can': 14, 'now': 15,
                'i': 16, 'am': 17, 'we': 18, 'together': 19, 'small': 20, 'task': 21,
                'first': 22, 'next': 23, 'step': 24, 'breathe': 25, 'focus': 26,
                'around': 27, 'see': 28, 'hear': 29, 'feel': 30, 'touch': 31,
                'remember': 32, 'before': 33, 'after': 34, 'then': 35, 'happened': 36,
                'situation': 37, 'control': 38, 'choose': 39, 'able': 40, 'capable': 41,
                'commitment': 42, 'activation': 43, 'questions': 44, 'timeline': 45,
                'protect': 46, 'protected': 47, 'safety': 48, 'secure': 49, 'stable': 50,
                
                // Emotional states and expressions (51-82)
                'scared': 51, 'afraid': 52, 'worried': 53, 'anxious': 54, 'panic': 55, 'calm': 56,
                'stress': 57, 'stressed': 58, 'overwhelmed': 59, 'confused': 60, 'lost': 61, 'stuck': 62,
                'hopeless': 63, 'desperate': 64, 'alone': 65, 'isolated': 66, 'abandoned': 67,
                'angry': 68, 'frustrated': 69, 'mad': 70, 'upset': 71, 'irritated': 72,
                'sad': 73, 'depressed': 74, 'down': 75, 'crying': 76, 'tears': 77,
                'relief': 78, 'better': 79, 'improving': 80, 'progress': 81, 'hope': 82,
                
                // Crisis and conflict situations (83-112)
                'bombing': 83, 'bombs': 84, 'explosion': 85, 'explosions': 86, 'blast': 87,
                'sirens': 88, 'alarm': 89, 'warning': 90, 'alert': 91, 'emergency': 92,
                'attack': 93, 'shooting': 94, 'gunfire': 95, 'violence': 96, 'war': 97,
                'conflict': 98, 'battle': 99, 'fighting': 100, 'danger': 101, 'threat': 102,
                'evacuation': 103, 'evacuate': 104, 'flee': 105, 'escape': 106, 'run': 107,
                'hide': 108, 'hiding': 109, 'basement': 110, 'bunker': 111, 'underground': 112,
                
                // Israeli shelter terminology (113-127)
                'miklat': 113, 'mamad': 114, 'mamak': 115, 'maman': 116, 'shelter': 117,
                'protected': 118, 'room': 119, 'space': 120, 'reinforced': 121, 'safe': 122,
                'sealed': 123, 'concrete': 124, 'steel': 125, 'door': 126, 'walls': 127,
                
                // Rocket and missile terminology (128-147)
                'rocket': 128, 'rockets': 129, 'missile': 130, 'missiles': 131, 'projectile': 132,
                'incoming': 133, 'intercepted': 134, 'impact': 135, 'trajectory': 136, 'launch': 137,
                'iron': 138, 'dome': 139, 'tamir': 140, 'interceptor': 141, 'radar': 142,
                'detected': 143, 'tracking': 144, 'debris': 145, 'shrapnel': 146, 'fragments': 147,
                
                // Air raid and siren terminology (148-166)
                'azaka': 148, 'siren': 149, 'wailing': 150, 'ascending': 151, 'descending': 152,
                'continuous': 153, 'rising': 154, 'falling': 155, 'tone': 156, 'pitch': 157,
                'all-clear': 158, 'steady': 159, 'signal': 160, 'buzzer': 161, 'horn': 162,
                'loudspeaker': 163, 'announcement': 164, 'instructions': 165, 'cover': 166,
                
                // Physical needs and concerns (167-186)
                'hurt': 167, 'injured': 168, 'bleeding': 169, 'pain': 170, 'wound': 171,
                'hungry': 172, 'thirsty': 173, 'tired': 174, 'exhausted': 175, 'cold': 176,
                'hot': 177, 'sick': 178, 'medicine': 179, 'medical': 180, 'doctor': 181,
                'food': 182, 'water': 183, 'supplies': 184, 'resources': 185, 'needs': 186,
                
                // Social and family concerns (187-200)
                'family': 187, 'children': 188, 'kids': 189, 'parents': 190, 'spouse': 191,
                'friends': 192, 'neighbors': 193, 'community': 194, 'people': 195,
                'missing': 196, 'lost': 197, 'separated': 198, 'contact': 199, 'communication': 200,
                
                // Psychological and emotional responses (201-220)
                'flashback': 201, 'nightmare': 202, 'hypervigilant': 203, 'numb': 204, 'disconnected': 205,
                'unbalanced': 206, 'shattered': 207, 'stuck': 208, 'frozen': 209, 'overwhelm': 210,
                'intrusive': 211, 'thoughts': 212, 'memories': 213, 'avoidance': 214, 'withdrawal': 215,
                'startle': 216, 'jumpy': 217, 'edgy': 218, 'tense': 219, 'vigilant': 220,
                
                // Location and movement (221-240)
                'home': 221, 'house': 222, 'building': 223, 'apartment': 224, 'outside': 225,
                'inside': 226, 'window': 227, 'wall': 228, 'floor': 229, 'ceiling': 230,
                'upstairs': 231, 'downstairs': 232, 'street': 233, 'road': 234, 'city': 235,
                'neighborhood': 236, 'area': 237, 'zone': 238, 'district': 239, 'region': 240,
                
                // Time and sequence (241-260)
                'today': 241, 'yesterday': 242, 'tomorrow': 243, 'morning': 244, 'evening': 245,
                'night': 246, 'hours': 247, 'minutes': 248, 'seconds': 249, 'days': 250,
                'ago': 251, 'since': 252, 'until': 253, 'during': 254, 'while': 255,
                'suddenly': 256, 'immediately': 257, 'quickly': 258, 'slowly': 259, 'gradually': 260,
                
                // Actions and coping (261-286)
                'breathe': 261, 'breathing': 262, 'relax': 263, 'rest': 264, 'sleep': 265,
                'eat': 266, 'drink': 267, 'move': 268, 'walk': 269, 'sit': 270, 'stand': 271,
                'listen': 272, 'watch': 273, 'wait': 274, 'stay': 275, 'remain': 276,
                'try': 277, 'attempt': 278, 'manage': 279, 'handle': 280, 'cope': 281,
                'survive': 282, 'endure': 283, 'persevere': 284, 'overcome': 285, 'adapt': 286,
                
                // Communication and support (287-306)
                'talk': 287, 'speak': 288, 'tell': 289, 'say': 290, 'explain': 291,
                'understand': 292, 'know': 293, 'learn': 294, 'share': 295, 'express': 296,
                'support': 297, 'care': 298, 'comfort': 299, 'reassure': 300, 'encourage': 301,
                'connect': 302, 'reach': 303, 'contact': 304, 'call': 305, 'text': 306,
                
                // Ma'aseh specific terms (307-330)
                'commitment': 307, 'presence': 308, 'reliable': 309, 'consistent': 310,
                'activation': 311, 'action': 312, 'task': 313, 'goal': 314, 'achieve': 315,
                'challenge': 316, 'choice': 317, 'decide': 318, 'option': 319, 'prefer': 320,
                'cognitive': 321, 'rational': 322, 'logical': 323, 'organize': 324, 'structure': 325,
                'continuity': 326, 'sequence': 327, 'order': 328, 'pattern': 329, 'connection': 330,
                
                // Essential Articles & Pronouns (331-350)
                'the': 331, 'a': 332, 'an': 333, 'this': 334, 'that': 335, 'these': 336, 'those': 337,
                'my': 338, 'your': 339, 'his': 340, 'her': 341, 'its': 342, 'our': 343, 'their': 344,
                'me': 345, 'him': 346, 'she': 347, 'it': 348, 'us': 349, 'them': 350,
                
                // Prepositions & Connecting Words (351-380)
                'in': 351, 'on': 352, 'at': 353, 'by': 354, 'for': 355, 'from': 356, 'to': 357, 'of': 358,
                'up': 359, 'down': 360, 'over': 361, 'under': 362, 'through': 363, 'between': 364,
                'behind': 365, 'beside': 366, 'near': 367, 'far': 368, 'above': 369, 'below': 370,
                'toward': 371, 'away': 372, 'across': 373, 'along': 374, 'against': 375,
                'within': 376, 'without': 377, 'beyond': 378, 'beneath': 379, 'throughout': 380,
                
                // Conjunctions & Logic Words (381-400)
                'and': 381, 'or': 382, 'but': 383, 'if': 384, 'then': 385, 'so': 386, 'yet': 387,
                'because': 388, 'since': 389, 'although': 390, 'however': 391, 'therefore': 392,
                'unless': 393, 'while': 394, 'whereas': 395, 'whether': 396, 'either': 397,
                'neither': 398, 'both': 399, 'neither': 400,
                
                // Question Words & Conversation (401-420)
                'who': 401, 'what': 402, 'when': 403, 'where': 404, 'why': 405, 'how': 406, 'which': 407,
                'yes': 408, 'no': 409, 'maybe': 410, 'perhaps': 411, 'possibly': 412, 'probably': 413,
                'okay': 414, 'alright': 415, 'sure': 416, 'please': 417, 'thank': 418, 'thanks': 419, 'welcome': 420,
                
                // Auxiliary & Modal Verbs (421-450)
                'is': 421, 'are': 422, 'was': 423, 'were': 424, 'be': 425, 'being': 426, 'been': 427,
                'have': 428, 'has': 429, 'had': 430, 'do': 431, 'does': 432, 'did': 433, 'done': 434,
                'will': 435, 'would': 436, 'could': 437, 'should': 438, 'might': 439, 'must': 440,
                'shall': 441, 'can\'t': 442, 'won\'t': 443, 'wouldn\'t': 444, 'couldn\'t': 445, 'shouldn\'t': 446,
                'don\'t': 447, 'doesn\'t': 448, 'didn\'t': 449, 'haven\'t': 450,
                
                // Numbers & Quantities (451-480)
                'one': 451, 'two': 452, 'three': 453, 'four': 454, 'five': 455, 'six': 456, 'seven': 457,
                'eight': 458, 'nine': 459, 'ten': 460, 'many': 461, 'few': 462, 'several': 463, 'some': 464,
                'all': 465, 'most': 466, 'more': 467, 'less': 468, 'much': 469, 'little': 470, 'enough': 471,
                'too': 472, 'very': 473, 'quite': 474, 'rather': 475, 'almost': 476, 'nearly': 477,
                'about': 478, 'approximately': 479, 'exactly': 480,
                
                // Enhanced Emotional States (481-520)
                'terrified': 481, 'petrified': 482, 'horrified': 483, 'shocked': 484, 'stunned': 485,
                'grateful': 486, 'thankful': 487, 'relieved': 488, 'peaceful': 489, 'confident': 490,
                'embarrassed': 491, 'ashamed': 492, 'guilty': 493, 'regretful': 494, 'disappointed': 495,
                'excited': 496, 'enthusiastic': 497, 'motivated': 498, 'determined': 499, 'focused': 500,
                'exhausted': 501, 'drained': 502, 'weary': 503, 'sluggish': 504, 'energetic': 505,
                'restless': 506, 'agitated': 507, 'jittery': 508, 'nervous': 509, 'trembling': 510,
                'composed': 511, 'centered': 512, 'grounded': 513, 'balanced': 514, 'steady': 515,
                'vulnerable': 516, 'fragile': 517, 'sensitive': 518, 'resilient': 519, 'strong': 520,
                
                // Enhanced Crisis/Safety Terms (521-560)
                'emergency': 521, 'urgent': 522, 'immediate': 523, 'critical': 524, 'severe': 525,
                'evacuation': 526, 'lockdown': 527, 'all-clear': 528, 'standby': 529, 'ready': 530,
                'barricade': 531, 'fortify': 532, 'reinforce': 533, 'strengthen': 534, 'defend': 535,
                'vulnerable': 536, 'exposed': 537, 'shielded': 538, 'covered': 539, 'hidden': 540,
                'perimeter': 541, 'boundary': 542, 'entrance': 543, 'exit': 544, 'pathway': 545,
                'checkpoint': 546, 'barrier': 547, 'obstacle': 548, 'opening': 549, 'gap': 550,
                'surveillance': 551, 'monitoring': 552, 'observation': 553, 'scanning': 554, 'patrol': 555,
                'response': 556, 'reaction': 557, 'preparation': 558, 'planning': 559, 'strategy': 560,
                
                // Ma'aseh & SIX Cs Enhanced (561-600)
                'commitment': 561, 'dedication': 562, 'loyalty': 563, 'faithfulness': 564, 'devotion': 565,
                'challenge': 566, 'obstacle': 567, 'difficulty': 568, 'problem': 569, 'issue': 570,
                'control': 571, 'command': 572, 'authority': 573, 'power': 574, 'influence': 575,
                'cognitive': 576, 'mental': 577, 'intellectual': 578, 'reasoning': 579, 'thinking': 580,
                'communication': 581, 'dialogue': 582, 'conversation': 583, 'discussion': 584, 'exchange': 585,
                'continuity': 586, 'consistency': 587, 'persistence': 588, 'duration': 589, 'stability': 590,
                'therapeutic': 591, 'healing': 592, 'recovery': 593, 'restoration': 594, 'rehabilitation': 595,
                'intervention': 596, 'treatment': 597, 'assistance': 598, 'guidance': 599, 'direction': 600,
                
                // Sensory & Grounding Terms (601-640)
                'bright': 601, 'dark': 602, 'light': 603, 'shadow': 604, 'color': 605, 'clear': 606,
                'loud': 607, 'quiet': 608, 'silent': 609, 'sound': 610, 'noise': 611, 'voice': 612,
                'soft': 613, 'hard': 614, 'smooth': 615, 'rough': 616, 'warm': 617, 'cool': 618,
                'sweet': 619, 'bitter': 620, 'sour': 621, 'salty': 622, 'taste': 623, 'smell': 624,
                'texture': 625, 'surface': 626, 'weight': 627, 'pressure': 628, 'tension': 629, 'release': 630,
                'fabric': 631, 'metal': 632, 'wood': 633, 'plastic': 634, 'glass': 635, 'leather': 636,
                'solid': 637, 'liquid': 638, 'gas': 639, 'vapor': 640,
                
                // Body Awareness & Physical States (641-680)
                'head': 641, 'neck': 642, 'shoulders': 643, 'arms': 644, 'hands': 645, 'fingers': 646,
                'chest': 647, 'back': 648, 'stomach': 649, 'legs': 650, 'feet': 651, 'toes': 652,
                'heart': 653, 'lungs': 654, 'muscles': 655, 'bones': 656, 'skin': 657, 'blood': 658,
                'pulse': 659, 'heartbeat': 660, 'rhythm': 661, 'circulation': 662, 'temperature': 663,
                'posture': 664, 'position': 665, 'alignment': 666, 'balance': 667, 'coordination': 668,
                'strength': 669, 'weakness': 670, 'flexibility': 671, 'stiffness': 672, 'mobility': 673,
                'sensation': 674, 'numbness': 675, 'tingling': 676, 'aching': 677, 'throbbing': 678,
                'relaxation': 679, 'tension': 680,
                
                // Breathing & Calming Techniques (681-710)
                'inhale': 681, 'exhale': 682, 'breathing': 683, 'breath': 684, 'oxygen': 685, 'air': 686,
                'deep': 687, 'shallow': 688, 'slow': 689, 'fast': 690, 'rhythm': 691, 'pattern': 692,
                'count': 693, 'counting': 694, 'pace': 695, 'timing': 696, 'interval': 697, 'pause': 698,
                'meditation': 699, 'mindfulness': 700, 'awareness': 701, 'attention': 702, 'concentration': 703,
                'grounding': 704, 'centering': 705, 'anchoring': 706, 'stabilizing': 707, 'settling': 708,
                'technique': 709, 'method': 710,
                
                // Environment & Shelter Details (711-750)
                'corner': 711, 'center': 712, 'side': 713, 'edge': 714, 'middle': 715, 'front': 716,
                'back': 717, 'left': 718, 'right': 719, 'top': 720, 'bottom': 721, 'surface': 722,
                'furniture': 723, 'table': 724, 'chair': 725, 'bed': 726, 'couch': 727, 'cabinet': 728,
                'closet': 729, 'drawer': 730, 'shelf': 731, 'container': 732, 'box': 733, 'bag': 734,
                'blanket': 735, 'pillow': 736, 'mattress': 737, 'cushion': 738, 'clothing': 739, 'jacket': 740,
                'light': 741, 'lamp': 742, 'flashlight': 743, 'candle': 744, 'battery': 745, 'power': 746,
                'ventilation': 747, 'air': 748, 'fresh': 749, 'stale': 750,
                
                // Communication & Technology (751-780)
                'phone': 751, 'radio': 752, 'internet': 753, 'signal': 754, 'connection': 755, 'network': 756,
                'message': 757, 'alert': 758, 'notification': 759, 'update': 760, 'information': 761,
                'news': 762, 'report': 763, 'broadcast': 764, 'announcement': 765, 'warning': 766,
                'emergency': 767, 'hotline': 768, 'helpline': 769, 'service': 770, 'rescue': 771,
                'first': 772, 'aid': 773, 'medical': 774, 'assistance': 775, 'ambulance': 776, 'hospital': 777,
                'police': 778, 'fire': 779, 'military': 780,
                
                // Time & Duration Extended (781-810)
                'moment': 781, 'instant': 782, 'second': 783, 'minute': 784, 'hour': 785, 'day': 786,
                'week': 787, 'month': 788, 'year': 789, 'decade': 790, 'century': 791, 'forever': 792,
                'temporary': 793, 'permanent': 794, 'brief': 795, 'long': 796, 'short': 797, 'extended': 798,
                'past': 799, 'present': 800, 'future': 801, 'history': 802, 'now': 803, 'then': 804,
                'early': 805, 'late': 806, 'on-time': 807, 'delayed': 808, 'schedule': 809, 'timing': 810,
                
                // Actions & Movements Extended (811-850)
                'approach': 811, 'retreat': 812, 'advance': 813, 'withdraw': 814, 'enter': 815, 'exit': 816,
                'climb': 817, 'descend': 818, 'crawl': 819, 'crouch': 820, 'kneel': 821, 'lie': 822,
                'reach': 823, 'grasp': 824, 'hold': 825, 'release': 826, 'push': 827, 'pull': 828,
                'open': 829, 'close': 830, 'lock': 831, 'unlock': 832, 'secure': 833, 'fasten': 834,
                'gather': 835, 'collect': 836, 'organize': 837, 'arrange': 838, 'prepare': 839, 'pack': 840,
                'search': 841, 'find': 842, 'discover': 843, 'locate': 844, 'identify': 845, 'recognize': 846,
                'create': 847, 'build': 848, 'construct': 849, 'destroy': 850,
                
                // Relationships & Social Support (851-890)
                'relationship': 851, 'bond': 852, 'connection': 853, 'trust': 854, 'support': 855,
                'companion': 856, 'partner': 857, 'colleague': 858, 'teammate': 859, 'ally': 860,
                'stranger': 861, 'acquaintance': 862, 'relative': 863, 'sibling': 864, 'cousin': 865,
                'grandparent': 866, 'uncle': 867, 'aunt': 868, 'nephew': 869, 'niece': 870,
                'mentor': 871, 'guide': 872, 'teacher': 873, 'student': 874, 'leader': 875, 'follower': 876,
                'helper': 877, 'caregiver': 878, 'protector': 879, 'guardian': 880, 'defender': 881,
                'community': 882, 'group': 883, 'team': 884, 'organization': 885, 'society': 886,
                'culture': 887, 'tradition': 888, 'custom': 889, 'ritual': 890,
                
                // Coping & Resilience (891-930)
                'strength': 891, 'courage': 892, 'bravery': 893, 'determination': 894, 'willpower': 895,
                'resilience': 896, 'endurance': 897, 'persistence': 898, 'tenacity': 899, 'grit': 900,
                'adaptation': 901, 'adjustment': 902, 'flexibility': 903, 'creativity': 904, 'innovation': 905,
                'problem-solving': 906, 'solution': 907, 'answer': 908, 'resolution': 909, 'outcome': 910,
                'success': 911, 'achievement': 912, 'accomplishment': 913, 'victory': 914, 'triumph': 915,
                'failure': 916, 'setback': 917, 'obstacle': 918, 'barrier': 919, 'challenge': 920,
                'learning': 921, 'growth': 922, 'development': 923, 'improvement': 924, 'progress': 925,
                'healing': 926, 'recovery': 927, 'restoration': 928, 'renewal': 929, 'transformation': 930,
                
                // Resources & Supplies (931-970)
                'resource': 931, 'supply': 932, 'provision': 933, 'equipment': 934, 'tool': 935, 'device': 936,
                'material': 937, 'substance': 938, 'item': 939, 'object': 940, 'thing': 941, 'stuff': 942,
                'inventory': 943, 'stock': 944, 'reserve': 945, 'backup': 946, 'spare': 947, 'extra': 948,
                'essential': 949, 'necessary': 950, 'required': 951, 'optional': 952, 'luxury': 953,
                'available': 954, 'accessible': 955, 'reachable': 956, 'obtainable': 957, 'limited': 958,
                'unlimited': 959, 'sufficient': 960, 'insufficient': 961, 'adequate': 962, 'scarce': 963,
                'abundant': 964, 'plentiful': 965, 'rare': 966, 'common': 967, 'typical': 968,
                'unusual': 969, 'special': 970,
                
                // Assessment & Evaluation (971-1000)
                'assess': 971, 'evaluate': 972, 'examine': 973, 'inspect': 974, 'review': 975, 'analyze': 976,
                'measure': 977, 'gauge': 978, 'estimate': 979, 'calculate': 980, 'determine': 981,
                'compare': 982, 'contrast': 983, 'differentiate': 984, 'distinguish': 985, 'separate': 986,
                'classify': 987, 'categorize': 988, 'group': 989, 'sort': 990, 'rank': 991, 'rate': 992,
                'priority': 993, 'importance': 994, 'significance': 995, 'relevance': 996, 'urgency': 997,
                'quality': 998, 'standard': 999, 'criterion': 1000
            },
            
            encode: (text) => {
                // Improved tokenization for mT5
                const tokens = text.toLowerCase()
                    .replace(/[.,!?;:]/g, ' ')
                    .split(/\s+/)
                    .filter(token => token.length > 0);
                
                // Convert tokens to IDs with better handling
                const tokenIds = tokens.map(token => {
                    if (this.tokenizer.vocab[token] !== undefined) {
                        return this.tokenizer.vocab[token];
                    }
                    // Try partial matches for compound words
                    for (const vocabWord of Object.keys(this.tokenizer.vocab)) {
                        if (token.includes(vocabWord) || vocabWord.includes(token)) {
                            return this.tokenizer.vocab[vocabWord];
                        }
                    }
                    return 1; // <unk>
                });
                
                return tokenIds.length > 0 ? tokenIds : [1];
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

            // Simple prompt for mT5 (no complex system prompt needed)
            const simpleInput = `question: ${inputText} answer:`;

            // Tokenize input
            const inputTokens = this.tokenizer.encode(simpleInput);
            this.debugConsole.log(`Tokenized input: ${inputTokens.length} tokens`, 'verbose');

            // Run optimized inference
            const output = await this.runOptimizedInference(inputTokens);

            const endTime = performance.now();
            this.debugConsole.log(`Response generated in ${(endTime - startTime).toFixed(2)}ms`, 'verbose');

            return output;

        } catch (error) {
            this.debugConsole.log(`Response generation failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async runOptimizedInference(inputTokens) {
        // Run encoder once
        const {encoderHiddenStates, encoderAttentionMask} = await this.runEncoderInference(inputTokens);
        // Run optimized decoder with early stopping
        const generatedText = await this.runOptimizedDecoder(encoderHiddenStates, encoderAttentionMask);
        return generatedText;
    }

    async runFullInference(inputTokens) {
        // Always run both encoder and decoder
        const {encoderHiddenStates, encoderAttentionMask} = await this.runEncoderInference(inputTokens);
        const generatedText = await this.runDecoderInference(encoderHiddenStates, encoderAttentionMask);
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
        
        return {encoderHiddenStates: encoderOutputTensor, encoderAttentionMask: attentionMask};
    }

    async runDecoderInference(encoderHiddenStates, encoderAttentionMask) {
        // Prepare decoder inputs
        // Start with the beginning-of-sequence token (ID 2 for mT5)
        const decoderInputIds = [2]; // <s> token
        const maxGenerationLength = 20; // Reduce for faster responses
        
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
                encoder_attention_mask: encoderAttentionMask
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
            
            // Stop if we generate end-of-sequence token (ID 3 for mT5) or period/exclamation
            if (nextTokenId === 3 || nextTokenId === 1 || generatedTokens.length > 15) {
                break;
            }
            
            generatedTokens.push(nextTokenId);
        }
        
        this.debugConsole.log(`Generated ${generatedTokens.length} tokens: ${generatedTokens.slice(1)}`, 'verbose');
        
        // Decode tokens to text (simple decoding for now)
        return this.decodeTokensToText(generatedTokens.slice(1)); // Remove start token
    }

    async runOptimizedDecoder(encoderHiddenStates, encoderAttentionMask) {
        // Start with the beginning-of-sequence token (ID 2 for mT5)
        const decoderInputIds = [2]; // <s> token
        const maxGenerationLength = 10; // Even shorter for speed
        
        let generatedTokens = [...decoderInputIds];
        let repetitionCount = 0;
        let lastToken = -1;
        
        // Generate tokens with anti-repetition logic
        for (let i = 0; i < maxGenerationLength; i++) {
            const decoderInputTensor = new ort.Tensor('int64', BigInt64Array.from(generatedTokens.map(id => BigInt(id))), [1, generatedTokens.length]);
            
            const decoderFeeds = {
                input_ids: decoderInputTensor,
                encoder_hidden_states: encoderHiddenStates,
                encoder_attention_mask: encoderAttentionMask
            };
            
            const decoderResults = await this.decoderSession.run(decoderFeeds);
            const logitsTensor = decoderResults[Object.keys(decoderResults)[0]];
            const logits = Array.from(logitsTensor.data);
            
            // Get the logits for the last position
            const vocabSize = Math.floor(logits.length / generatedTokens.length);
            const lastPositionLogits = logits.slice((generatedTokens.length - 1) * vocabSize, generatedTokens.length * vocabSize);
            
            // Find the token with highest probability, but avoid repetition
            let nextTokenId = 0;
            let maxLogit = -Infinity;
            
            // First pass: find the best token that's not a repeat
            for (let j = 0; j < Math.min(lastPositionLogits.length, 1000); j++) { // Limit to our vocab size
                if (lastPositionLogits[j] > maxLogit && j !== lastToken) {
                    maxLogit = lastPositionLogits[j];
                    nextTokenId = j;
                }
            }
            
            // If we're getting the same token, force different selection
            if (nextTokenId === lastToken) {
                repetitionCount++;
                if (repetitionCount > 2) {
                    this.debugConsole.log('Breaking repetition loop', 'verbose');
                    break;
                }
                // Pick second-best token
                let secondBest = 0;
                let secondMaxLogit = -Infinity;
                for (let j = 0; j < Math.min(lastPositionLogits.length, 1000); j++) {
                    if (j !== nextTokenId && lastPositionLogits[j] > secondMaxLogit) {
                        secondMaxLogit = lastPositionLogits[j];
                        secondBest = j;
                    }
                }
                nextTokenId = secondBest;
            } else {
                repetitionCount = 0;
            }
            
            // Stop conditions
            if (nextTokenId === 3 || nextTokenId === 1 || generatedTokens.length >= 8) {
                break;
            }
            
            generatedTokens.push(nextTokenId);
            lastToken = nextTokenId;
        }
        
        this.debugConsole.log(`Optimized generation: ${generatedTokens.length} tokens: ${generatedTokens.slice(1)}`, 'verbose');
        
        // Decode with improved text processing
        return this.decodeTokensToText(generatedTokens.slice(1)); // Remove start token
    }

    decodeTokensToText(tokens) {
        // Improved reverse vocabulary lookup
        const reverseVocab = {};
        for (const [word, id] of Object.entries(this.tokenizer.vocab)) {
            reverseVocab[id] = word;
        }
        
        const words = tokens.map(tokenId => reverseVocab[tokenId] || '').filter(word => word && word !== '<unk>');
        
        // Join and clean up the text
        let text = words.join(' ').trim();
        
        // Add basic punctuation if missing
        if (text && !text.match(/[.!?]$/)) {
            text += '.';
        }
        
        // Capitalize first letter
        if (text) {
            text = text.charAt(0).toUpperCase() + text.slice(1);
        }
        
        return text || "I understand.";
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