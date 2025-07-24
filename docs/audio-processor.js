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
        this.isInitialized = false;
        this.isRecording = false;
        this.silenceStart = null;
        this.audioLevel = 0;
        this.voskReady = false;
    }

    async initialize() {
        try {
            this.debugConsole.log('Initializing VOSK WebAssembly', 'verbose');
            
            // Initialize VOSK
            if (typeof createModule === 'undefined') {
                this.debugConsole.log('VOSK module not available, using mock implementation', 'warn');
                // Use mock implementation for demo
                const model = await this.loadVoskModel();
                this.recognizer = new model.KaldiRecognizer(CONFIG.models.vosk.sample_rate, CONFIG.models.vosk.alternatives);
                this.recognizer.setWords(true);
                this.voskReady = true;
                this.isInitialized = true;
                this.debugConsole.log('Mock VOSK initialized successfully', 'info');
                return;
            }

            const model = await this.loadVoskModel();
            
            // Create recognizer
            this.recognizer = new model.KaldiRecognizer(CONFIG.models.vosk.sample_rate, CONFIG.models.vosk.alternatives);
            this.recognizer.setWords(true);
            
            this.voskReady = true;
            this.isInitialized = true;
            
            this.debugConsole.log('VOSK initialized successfully', 'info');
        } catch (error) {
            this.debugConsole.log(`VOSK initialization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async loadVoskModel() {
        // In a real implementation, this would load the actual VOSK model
        // For now, we'll simulate it
        this.debugConsole.log('Loading VOSK model from: ' + CONFIG.models.vosk.model_path, 'verbose');
        
        // Simulate model loading
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    KaldiRecognizer: class {
                        constructor(sampleRate, alternatives) {
                            this.sampleRate = sampleRate;
                            this.alternatives = alternatives;
                        }
                        
                        setWords(value) {
                            // Mock implementation
                        }
                        
                        acceptWaveform(buffer) {
                            // Mock implementation
                            return Math.random() > 0.7;
                        }
                        
                        result() {
                            // Mock implementation
                            return JSON.stringify({
                                text: "This is a test transcription"
                            });
                        }
                        
                        partialResult() {
                            // Mock implementation
                            return JSON.stringify({
                                partial: "This is a partial"
                            });
                        }
                        
                        finalResult() {
                            // Mock implementation
                            return this.result();
                        }
                    }
                });
            }, 1000);
        });
    }

    async startRecording() {
        if (!this.isInitialized) {
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
            this.processor = this.audioContext.createScriptProcessor(
                CONFIG.audio.chunk_size, 
                1, 
                1
            );
            
            this.processor.onaudioprocess = (e) => this.processAudio(e);
            
            // Connect nodes
            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);
            
            this.isRecording = true;
            this.silenceStart = null;
            
            // Start recording timeout
            if (CONFIG.audio.max_recording_duration) {
                this.recordingTimeout = setTimeout(() => {
                    this.debugConsole.log('Maximum recording duration reached', 'warn');
                    this.stopRecording();
                }, CONFIG.audio.max_recording_duration);
            }
            
        } catch (error) {
            this.debugConsole.log(`Failed to start recording: ${error.message}`, 'error');
            throw error;
        }
    }

    processAudio(event) {
        if (!this.isRecording || !this.voskReady) return;
        
        const inputData = event.inputBuffer.getChannelData(0);
        
        // Calculate audio level
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
            sum += Math.abs(inputData[i]);
        }
        this.audioLevel = Math.min(100, (sum / inputData.length) * 500);
        
        // Emit audio level event
        this.dispatchEvent(new CustomEvent('audioLevel', { detail: this.audioLevel }));
        
        // Check for silence (for auto-stop)
        const isSilent = this.audioLevel < CONFIG.audio.silence_threshold * 100;
        
        if (localStorage.getItem('autoStopRecording') === 'true') {
            if (isSilent) {
                if (!this.silenceStart) {
                    this.silenceStart = Date.now();
                } else if (Date.now() - this.silenceStart > CONFIG.audio.silence_duration) {
                    this.debugConsole.log('Auto-stopping due to silence', 'verbose');
                    this.stopRecording();
                    return;
                }
            } else {
                this.silenceStart = null;
            }
        }
        
        // Convert to 16-bit PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        
        // Process with VOSK
        if (this.recognizer) {
            const isEndOfSpeech = this.recognizer.acceptWaveform(pcmData);
            
            if (isEndOfSpeech) {
                const result = JSON.parse(this.recognizer.result());
                if (result.text) {
                    this.debugConsole.log(`Recognition result: "${result.text}"`, 'verbose');
                    this.dispatchEvent(new CustomEvent('result', { detail: result.text }));
                }
            } else {
                // Get partial result
                const partial = JSON.parse(this.recognizer.partialResult());
                if (partial.partial) {
                    this.dispatchEvent(new CustomEvent('partial', { detail: partial.partial }));
                }
            }
        }
    }

    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        // Clear recording timeout
        if (this.recordingTimeout) {
            clearTimeout(this.recordingTimeout);
            this.recordingTimeout = null;
        }
        
        // Get final result
        if (this.recognizer) {
            const finalResult = JSON.parse(this.recognizer.finalResult());
            if (finalResult.text) {
                this.dispatchEvent(new CustomEvent('result', { detail: finalResult.text }));
            }
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
        this.isInitialized = false;
        this.voskReady = false;
    }
}