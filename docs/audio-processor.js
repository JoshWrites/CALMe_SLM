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
        this.webSpeechFallback = null;
        this.webSpeechListening = false;
    }

    setupWebSpeechFallback() {
        this.debugConsole.log('Setting up Web Speech API fallback', 'info');
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            throw new Error('Neither VOSK nor Web Speech API is available');
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.webSpeechFallback = new SpeechRecognition();
        
        this.webSpeechFallback.continuous = false;
        this.webSpeechFallback.interimResults = true;
        this.webSpeechFallback.lang = 'en-US';
        
        this.webSpeechFallback.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    this.dispatchEvent(new CustomEvent('result', { detail: transcript.trim() }));
                } else {
                    this.dispatchEvent(new CustomEvent('partial', { detail: transcript.trim() }));
                }
            }
        };
        
        this.webSpeechFallback.onerror = (event) => {
            this.debugConsole.log(`Web Speech API error: ${event.error}`, 'error');
        };
        
        this.debugConsole.log('Web Speech API fallback ready', 'info');
    }

    startWebSpeechListening() {
        if (this.webSpeechFallback && !this.webSpeechListening) {
            this.webSpeechListening = true;
            try {
                this.webSpeechFallback.start();
                this.debugConsole.log('Started Web Speech API listening', 'verbose');
            } catch (error) {
                this.debugConsole.log(`Web Speech API start error: ${error.message}`, 'warn');
                this.webSpeechListening = false;
            }
            
            // Auto-stop after 5 seconds
            setTimeout(() => {
                this.stopWebSpeechListening();
            }, 5000);
        }
    }

    stopWebSpeechListening() {
        if (this.webSpeechFallback && this.webSpeechListening) {
            this.webSpeechListening = false;
            try {
                this.webSpeechFallback.stop();
                this.debugConsole.log('Stopped Web Speech API listening', 'verbose');
            } catch (error) {
                this.debugConsole.log(`Web Speech API stop error: ${error.message}`, 'warn');
            }
        }
    }


    async initialize() {
        try {
            this.debugConsole.log('Initializing VOSK speech recognition', 'info');
            
            // Check WebAssembly support
            if (typeof WebAssembly === 'undefined') {
                throw new Error('WebAssembly not supported - falling back to Web Speech API');
            }
            
            // Load VOSK model
            await this.loadVoskModel();
            
            this.isInitialized = true;
            this.debugConsole.log('VOSK speech recognition initialized successfully', 'info');
            
        } catch (error) {
            this.debugConsole.log(`VOSK initialization failed: ${error.message}`, 'warn');
            this.debugConsole.log('Falling back to Web Speech API', 'info');
            
            // Fall back to Web Speech API
            try {
                this.setupWebSpeechFallback();
                this.voskReady = true;
                this.isInitialized = true;
                this.debugConsole.log('Web Speech API fallback initialized successfully', 'info');
            } catch (fallbackError) {
                this.debugConsole.log(`Web Speech API fallback failed: ${fallbackError.message}`, 'error');
                throw new Error('Both VOSK and Web Speech API failed to initialize');
            }
        }
    }

    async loadVoskModel() {
        try {
            this.debugConsole.log('Loading VOSK WebAssembly module', 'verbose');
            
            // Check VOSK library availability
            if (typeof Vosk === 'undefined') {
                throw new Error('VOSK library not loaded');
            }
            
            // Test WebAssembly compilation capability
            try {
                // Try to compile a minimal WASM module to test capability
                const testWasm = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
                await WebAssembly.compile(testWasm);
                this.debugConsole.log('WebAssembly compilation test passed', 'verbose');
            } catch (wasmError) {
                throw new Error(`WebAssembly compilation failed: ${wasmError.message}`);
            }
            
            // Create model from URL (VOSK will handle download internally)
            this.debugConsole.log('Creating VOSK model', 'verbose');
            
            // Try different model URLs in order of preference
            const modelUrls = [
                // GitHub Releases (most reliable)
                'https://github.com/JoshWrites/CALMe_SLM/releases/download/v0.0.5/vosk-model-small-en-us-0.15.zip',
                // Direct from alphacephei (original source)
                'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip',
                // Backup CDN sources
                'https://cdn.jsdelivr.net/gh/alphacephei/vosk-models@master/models/vosk-model-small-en-us-0.15.zip',
                // Fallback to config
                CONFIG.models.vosk.model_url
            ];
            
            let modelCreated = false;
            let lastError = null;
            
            for (let i = 0; i < modelUrls.length; i++) {
                const modelUrl = modelUrls[i];
                try {
                    this.debugConsole.log(`Trying to load model from: ${modelUrl} (${i + 1}/${modelUrls.length})`, 'verbose');
                    
                    // Add timeout for model loading
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Model loading timeout (60s)')), 60000);
                    });
                    
                    this.model = await Promise.race([
                        Vosk.createModel(modelUrl),
                        timeoutPromise
                    ]);
                    
                    this.debugConsole.log(`Successfully loaded model from: ${modelUrl}`, 'info');
                    modelCreated = true;
                    break;
                } catch (error) {
                    lastError = error;
                    const errorMsg = error.message || error.toString();
                    
                    // Categorize errors for better debugging
                    if (errorMsg.includes('CORS') || errorMsg.includes('blocked')) {
                        this.debugConsole.log(`CORS error for ${modelUrl}: ${errorMsg}`, 'warn');
                    } else if (errorMsg.includes('WebAssembly') || errorMsg.includes('wasm')) {
                        this.debugConsole.log(`WebAssembly error for ${modelUrl}: ${errorMsg}`, 'warn');
                    } else if (errorMsg.includes('404') || errorMsg.includes('Not Found')) {
                        this.debugConsole.log(`Model not found at ${modelUrl}: ${errorMsg}`, 'warn');
                    } else {
                        this.debugConsole.log(`Failed to load model from ${modelUrl}: ${errorMsg}`, 'warn');
                    }
                    
                    // Add delay between attempts to avoid overwhelming servers
                    if (i < modelUrls.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
            
            if (!modelCreated) {
                this.debugConsole.log(`All VOSK sources failed. Last error: ${lastError?.message}`, 'error');
                this.debugConsole.log('Falling back to Web Speech API', 'warn');
                this.setupWebSpeechFallback();
                this.voskReady = true;
                return;
            }
            
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
        
        // Process with real VOSK or Web Speech API fallback
        if (this.recognizer) {
            try {
                // Pass AudioBuffer directly to VOSK (it expects AudioBuffer, not Int16Array)
                this.recognizer.acceptWaveform(inputBuffer);
            } catch (error) {
                this.debugConsole.log(`Speech processing error: ${error.message}`, 'warn');
            }
        } else if (this.webSpeechFallback && !this.webSpeechListening) {
            // Start Web Speech API listening when audio activity is detected
            if (this.audioLevel > 5) {
                this.startWebSpeechListening();
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
        
        // Stop Web Speech API fallback
        this.stopWebSpeechListening();
        
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