/*
 * AI Therapy Assistant Demo
 * Copyright (c) 2025 CALMe Team
 * 
 * Educational and non-commercial use only.
 * See LICENSE file for full terms.
 */

class TherapyAssistant {
    constructor() {
        this.messages = [];
        this.isRecording = false;
        this.isProcessing = false;
        this.currentEmotion = 'listening';
        this.audioProcessor = null;
        this.modelLoader = null;
        this.debugConsole = null;
        
        this.initializeApp();
    }

    async initializeApp() {
        try {
            this.debugConsole = new DebugConsole();
            this.debugConsole.log('Starting AI Therapy Assistant Demo (Text-Only)', 'info');
            
            this.setupEventListeners();
            this.showLoadingOverlay(true);
            
            this.debugConsole.log('Initializing model loader', 'verbose');
            this.modelLoader = new ModelLoader(this.debugConsole);
            
            // Skip audio processor initialization for text-only demo
            // this.debugConsole.log('Initializing audio processor', 'verbose');
            // this.audioProcessor = new AudioProcessor(this.debugConsole);
            this.debugConsole.log('Audio processor disabled for text-only demo', 'info');
            
            await this.loadModels();
            
            // Skip audio event listeners for text-only demo
            // this.setupAudioEventListeners();
            
            this.showLoadingOverlay(false);
            this.debugConsole.log('Application initialized successfully', 'info');
            
            if (CONFIG.debug.runStartupTests) {
                this.runStartupTests();
            }
        } catch (error) {
            this.debugConsole.log(`Initialization error: ${error.message}`, 'error');
            this.debugConsole.log(`Error stack: ${error.stack}`, 'verbose');
            this.showError(`Failed to initialize the application: ${error.message}. Please check the debug console for details.`);
        }
    }

    setupEventListeners() {
        const voiceButton = document.getElementById('voice-button');
        const sendButton = document.getElementById('send-button');
        const messageInput = document.getElementById('message-input');
        const clearChat = document.getElementById('clear-chat');
        const copyChat = document.getElementById('copy-chat');
        const settingsButton = document.getElementById('settings-button');
        const closeSettings = document.getElementById('close-settings');
        const debugToggle = document.getElementById('debug-toggle');

        voiceButton.addEventListener('click', () => this.toggleRecording());
        sendButton.addEventListener('click', () => this.sendMessage());
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        clearChat.addEventListener('click', () => this.clearConversation());
        copyChat.addEventListener('click', () => this.copyConversation());
        settingsButton.addEventListener('click', () => this.showSettings());
        closeSettings.addEventListener('click', () => this.hideSettings());
        debugToggle.addEventListener('click', () => this.debugConsole.toggle());
        
        document.getElementById('auto-stop-recording').checked = 
            localStorage.getItem('autoStopRecording') === 'true';
        document.getElementById('show-timestamps').checked = 
            localStorage.getItem('showTimestamps') === 'true';
            
        document.getElementById('auto-stop-recording').addEventListener('change', (e) => {
            localStorage.setItem('autoStopRecording', e.target.checked);
        });
        
        document.getElementById('show-timestamps').addEventListener('change', (e) => {
            localStorage.setItem('showTimestamps', e.target.checked);
            this.updateMessageDisplay();
        });
    }

    async loadModels() {
        try {
            // Skip VOSK initialization for text-only demo
            this.updateProgress('Skipping VOSK (text-only demo)...', 10);
            this.debugConsole.log('VOSK disabled for text-only demo', 'info');
            
            this.updateProgress('Loading mT5 language model...', 20);
            await this.modelLoader.loadMT5Model((progress) => {
                const totalProgress = 20 + (progress * 0.7);
                this.updateProgress(`Loading mT5 model... ${Math.round(progress)}%`, totalProgress);
            });
            
            this.updateProgress('Finalizing setup...', 95);
            this.updateProgress('Ready!', 100);
        } catch (error) {
            this.debugConsole.log(`Model loading error: ${error.message}`, 'error');
            throw error;
        }
    }

