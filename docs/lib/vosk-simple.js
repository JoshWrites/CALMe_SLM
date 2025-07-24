/*
 * Simplified VOSK implementation for demonstration
 * Uses Web Speech API with VOSK-like interface
 */

window.Vosk = {
    async createModel(modelUrl) {
        console.log('Loading simplified VOSK model from:', modelUrl);
        
        return {
            ready: true,
            KaldiRecognizer: class {
                constructor(sampleRate) {
                    this.sampleRate = sampleRate;
                    this.eventTarget = new EventTarget();
                    
                    // Use Web Speech API if available
                    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                        this.initWebSpeechAPI();
                    }
                }
                
                initWebSpeechAPI() {
                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                    this.recognition = new SpeechRecognition();
                    
                    this.recognition.continuous = false;
                    this.recognition.interimResults = true;
                    this.recognition.lang = 'en-US';
                    
                    this.recognition.onresult = (event) => {
                        for (let i = event.resultIndex; i < event.results.length; i++) {
                            const transcript = event.results[i][0].transcript;
                            if (event.results[i].isFinal) {
                                this.eventTarget.dispatchEvent(new CustomEvent('result', {
                                    detail: { text: transcript.trim() }
                                }));
                            } else {
                                this.eventTarget.dispatchEvent(new CustomEvent('partialresult', {
                                    detail: { partial: transcript.trim() }
                                }));
                            }
                        }
                    };
                    
                    this.recognition.onerror = (event) => {
                        console.error('Speech recognition error:', event.error);
                    };
                }
                
                on(event, callback) {
                    this.eventTarget.addEventListener(event, (e) => callback(e.detail));
                }
                
                acceptWaveform(audioBuffer) {
                    // For demo, we'll use the Web Speech API instead
                    // This would normally process the audio buffer
                    if (this.recognition && !this.isListening) {
                        this.startListening();
                    }
                }
                
                startListening() {
                    if (this.recognition && !this.isListening) {
                        this.isListening = true;
                        try {
                            this.recognition.start();
                        } catch (error) {
                            console.log('Recognition already started or error:', error);
                            this.isListening = false;
                        }
                        
                        // Auto-stop after 5 seconds to simulate end of speech
                        setTimeout(() => {
                            this.stopListening();
                        }, 5000);
                    }
                }
                
                stopListening() {
                    if (this.recognition && this.isListening) {
                        this.isListening = false;
                        try {
                            this.recognition.stop();
                        } catch (error) {
                            console.log('Recognition stop error:', error);
                        }
                    }
                }
            }
        };
    }
};