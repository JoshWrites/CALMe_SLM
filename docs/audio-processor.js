/*
 * AI Therapy Assistant Demo
 * Copyright (c) 2025 CALMe Team
 * 
 * Educational and non-commercial use only.
 * See LICENSE file for full terms.
 */

class AudioProcessor extends EventTarget {
    constructor(debugConsole) {
        super();
        this.debugConsole = debugConsole;
        this.audioContext = null;
        this.mediaStream = null;
        this.processor = null;
        this.recognizer = null;
        this.model = null;
        this.isInitialized = false;
        this.isRecording = false;
        this.audioLevel = 0;
        this.voskReady = false;
        this.modelCache = null;
        
        this.initializeCache();
    }

    async initializeCache() {
        try {
            if ('caches' in window) {
                this.modelCache = await caches.open('vosk-models-v1');
                this.debugConsole.log('VOSK model cache initialized', 'verbose');
            }
        } catch (error) {
            this.debugConsole.log(`VOSK cache initialization failed: ${error.message}`, 'warn');
        }
    }

    async checkVoskModelCache() {
        if (!this.modelCache) return null;
        
        try {
            const cacheKey = CONFIG.models.vosk.cache_key;
            const response = await this.modelCache.match(cacheKey);
            
            if (response) {
                const data = await response.arrayBuffer();
                this.debugConsole.log(`Found cached VOSK model: ${(data.byteLength / 1024 / 1024).toFixed(2)}MB`, 'verbose');
                return data;
            }
        } catch (error) {
            this.debugConsole.log(`VOSK cache check failed: ${error.message}`, 'warn');
        }
        
        return null;
    }

    async downloadVoskModel() {
        const modelUrl = CONFIG.models.vosk.model_url;
        
        try {
            this.debugConsole.log(`Downloading VOSK model from: ${modelUrl}`, 'verbose');
            
            const response = await fetch(modelUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const modelData = await response.arrayBuffer();
            this.debugConsole.log(`VOSK model downloaded: ${(modelData.byteLength / 1024 / 1024).toFixed(2)}MB`, 'info');
            
            return modelData;
            
        } catch (error) {
            this.debugConsole.log(`VOSK model download failed: ${error.message}`, 'error');
            throw new Error(`Failed to download VOSK model: ${error.message}`);
        }
    }

    async cacheVoskModel(modelData) {
        if (!this.modelCache) return;
        
        try {
            const cacheKey = CONFIG.models.vosk.cache_key;
            const response = new Response(modelData, {
                headers: {
                    'Content-Type': 'application/zip',
                    'Content-Length': modelData.byteLength.toString()
                }
            });
            
            await this.modelCache.put(cacheKey, response);
            this.debugConsole.log('VOSK model cached successfully', 'verbose');
            
        } catch (error) {
            this.debugConsole.log(`Failed to cache VOSK model: ${error.message}`, 'warn');
        }
    }

    async initialize() {
        try {
            this.debugConsole.log('Initializing VOSK speech recognition', 'info');
            
            // Load VOSK model
            await this.loadVoskModel();
            
            this.isInitialized = true;
            this.debugConsole.log('VOSK speech recognition initialized successfully', 'info');
            
        } catch (error) {
            this.debugConsole.log(`VOSK initialization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async loadVoskModel() {
        try {
            this.debugConsole.log('Loading VOSK WebAssembly module', 'verbose');
            
            // Initialize VOSK WebAssembly
            if (typeof Vosk === 'undefined') {
                throw new Error('VOSK library not loaded');
            }
            
            // Check for cached VOSK model
            const cachedModel = await this.checkVoskModelCache();
            
            let modelData;
            if (cachedModel) {
                this.debugConsole.log('Loading VOSK model from cache', 'info');
                modelData = cachedModel;
            } else {
                this.debugConsole.log('Downloading VOSK model', 'info');
                modelData = await this.downloadVoskModel();
                await this.cacheVoskModel(modelData);
            }
            
            // Create model from URL (VOSK will handle download internally)
            this.debugConsole.log('Creating VOSK model', 'verbose');
            const modelUrl = CONFIG.models.vosk.model_url;
            this.model = await Vosk.createModel(modelUrl);
            
            this.debugConsole.log('Creating VOSK recognizer', 'verbose');
            this.recognizer = new this.model.KaldiRecognizer(CONFIG.models.vosk.sample_rate);
            
            // Set up event listeners for recognition results
            this.recognizer.on('result', (result) => {
                if (result && result.text && result.text.trim()) {
                    this.debugConsole.log(`Speech recognition result: "${result.text}"`, 'verbose');
                    this.dispatchEvent(new CustomEvent('result', { detail: result.text.trim() }));
                }
            });
            
            this.recognizer.on('partialresult', (result) => {
                if (result && result.partial && result.partial.trim()) {
                    this.dispatchEvent(new CustomEvent('partial', { detail: result.partial.trim() }));
                }
            });
            
            this.voskReady = true;
            this.debugConsole.log('VOSK model loaded successfully', 'info');
            
        } catch (error) {
            this.debugConsole.log(`Failed to load VOSK model: ${error.message}`, 'error');
            throw error;
        }
    }

    async startRecording() {
        if (!this.isInitialized || !this.voskReady) {
            throw new Error('Audio processor not initialized');
        }

        try {
            this.debugConsole.log('Requesting microphone access', 'verbose');
            
            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: CONFIG.audio.audio_context_options
            });
            
            this.debugConsole.log('Microphone access granted', 'info');
            
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: CONFIG.models.vosk.sample_rate
            });
            
            // Create audio processing pipeline
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.processor = this.audioContext.createScriptProcessor(CONFIG.audio.chunk_size, 1, 1);
            
            this.processor.onaudioprocess = (e) => this.processAudio(e);
            
            // Connect nodes
            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
            
            this.isRecording = true;
            this.debugConsole.log('Recording started', 'info');
            
        } catch (error) {
            this.debugConsole.log(`Failed to start recording: ${error.message}`, 'error');
            throw error;
        }
    }

    processAudio(event) {
        if (!this.isRecording || !this.voskReady) return;
        
        const inputBuffer = event.inputBuffer;
        
        // Calculate audio level for visual feedback
        const inputData = inputBuffer.getChannelData(0);
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
        }
        this.audioLevel = Math.min(100, (sum / inputData.length) * 500);
        this.dispatchEvent(new CustomEvent('audioLevel', { detail: this.audioLevel }));
        
        // Process with real VOSK
        if (this.recognizer) {
            try {
                // Pass AudioBuffer directly to VOSK (it expects AudioBuffer, not Int16Array)
                this.recognizer.acceptWaveform(inputBuffer);
            } catch (error) {
                this.debugConsole.log(`Speech processing error: ${error.message}`, 'warn');
            }
        }
    }

    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        // Stop speech recognition
        if (this.recognizer && this.recognizer.stopListening) {
            this.recognizer.stopListening();
        }
        
        // Clean up audio nodes
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        
        // Stop media stream
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        // Close audio context
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.audioLevel = 0;
        this.dispatchEvent(new CustomEvent('audioLevel', { detail: 0 }));
        
        this.debugConsole.log('Recording stopped', 'info');
    }

    destroy() {
        this.stopRecording();
        this.recognizer = null;
        this.model = null;
        this.isInitialized = false;
        this.voskReady = false;
    }
}