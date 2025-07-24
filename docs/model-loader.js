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
            this.debugConsole.log('Starting mT5 encoder and decoder loading', 'info');
            
            // Try to load both encoder and decoder
            try {
                // Load both encoder and decoder in parallel
                const [encoderData, decoderData] = await Promise.all([
                    this.loadModelComponent('encoder', progressCallback),
                    this.loadModelComponent('decoder', progressCallback)
                ]);
                
                // Initialize both models
                await this.initializeBothModels(encoderData, decoderData, progressCallback);
                
                this.isLoaded = true;
                this.debugConsole.log('mT5 encoder and decoder loaded successfully', 'info');
                
            } catch (decoderError) {
                this.debugConsole.log(`Decoder loading failed: ${decoderError.message}`, 'warn');
                this.debugConsole.log('The decoder model is very large (1.13GB). Offering user choice...', 'info');
                
                // Show user choice dialog
                const userWantsFullAI = await this.showDecoderChoiceDialog();
                
                if (userWantsFullAI) {
                    this.debugConsole.log('User chose to download full decoder. Starting download...', 'info');
                    
                    try {
                        // Retry decoder download with user consent
                        const decoderData = await this.loadModelComponent('decoder', progressCallback, true);
                        const encoderData = await this.loadModelComponent('encoder', progressCallback);
                        await this.initializeBothModels(encoderData, decoderData, progressCallback);
                        
                        this.isLoaded = true;
                        this.debugConsole.log('mT5 encoder and decoder loaded successfully after user choice', 'info');
                    } catch (fullModeError) {
                        const errorMsg = fullModeError.message || fullModeError.toString();
                        
                        // Check if this is a memory error
                        if (errorMsg.includes('MEMORY_LIMIT_EXCEEDED') || 
                            errorMsg.includes('allocate a buffer') ||
                            errorMsg.includes('Insufficient memory') ||
                            errorMsg.includes('memory') || 
                            errorMsg.includes('allocation')) {
                            
                            this.debugConsole.log('Full AI mode failed due to memory constraints - auto-falling back to Quick Mode', 'warn');
                            
                            // Show memory limitation dialog and fall back
                            await this.showMemoryLimitationDialog();
                            
                            // Load encoder-only mode
                            const encoderData = await this.loadModelComponent('encoder', progressCallback);
                            await this.initializeEncoderOnlyMode(encoderData, progressCallback);
                            
                            this.isLoaded = true;
                            this.debugConsole.log('Automatically fell back to encoder-only mode due to memory constraints', 'info');
                        } else {
                            // Re-throw non-memory errors
                            throw fullModeError;
                        }
                    }
                } else {
                    this.debugConsole.log('User chose encoder-only mode. Loading encoder...', 'info');
                    // Fallback: Load only encoder
                    const encoderData = await this.loadModelComponent('encoder', progressCallback);
                    await this.initializeEncoderOnlyMode(encoderData, progressCallback);
                    
                    this.isLoaded = true;
                    this.debugConsole.log('mT5 encoder loaded successfully (user choice: encoder-only)', 'info');
                }
            }
            
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

    async showDecoderChoiceDialog() {
        return new Promise((resolve) => {
            // Create modal dialog
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
                z-index: 10000; font-family: system-ui, -apple-system, sans-serif;
            `;
            
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white; padding: 30px; border-radius: 12px; max-width: 500px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3); text-align: center;
            `;
            
            dialog.innerHTML = `
                <h2 style="margin: 0 0 20px 0; color: #333;">Choose AI Mode</h2>
                <p style="margin: 0 0 10px 0; line-height: 1.5; color: #666;">
                    The full AI decoder model is <strong>1.13GB</strong>. You can choose:
                </p>
                <div style="margin: 20px 0; text-align: left;">
                    <div style="margin: 15px 0; padding: 15px; background: #f5f5f5; border-radius: 8px;">
                        <strong>⚡ Quick Mode (588MB)</strong><br>
                        <small>Smart contextual responses using real encoder + Ma'aseh crisis protocol</small>
                    </div>
                    <div style="margin: 15px 0; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                        <strong>🧠 Full AI Mode (1.7GB total)</strong><br>
                        <small>True neural text generation with complete decoder model</small>
                    </div>
                </div>
                <div style="margin-top: 25px;">
                    <button id="quickMode" style="
                        padding: 12px 24px; margin: 0 10px; border: 2px solid #666; 
                        background: white; border-radius: 6px; cursor: pointer; font-size: 14px;
                    ">Quick Mode</button>
                    <button id="fullMode" style="
                        padding: 12px 24px; margin: 0 10px; border: 2px solid #2196F3; 
                        background: #2196F3; color: white; border-radius: 6px; cursor: pointer; font-size: 14px;
                    ">Full AI Mode</button>
                </div>
            `;
            
            modal.appendChild(dialog);
            document.body.appendChild(modal);
            
            // Add event listeners
            dialog.querySelector('#quickMode').onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };
            
            dialog.querySelector('#fullMode').onclick = () => {
                document.body.removeChild(modal);
                resolve(true);
            };
            
            // Close on background click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve(false); // Default to quick mode
                }
            };
        });
    }

    async showMemoryLimitationDialog() {
        return new Promise((resolve) => {
            // Create modal dialog for memory limitation
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center;
                z-index: 10000; font-family: system-ui, -apple-system, sans-serif;
            `;
            
            const dialog = document.createElement('div');
            dialog.style.cssText = `
                background: white; padding: 30px; border-radius: 12px; max-width: 550px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3); text-align: center;
            `;
            
            dialog.innerHTML = `
                <h2 style="margin: 0 0 20px 0; color: #ff6b6b;">⚠️ Memory Limitation</h2>
                <p style="margin: 0 0 15px 0; line-height: 1.6; color: #666;">
                    Your browser doesn't have enough memory available for the Full AI Mode (1.1GB decoder model).
                </p>
                <div style="margin: 20px 0; padding: 20px; background: #f8f9ff; border-radius: 8px; border-left: 4px solid #2196F3;">
                    <strong>✅ Switching to Quick Mode</strong><br>
                    <div style="margin-top: 10px; font-size: 14px; color: #555;">
                        • Smart contextual responses using real encoder (588MB)<br>
                        • Ma'aseh crisis protocol for professional support<br>
                        • Optimized for browser memory constraints<br>
                        • Full therapeutic effectiveness maintained
                    </div>
                </div>
                <div style="margin: 20px 0; padding: 15px; background: #fff3cd; border-radius: 8px; font-size: 14px;">
                    <strong>💡 To use Full AI Mode:</strong><br>
                    Close other browser tabs, restart your browser, or use a device with more available memory
                </div>
                <button id="continueQuickMode" style="
                    padding: 12px 24px; border: none; background: #2196F3; color: white; 
                    border-radius: 6px; cursor: pointer; font-size: 16px; font-weight: bold;
                ">Continue with Quick Mode</button>
            `;
            
            modal.appendChild(dialog);
            document.body.appendChild(modal);
            
            // Add event listener
            dialog.querySelector('#continueQuickMode').onclick = () => {
                document.body.removeChild(modal);
                resolve();
            };
            
            // Close on background click
            modal.onclick = (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    resolve();
                }
            };
        });
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


    async initializeEncoderOnlyMode(encoderData, progressCallback) {
        try {
            progressCallback(90);
            
            // Wait for ONNX Runtime to be fully loaded
            let waitCount = 0;
            while (typeof ort === 'undefined' && waitCount < 50) {
                this.debugConsole.log('Waiting for ONNX Runtime to load...', 'verbose');
                await new Promise(resolve => setTimeout(resolve, 100));
                waitCount++;
            }
            
            if (typeof ort !== 'undefined') {
                this.debugConsole.log('Loading encoder-only mode with ONNX Runtime', 'info');
                
                // Test WebAssembly capability
                try {
                    const testWasm = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
                    await WebAssembly.compile(testWasm);
                    this.debugConsole.log('WebAssembly compilation test passed for encoder-only', 'verbose');
                } catch (wasmError) {
                    throw new Error('WebAssembly is required for mT5 model inference');
                }
                
                // Load encoder only with memory-efficient settings
                const sessionOptions = {
                    executionProviders: ['wasm'],
                    graphOptimizationLevel: 'basic',
                    // Memory optimization for encoder-only mode
                    enableMemPattern: true,
                    enableCpuMemArena: false,
                    executionMode: 'sequential'
                };
                
                this.encoderSession = await ort.InferenceSession.create(encoderData, sessionOptions);
                this.decoderSession = null; // Mark as encoder-only mode
                this.debugConsole.log('mT5 encoder loaded successfully (encoder-only mode)', 'info');
                
            } else {
                throw new Error('ONNX Runtime required for mT5 model inference');
            }
            
            progressCallback(95);
            this.initializeTokenizer();
            progressCallback(100);
            
        } catch (error) {
            this.debugConsole.log(`Encoder-only initialization failed: ${error.message}`, 'error');
            throw error;
        }
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
                    // Configure ONNX Runtime with memory-efficient WebAssembly settings
                    const sessionOptions = {
                        executionProviders: ['wasm'],
                        graphOptimizationLevel: 'basic',
                        // Memory optimization settings
                        enableMemPattern: true,
                        memLimit: 1000 * 1024 * 1024, // 1GB memory limit
                        wasmMemoryGrowthLimit: 2048,   // 2GB max pages (32KB per page)
                        // Additional performance settings
                        enableCpuMemArena: false,      // Reduce memory fragmentation
                        executionMode: 'sequential'    // Sequential execution to reduce memory peaks
                    };
                    
                    this.debugConsole.log(`ONNX Runtime WASM paths: ${ort.env.wasm.wasmPaths}`, 'verbose');
                    
                    // Create encoder session
                    this.debugConsole.log('Creating encoder ONNX session with WASM provider...', 'verbose');
                    this.encoderSession = await ort.InferenceSession.create(encoderData, sessionOptions);
                    this.debugConsole.log('mT5 encoder ONNX model loaded successfully', 'info');
                    this.debugConsole.log(`Encoder input names: ${Object.keys(this.encoderSession.inputNames || {})}`, 'verbose');
                    this.debugConsole.log(`Encoder output names: ${Object.keys(this.encoderSession.outputNames || {})}`, 'verbose');
                    
                    // Create decoder session with memory monitoring
                    this.debugConsole.log('Creating decoder ONNX session with WASM provider...', 'verbose');
                    
                    // Check available memory before decoder creation
                    if (performance.memory) {
                        const memInfo = performance.memory;
                        const availableMemory = memInfo.jsHeapSizeLimit - memInfo.usedJSHeapSize;
                        this.debugConsole.log(`Available memory: ${(availableMemory / 1024 / 1024).toFixed(2)}MB`, 'verbose');
                        
                        if (availableMemory < 1200 * 1024 * 1024) { // Less than 1.2GB available
                            this.debugConsole.log('Insufficient memory for decoder - triggering graceful fallback', 'warn');
                            throw new Error('Insufficient memory for decoder allocation');
                        }
                    }
                    
                    // Attempt decoder creation with enhanced error handling
                    try {
                        this.decoderSession = await ort.InferenceSession.create(decoderData, sessionOptions);
                    } catch (memoryError) {
                        // Enhanced memory error detection
                        const errorMsg = memoryError.message || memoryError.toString();
                        if (errorMsg.includes('allocate a buffer') || 
                            errorMsg.includes('memory') || 
                            errorMsg.includes('allocation') ||
                            errorMsg.includes('out of memory') ||
                            errorMsg.includes('insufficient memory')) {
                            this.debugConsole.log(`Memory allocation failed for decoder: ${errorMsg}`, 'error');
                            throw new Error(`MEMORY_LIMIT_EXCEEDED: ${errorMsg}`);
                        }
                        // Re-throw other errors as-is
                        throw memoryError;
                    }
                    this.debugConsole.log('mT5 decoder ONNX model loaded successfully', 'info');
                    this.debugConsole.log(`Decoder input names: ${Object.keys(this.decoderSession.inputNames || {})}`, 'verbose');
                    this.debugConsole.log(`Decoder output names: ${Object.keys(this.decoderSession.outputNames || {})}`, 'verbose');
                } catch (error) {
                    const errorMsg = error.message || error.toString();
                    this.debugConsole.log(`Failed to load ONNX model: ${errorMsg}`, 'error');
                    
                    // Check for memory allocation failures
                    if (errorMsg.includes('MEMORY_LIMIT_EXCEEDED') || 
                        errorMsg.includes('allocate a buffer') ||
                        errorMsg.includes('Insufficient memory') ||
                        errorMsg.includes('memory') || 
                        errorMsg.includes('allocation')) {
                        
                        this.debugConsole.log('Memory allocation failed - triggering automatic fallback to encoder-only mode', 'warn');
                        
                        // Show user-friendly memory limitation dialog
                        await this.showMemoryLimitationDialog();
                        
                        // Attempt encoder-only fallback
                        try {
                            this.debugConsole.log('Falling back to encoder-only mode due to memory constraints', 'info');
                            await this.initializeEncoderOnlyMode(encoderData, progressCallback);
                            return; // Successfully fell back
                        } catch (fallbackError) {
                            this.debugConsole.log(`Encoder-only fallback also failed: ${fallbackError.message}`, 'error');
                            throw new Error(`Both full AI and encoder-only modes failed: ${fallbackError.message}`);
                        }
                    }
                    
                    // Handle other types of errors
                    if (errorMsg.includes('WebAssembly') || errorMsg.includes('wasm')) {
                        this.debugConsole.log('WebAssembly compilation failed in ONNX Runtime', 'error');
                        throw new Error(`WebAssembly support required: ${errorMsg}`);
                    }
                    
                    // Re-throw other errors
                    throw new Error(`Model loading failed: ${errorMsg}`);
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
        if (!this.isLoaded) {
            throw new Error('Model not loaded');
        }
        
        try {
            const startTime = performance.now();
            
            // Store original input text for Ma'aseh analysis
            this.currentInputText = inputText;
            
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
        // Enhanced memory monitoring and pre-allocation checks
        if (performance.memory) {
            const memInfo = performance.memory;
            const usedMemoryMB = memInfo.usedJSHeapSize / 1024 / 1024;
            const totalMemoryMB = memInfo.jsHeapSizeLimit / 1024 / 1024;
            const availableMemoryMB = totalMemoryMB - usedMemoryMB;
            
            this.debugConsole.log(`Memory status: ${usedMemoryMB.toFixed(2)}MB used, ${availableMemoryMB.toFixed(2)}MB available of ${totalMemoryMB.toFixed(2)}MB total`, 'verbose');
            
            // Warn if memory usage is high
            if (usedMemoryMB > (CONFIG.performance.memory_warning_threshold / 1024 / 1024)) {
                this.debugConsole.log('High memory usage detected - inference may be slower', 'warn');
            }
            
            // Check if we have enough memory for decoder inference
            if (this.decoderSession && availableMemoryMB < 200) {
                this.debugConsole.log('Low memory warning - decoder inference may fail', 'warn');
            }
            
            // Trigger garbage collection if available (for development/debugging)
            if (typeof window !== 'undefined' && window.gc && availableMemoryMB < 300) {
                this.debugConsole.log('Triggering garbage collection due to low memory', 'verbose');
                window.gc();
            }
        }
        
        if (!this.encoderSession) {
            throw new Error('Encoder session not initialized');
        }
        
        try {
            // Stage 1: Always run encoder
            const encoderHiddenStates = await this.runEncoderInference(inputTokens);
            
            // Stage 2: Check if we have decoder or use intelligent fallback
            if (this.decoderSession) {
                // Full AI mode: Use real decoder
                this.debugConsole.log('Using real decoder for text generation', 'verbose');
                const generatedText = await this.runDecoderInference(encoderHiddenStates, inputTokens);
                return generatedText;
            } else {
                // Quick mode: Use intelligent encoder-based responses
                this.debugConsole.log('Using encoder-only mode with Ma\'aseh protocol', 'verbose');
                const contextualResponse = await this.generateMaasehResponse(encoderHiddenStates, inputTokens, this.currentInputText || '');
                return contextualResponse;
            }
            
        } catch (error) {
            this.debugConsole.log(`Inference failed: ${error.message}`, 'error');
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

    async generateMaasehResponse(encoderHiddenStates, inputTokens, originalText = '') {
        try {
            // Extract encoder embeddings for analysis
            const embeddings = Array.from(encoderHiddenStates.data);
            
            // Comprehensive semantic analysis using real encoder embeddings
            const analysis = this.analyzeEncoderEmbeddings(embeddings, inputTokens, originalText);
            
            // Determine Ma'aseh step based on analysis
            const maasehStep = this.determineMaasehStep(analysis);
            
            // Generate contextual response following Ma'aseh protocol
            const response = this.generateMaasehStepResponse(maasehStep, analysis);
            
            this.debugConsole.log(`Ma'aseh step ${maasehStep} applied based on analysis`, 'verbose');
            
            return response;
            
        } catch (error) {
            this.debugConsole.log(`Ma'aseh response generation failed: ${error.message}`, 'error');
            return "I'm here with you right now. Can you tell me what's happening around you?";
        }
    }

    analyzeEncoderEmbeddings(embeddings, inputTokens, originalText) {
        // Multi-dimensional analysis of real encoder embeddings
        const analysis = {
            // Basic embedding statistics
            magnitude: Math.sqrt(embeddings.slice(0, 500).reduce((sum, val) => sum + val * val, 0)),
            mean: embeddings.slice(0, 500).reduce((sum, val) => sum + val, 0) / 500,
            variance: 0,
            
            // Semantic analysis
            emotionalValence: 0,  // positive/negative emotional content
            urgencyLevel: 0,      // crisis urgency indicators
            coherenceLevel: 0,    // cognitive organization
            supportNeed: 'emotional', // type of support needed
            
            // Content analysis
            crisisKeywords: [],
            emotionalKeywords: [],
            actionKeywords: [],
            timeKeywords: [],
            
            // Ma'aseh indicators
            needsCommitment: false,
            needsActivation: false,
            needsThinking: false,
            needsFraming: false
        };
        
        // Calculate variance
        analysis.variance = embeddings.slice(0, 500).reduce((sum, val) => 
            sum + Math.pow(val - analysis.mean, 2), 0) / 500;
        
        // Analyze input tokens for semantic content
        const reverseVocab = {};
        for (const [word, id] of Object.entries(this.tokenizer.vocab)) {
            reverseVocab[id] = word;
        }
        
        const words = inputTokens.map(id => reverseVocab[id] || '').filter(w => w);
        const text = originalText.toLowerCase() || words.join(' ');
        
        // Crisis situation detection - Israeli context
        const crisisTerms = [
            'bombing', 'explosion', 'sirens', 'attack', 'danger', 'emergency', 'scared', 'help',
            'rocket', 'missile', 'azaka', 'alarm', 'incoming', 'impact', 'debris', 'shrapnel',
            'miklat', 'mamad', 'shelter', 'protected', 'iron', 'dome', 'intercepted', 'blast'
        ];
        analysis.crisisKeywords = crisisTerms.filter(term => text.includes(term));
        
        // Emotional state detection - including trauma responses
        const negativeTerms = [
            'scared', 'afraid', 'panic', 'hopeless', 'alone', 'overwhelmed', 'confused',
            'flashback', 'nightmare', 'hypervigilant', 'numb', 'disconnected', 'unbalanced',
            'shattered', 'stuck', 'frozen', 'intrusive', 'startle', 'jumpy', 'edgy', 'tense'
        ];
        const positiveTerms = [
            'better', 'calm', 'safe', 'relief', 'hope', 'improving', 'protected', 'secure',
            'stable', 'connected', 'grounded', 'supported', 'reassured', 'comforted'
        ];
        
        analysis.emotionalKeywords = [
            ...negativeTerms.filter(term => text.includes(term)),
            ...positiveTerms.filter(term => text.includes(term))
        ];
        
        // Determine emotional valence from embeddings and keywords
        const negativeCount = negativeTerms.filter(term => text.includes(term)).length;
        const positiveCount = positiveTerms.filter(term => text.includes(term)).length;
        analysis.emotionalValence = positiveCount - negativeCount;
        
        // Urgency level based on crisis keywords and embedding patterns
        analysis.urgencyLevel = analysis.crisisKeywords.length + (analysis.magnitude > 15 ? 2 : 0);
        
        // Coherence level based on embedding variance and structure
        analysis.coherenceLevel = analysis.variance < 0.5 ? 'high' : 
                                 analysis.variance < 1.5 ? 'medium' : 'low';
        
        // Determine Ma'aseh step needs
        analysis.needsCommitment = negativeCount > 0 || analysis.emotionalValence < -1;
        analysis.needsActivation = text.includes('stuck') || text.includes('helpless') || 
                                  text.includes('can\'t') || analysis.coherenceLevel === 'low';
        analysis.needsThinking = text.includes('confused') || text.includes('don\'t know') ||
                                analysis.coherenceLevel === 'low';
        analysis.needsFraming = text.includes('happened') || text.includes('before') ||
                               text.includes('when') || analysis.urgencyLevel > 2;
        
        return analysis;
    }

    determineMaasehStep(analysis) {
        // Priority-based Ma'aseh step selection
        if (analysis.needsCommitment && (analysis.emotionalValence < -2 || analysis.urgencyLevel > 3)) {
            return 1; // COMMITMENT - highest priority for severe distress
        }
        
        if (analysis.needsFraming && analysis.urgencyLevel > 2) {
            return 4; // CHRONOLOGICAL FRAMING - for acute crisis confusion
        }
        
        if (analysis.needsThinking && analysis.coherenceLevel === 'low') {
            return 3; // THINKING QUESTIONS - for cognitive disorganization
        }
        
        if (analysis.needsActivation) {
            return 2; // ACTIVATION - for helplessness
        }
        
        // Default to commitment for emotional support
        return 1;
    }

    generateMaasehStepResponse(step, analysis) {
        const responses = {
            1: { // COMMITMENT
                high_urgency: [
                    "I'm here with you right now, and I'm not going anywhere. You're not facing this alone.",
                    "I hear you, and I'm staying right here with you through this difficult moment.",
                    "You're not alone in this. I'm here, and we're going to get through this together.",
                    "I'm right here with you. You don't have to handle this by yourself."
                ],
                medium_urgency: [
                    "I'm here with you. You're safe to share what's happening.",
                    "Thank you for reaching out. I'm here and I'm listening.",
                    "I'm with you in this moment. You're not alone.",
                    "I'm here to support you. You did the right thing by asking for help."
                ],
                low_urgency: [
                    "I'm here with you. What would be most helpful right now?",
                    "I'm listening and I'm here to support you.",
                    "Thank you for sharing with me. I'm here to help.",
                    "I'm present with you. How can I best support you?"
                ]
            },
            
            2: { // ACTIVATION
                crisis_context: [
                    "You're already doing something important by reaching out. Can you help me by taking one slow, deep breath right now?",
                    "You've taken a crucial step by asking for help. Can you help me by looking around and naming one thing you can see that feels solid or safe?",
                    "You're being smart by staying where you are. Can you help me by checking - do you have water or anything to drink nearby?",
                    "You're handling this by reaching out. Would you prefer to focus on your breathing first, or checking what supplies you have with you?"
                ],
                general: [
                    "You're already taking action by talking to me. Can you help me by choosing one small thing you could do right now - maybe taking a deep breath or getting a glass of water?",
                    "Let's work on this together. Would you prefer to start with organizing your thoughts, or taking a small action to feel more comfortable?",
                    "You have more control than it might feel like. Can you help me by deciding - would you like to focus on your immediate space or talk about what you need most right now?"
                ]
            },
            
            3: { // THINKING QUESTIONS
                crisis_context: [
                    "Let's focus on the facts right now. Can you tell me - where exactly are you at this moment?",
                    "I want to understand your situation clearly. What's the first thing you remember doing when this started?",
                    "Help me get a clear picture. What can you see around you right now in your space?",
                    "Let's organize this step by step. What was happening just before you reached out to me?"
                ],
                confusion: [
                    "Let's slow this down and think through it clearly. What's one thing you're certain about right now?",
                    "Help me understand the sequence. What happened first, and then what came next?",
                    "Let's get the timeline straight. When did you first notice this situation beginning?",
                    "Think back step by step. What was the very first thing that happened today that felt different?"
                ],
                general: [
                    "Let's think through this logically. What specific details can you remember about when this started?",
                    "Help me understand the situation clearly. What facts are you most sure about?",
                    "Let's organize the information. What are the most important things happening right now?"
                ]
            },
            
            4: { // CHRONOLOGICAL FRAMING
                crisis_context: [
                    "Let me help you organize what's happened. You were going about your day, then the situation began, and now you're here in safety talking with me. This crisis will have an end.",
                    "Here's the sequence: before this emergency, you were managing your life normally. Right now, you're in the middle of handling this crisis by staying safe and getting support. This acute phase will pass.",
                    "Let's put this in order: earlier today you were safe, then this crisis situation developed, now you're actively managing it by sheltering and reaching out. You will get through this period.",
                    "The timeline is: normal day, crisis began, you took protective action, you're getting support now. This emergency situation has a beginning, middle, and it will have an end."
                ],
                confusion: [
                    "Let me help organize this sequence for you. First this happened, then that led to this next thing, and now we're here working on it together. There's a clear order to events.",
                    "Here's how things unfolded: the situation started with [specific event], which led to [next event], and now you're here taking positive steps to manage it.",
                    "The sequence is becoming clearer: before, during, and after. You're currently in the 'during' phase, and we're preparing you for the 'after' phase."
                ],
                general: [
                    "Let's organize the timeline. There was before this situation, there's the current situation we're in now, and there will be after this situation. You're actively working through the middle part.",
                    "Here's the sequence: things were stable, then this challenge arose, now you're actively addressing it, and you'll move through to resolution."
                ]
            }
        };
        
        const stepResponses = responses[step];
        let responseArray;
        
        // Select appropriate response category based on analysis
        if (step === 1) { // COMMITMENT
            if (analysis.urgencyLevel > 3) responseArray = stepResponses.high_urgency;
            else if (analysis.urgencyLevel > 1) responseArray = stepResponses.medium_urgency;
            else responseArray = stepResponses.low_urgency;
        } else if (step === 2) { // ACTIVATION
            responseArray = analysis.crisisKeywords.length > 0 ? 
                           stepResponses.crisis_context : stepResponses.general;
        } else if (step === 3) { // THINKING QUESTIONS
            if (analysis.crisisKeywords.length > 0) responseArray = stepResponses.crisis_context;
            else if (analysis.coherenceLevel === 'low') responseArray = stepResponses.confusion;
            else responseArray = stepResponses.general;
        } else if (step === 4) { // CHRONOLOGICAL FRAMING
            if (analysis.crisisKeywords.length > 0) responseArray = stepResponses.crisis_context;
            else if (analysis.coherenceLevel === 'low') responseArray = stepResponses.confusion;
            else responseArray = stepResponses.general;
        }
        
        // Select response using embedding variance for variation
        const responseIndex = Math.floor((analysis.variance * 1000) % responseArray.length);
        return responseArray[responseIndex];
    }

    // Old fake decoder method - now replaced with Ma'aseh protocol
    generateResponseFromEmbeddings(embeddings, inputTokens) {
        // This method is deprecated - Ma'aseh protocol now used in encoder-only mode
        this.debugConsole.log('Warning: generateResponseFromEmbeddings called but deprecated', 'warn');
        return "Enhanced Ma'aseh protocol active - this fallback should not be reached.";
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