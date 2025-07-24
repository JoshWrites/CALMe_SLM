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
            // Check for Web Speech API support
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                this.debugConsole.log('Initializing Web Speech API', 'verbose');
                this.initializeWebSpeechAPI();
                this.isInitialized = true;
                this.debugConsole.log('Web Speech API initialized successfully', 'info');
            } else {
                this.debugConsole.log('Web Speech API not available, falling back to mock', 'warn');
                await this.initializeMockRecognition();
            }
        } catch (error) {
            this.debugConsole.log(`Speech recognition initialization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    initializeWebSpeechAPI() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognizer = new SpeechRecognition();
        
        // Configure recognition
        this.recognizer.continuous = false;
        this.recognizer.interimResults = true;
        this.recognizer.lang = 'en-US';
        this.recognizer.maxAlternatives = 1;
        
        // Set up event handlers
        this.recognizer.onstart = () => {
            this.debugConsole.log('Speech recognition started', 'verbose');
            this.isRecording = true;
        };
        
        this.recognizer.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }
            
            if (finalTranscript) {
                this.debugConsole.log(`Final transcript: "${finalTranscript}"`, 'verbose');
                this.dispatchEvent(new CustomEvent('result', { detail: finalTranscript.trim() }));
            } else if (interimTranscript) {
                this.debugConsole.log(`Interim transcript: "${interimTranscript}"`, 'verbose');
                this.dispatchEvent(new CustomEvent('partial', { detail: interimTranscript.trim() }));
            }
        };
        
        this.recognizer.onerror = (event) => {
            this.debugConsole.log(`Speech recognition error: ${event.error}`, 'error');
            this.isRecording = false;
        };
        
        this.recognizer.onend = () => {
            this.debugConsole.log('Speech recognition ended', 'verbose');
            this.isRecording = false;
        };
        
        this.voskReady = true;
    }

    async initializeMockRecognition() {
        this.debugConsole.log('Initializing mock speech recognition', 'verbose');
        const model = await this.loadVoskModel();
        this.recognizer = new model.KaldiRecognizer(CONFIG.models.vosk.sample_rate, CONFIG.models.vosk.alternatives);
        this.recognizer.setWords(true);
        this.voskReady = true;
        this.isInitialized = true;
        this.debugConsole.log('Mock speech recognition initialized', 'info');
    }

    async loadVoskModel() {
        // In a real implementation, this would load the actual VOSK model
        // For now, we'll use the mock implementation from vosk.js
        this.debugConsole.log('Loading VOSK model from: ' + CONFIG.models.vosk.model_path, 'verbose');
        
        // Use the createModule from lib/vosk.js which has better mock responses
        if (typeof createModule === 'function') {
            this.debugConsole.log('Using VOSK createModule from library', 'verbose');
            return await createModule();
        } else {
            this.debugConsole.log('createModule not available, using basic mock', 'warn');
            // Fallback basic mock
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
                                const mockResults = [
                                    "I'm feeling good today",
                                    "This is really helpful", 
                                    "I need some support",
                                    "Can you help me with this",
                                    "I'm struggling with anxiety",
                                    "Thank you for listening"
                                ];
                                return JSON.stringify({
                                    text: mockResults[Math.floor(Math.random() * mockResults.length)]
                                });
                            }
                            
                            partialResult() {
                                return JSON.stringify({
                                    partial: "I'm feeling"
                                });
                            }
                            
                            finalResult() {
                                return this.result();
                            }
                        }
                    });
                }, 1000);
            });
        }
    }

    async startRecording() {
        if (!this.isInitialized) {
            throw new Error('Audio processor not initialized');
        }

        try {
            if (this.recognizer && typeof this.recognizer.start === 'function') {
                // Using Web Speech API
                this.debugConsole.log('Starting Web Speech API recognition', 'verbose');
                this.recognizer.start();
            } else {
                // Using mock VOSK implementation
                this.debugConsole.log('Starting mock speech recognition', 'verbose');
                this.isRecording = true;
                
                // Simulate audio level for visual feedback
                this.simulateAudioLevel();
                
                // Simulate recognition after a delay
                setTimeout(() => {
                    if (this.isRecording) {
                        const result = JSON.parse(this.recognizer.result());
                        if (result.text) {
                            this.dispatchEvent(new CustomEvent('result', { detail: result.text }));
                        }
                        this.stopRecording();
                    }
                }, 2000 + Math.random() * 3000); // 2-5 seconds
            }
            
        } catch (error) {
            this.debugConsole.log(`Failed to start recording: ${error.message}`, 'error');
            throw error;
        }
    }

    simulateAudioLevel() {
        if (!this.isRecording) return;
        
        // Simulate varying audio levels
        const level = Math.random() * 80 + 10; // 10-90%
        this.dispatchEvent(new CustomEvent('audioLevel', { detail: level }));
        
        setTimeout(() => this.simulateAudioLevel(), 100);
    }


    stopRecording() {
        if (!this.isRecording) return;
        
        this.isRecording = false;
        
        try {
            if (this.recognizer && typeof this.recognizer.stop === 'function') {
                // Using Web Speech API
                this.debugConsole.log('Stopping Web Speech API recognition', 'verbose');
                this.recognizer.stop();
            } else {
                // Using mock implementation
                this.debugConsole.log('Stopping mock speech recognition', 'verbose');
            }
        } catch (error) {
            this.debugConsole.log(`Error stopping recognition: ${error.message}`, 'warn');
        }
        
        // Reset audio level
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