    setupAudioEventListeners() {
        this.debugConsole.log('Setting up audio event listeners', 'verbose');
        
        this.audioProcessor.addEventListener('result', (event) => {
            const text = event.detail;
            this.debugConsole.log(`Speech recognition result: "${text}"`, 'verbose');
            document.getElementById('message-input').value = text;
            
            // Auto-send the message after voice input
            setTimeout(() => {
                this.sendMessage();
            }, 500);
        });
        
        this.audioProcessor.addEventListener('audioLevel', (event) => {
            const level = event.detail;
            this.updateAudioLevel(level);
        });
        
        this.debugConsole.log('Audio event listeners set up successfully', 'verbose');
    }

    async toggleRecording() {
        // Voice input disabled for text-only demo
        this.debugConsole.log('Voice input disabled - text-only demo', 'info');
        this.showNotification('Voice input disabled for text-only demo');
    }

    async sendMessage() {
        const messageInput = document.getElementById('message-input');
        const message = messageInput.value.trim();
        
        if (!message || this.isProcessing) return;
        
        this.debugConsole.log(`Sending message: "${message}"`, 'info');
        this.isProcessing = true;
        this.updateSendButton(false);
        
        this.addMessage(message, 'user');
        messageInput.value = '';
        
        this.updateEmotionalState(message);
        
        try {
            const startTime = Date.now();
            const response = await this.modelLoader.generateResponse(message);
            const processingTime = Date.now() - startTime;
            
            this.debugConsole.log(`Response generated in ${processingTime}ms`, 'verbose');
            this.addMessage(response, 'ai');
            
            this.updateEmotionalState(response);
        } catch (error) {
            this.debugConsole.log(`Response generation error: ${error.message}`, 'error');
            this.addMessage("I'm having trouble processing that right now. Could you try rephrasing?", 'ai');
        } finally {
            this.isProcessing = false;
            this.updateSendButton(true);
        }
    }

    addMessage(text, sender) {
        const timestamp = new Date();
        this.messages.push({ text, sender, timestamp });
        
        const chatMessages = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.textContent = text;
        
        messageDiv.appendChild(bubbleDiv);
        
        if (localStorage.getItem('showTimestamps') === 'true') {
            const timestampDiv = document.createElement('div');
            timestampDiv.className = 'message-timestamp';
            timestampDiv.textContent = timestamp.toLocaleTimeString();
            messageDiv.appendChild(timestampDiv);
        }
        
        if (chatMessages.querySelector('.welcome-message')) {
            chatMessages.querySelector('.welcome-message').remove();
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    updateEmotionalState(text) {
        const previousEmotion = this.currentEmotion;
        const detectedEmotion = this.detectEmotion(text);
        
        if (detectedEmotion !== previousEmotion) {
            this.currentEmotion = detectedEmotion;
            this.updateEmotionDisplay();
            this.debugConsole.log(
                `Emotion changed from '${previousEmotion}' to '${detectedEmotion}'`, 
                'verbose'
            );
        }
    }

    detectEmotion(text) {
        const lowerText = text.toLowerCase();
        
        const EMOTION_KEYWORDS = {
            happy: ["good", "great", "better", "positive", "helpful", "progress", "wonderful", "excellent", "amazing", "fantastic", "happy"],
            sad: ["sad", "depressed", "down", "worse", "hopeless", "crying", "terrible", "awful", "lonely", "empty", "worthless"],
            mad: ["angry", "frustrated", "annoyed", "mad", "hate", "unfair", "stupid", "ridiculous", "furious", "pissed"],
            listening: []
        };
        
        for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
            if (emotion === 'listening') continue;
            
            for (const keyword of keywords) {
                if (lowerText.includes(keyword)) {
                    this.debugConsole.log(
                        `Emotion detected: '${emotion}' - keyword: '${keyword}'`, 
                        'verbose'
                    );
                    return emotion;
                }
            }
        }
        
        return 'listening';
    }

    updateEmotionDisplay() {
        const emotionImage = document.getElementById('emotion-image');
        emotionImage.src = `images/${this.currentEmotion}.svg`;
        emotionImage.alt = `${this.currentEmotion} emotional state`;
    }

    updateAudioLevel(level) {
        const audioLevelBar = document.querySelector('.audio-level-bar');
        audioLevelBar.style.width = `${level}%`;
    }

    updateSendButton(enabled) {
        const sendButton = document.getElementById('send-button');
        sendButton.disabled = !enabled;
    }

    clearConversation() {
        if (confirm('Are you sure you want to clear the conversation?')) {
            this.messages = [];
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = `
                <div class="welcome-message">
                    <p>Welcome! I'm here to listen and support you. How are you feeling today?</p>
                </div>
            `;
            this.currentEmotion = 'listening';
            this.updateEmotionDisplay();
            this.debugConsole.log('Conversation cleared', 'info');
        }
    }

    copyConversation() {
        const conversationText = this.messages
            .map(msg => `${msg.sender.toUpperCase()}: ${msg.text}`)
            .join('\n\n');
            
        navigator.clipboard.writeText(conversationText)
            .then(() => {
                this.showNotification('Conversation copied to clipboard!');
                this.debugConsole.log('Conversation copied to clipboard', 'info');
            })
            .catch(err => {
                this.debugConsole.log(`Copy failed: ${err.message}`, 'error');
                this.showError('Failed to copy conversation');
            });
    }

    showSettings() {
        document.getElementById('settings-modal').classList.remove('hidden');
    }

    hideSettings() {
        document.getElementById('settings-modal').classList.add('hidden');
    }

    showLoadingOverlay(show) {
        const overlay = document.getElementById('loading-overlay');
        if (show) {
            overlay.classList.remove('hidden');
        } else {
            overlay.classList.add('hidden');
            
            // Show main debug console after loading is complete and hide loading debug
            if (this.debugConsole && this.debugConsole.isVisible) {
                const mainDebugConsole = document.getElementById('debug-console');
                const loadingDebug = document.getElementById('loading-debug');
                
                if (mainDebugConsole) {
                    mainDebugConsole.classList.remove('hidden');
                }
                
                if (loadingDebug) {
                    loadingDebug.classList.add('hidden');
                }
            }
        }
    }

    updateProgress(label, percentage) {
        document.querySelector('.progress-label').textContent = label;
        document.getElementById('progress-fill').style.width = `${percentage}%`;
        document.getElementById('progress-text').textContent = `${Math.round(percentage)}%`;
    }

    showError(message) {
        alert(message);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--success-color);
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1001;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateMessageDisplay() {
        const showTimestamps = localStorage.getItem('showTimestamps') === 'true';
        const timestamps = document.querySelectorAll('.message-timestamp');
        timestamps.forEach(ts => {
            ts.style.display = showTimestamps ? 'block' : 'none';
        });
    }

    runStartupTests() {
        this.debugConsole.log('Running startup tests...', 'info');
        
        const testPhrases = {
            happy: ["I feel great today", "This is really helping me", "I'm making real progress"],
            sad: ["I feel so down", "Nothing seems to work anymore", "I'm really struggling"],
            mad: ["This is so frustrating", "I'm angry about this situation", "This just isn't fair"],
            neutral: ["Can you help me understand", "I want to talk about something", "Tell me more about that"]
        };
        
        let passedTests = 0;
        let totalTests = 0;
        
        for (const [expectedEmotion, phrases] of Object.entries(testPhrases)) {
            for (const phrase of phrases) {
                totalTests++;
                const detectedEmotion = this.detectEmotion(phrase);
                const expected = expectedEmotion === 'neutral' ? 'listening' : expectedEmotion;
                
                if (detectedEmotion === expected) {
                    passedTests++;
                    this.debugConsole.log(`✓ Test passed: "${phrase}" → ${detectedEmotion}`, 'verbose');
                } else {
                    this.debugConsole.log(
                        `✗ Test failed: "${phrase}" expected ${expected}, got ${detectedEmotion}`, 
                        'warn'
                    );
                }
            }
        }
        
        this.debugConsole.log(
            `Startup tests completed: ${passedTests}/${totalTests} passed`, 
            passedTests === totalTests ? 'info' : 'warn'
        );
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.therapyAssistant = new TherapyAssistant();
});