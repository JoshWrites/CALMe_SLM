/*
 * AI Therapy Assistant Demo - WebLLM Model Loader
 * Copyright (c) 2025 CALMe Team
 * 
 * Educational and non-commercial use only.
 * See LICENSE file for full terms.
 */

class ModelLoader {
    constructor(debugConsole) {
        this.debugConsole = debugConsole;
        this.engine = null;
        this.isLoaded = false;
        
        // Memory monitoring properties
        this.memoryStats = {
            lastCheck: 0,
            peakUsage: 0,
            warningThreshold: 0.8
        };
        
        this.setupMemoryMonitoring();
    }

    setupMemoryMonitoring() {
        if (performance.memory) {
            this.memoryMonitorInterval = setInterval(() => {
                const memInfo = performance.memory;
                const usedMemoryMB = memInfo.usedJSHeapSize / 1024 / 1024;
                
                if (usedMemoryMB > this.memoryStats.peakUsage) {
                    this.memoryStats.peakUsage = usedMemoryMB;
                }
                
                const timeSinceLastCheck = Date.now() - this.memoryStats.lastCheck;
                if (timeSinceLastCheck > 30000) {
                    this.debugConsole.log(`Memory monitoring: ${usedMemoryMB.toFixed(2)}MB used (peak: ${this.memoryStats.peakUsage.toFixed(2)}MB)`, 'verbose');
                    this.memoryStats.lastCheck = Date.now();
                }
            }, 5000);
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

    async loadSmolLM2Model(progressCallback) {
        try {
            this.debugConsole.log('Loading SmolLM2 using WebLLM...', 'info');

            // Memory check for WebLLM model
            const requiredMemoryMB = 1000; // ~900MB model + overhead
            if (!this.checkMemoryAvailability(requiredMemoryMB)) {
                throw new Error(`Insufficient memory for WebLLM model. Required: ${requiredMemoryMB}MB`);
            }

            // Wait for WebLLM to load
            let waitCount = 0;
            while (typeof window.webllm === 'undefined' && waitCount < 30) {
                this.debugConsole.log(`Waiting for WebLLM library... (${waitCount + 1}/30)`, 'verbose');
                await new Promise(resolve => setTimeout(resolve, 1000));
                waitCount++;
            }

            if (typeof window.webllm === 'undefined') {
                throw new Error('WebLLM library not loaded after 30 seconds');
            }

            this.debugConsole.log('WebLLM library loaded, creating engine...', 'info');

            // Create WebLLM engine with progress callback
            this.engine = await window.webllm.CreateMLCEngine(
                CONFIG.models.smollm2.model_id,
                {
                    initProgressCallback: (info) => {
                        const progress = Math.round(info.progress * 100);
                        progressCallback(progress);
                        this.debugConsole.log(`WebLLM loading: ${progress}% - ${info.text || ''}`, 'info');
                    }
                }
            );

            this.isLoaded = true;
            this.debugConsole.log('✅ SmolLM2 WebLLM engine ready!', 'info');

        } catch (error) {
            this.debugConsole.log(`WebLLM model loading failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async generateResponse(inputText) {
        if (!this.isLoaded || !this.engine) {
            throw new Error('WebLLM engine not loaded - cannot generate response');
        }

        try {
            this.debugConsole.log(`Generating response for: "${inputText}"`, 'verbose');
            const startTime = performance.now();

            // Create messages with system prompt
            const messages = [
                {
                    role: "system",
                    content: CONFIG.models.smollm2.system_prompt
                },
                {
                    role: "user", 
                    content: inputText
                }
            ];

            // Generate response using WebLLM
            const response = await this.engine.chat.completions.create({
                messages: messages,
                temperature: 0.7,
                max_tokens: 150,
                stream: false
            });

            const generatedText = response.choices[0].message.content;
            const endTime = performance.now();
            
            this.debugConsole.log(`Response generated in ${(endTime - startTime).toFixed(2)}ms`, 'verbose');
            this.debugConsole.log(`Generated: "${generatedText}"`, 'verbose');

            return generatedText;

        } catch (error) {
            this.debugConsole.log(`Response generation failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async clearCache() {
        // WebLLM handles its own caching
        this.debugConsole.log('WebLLM manages its own cache', 'info');
    }

    destroy() {
        // Clean up memory monitoring
        if (this.memoryMonitorInterval) {
            clearInterval(this.memoryMonitorInterval);
            this.memoryMonitorInterval = null;
        }
        
        this.engine = null;
        this.isLoaded = false;
        
        // Reset memory stats
        this.memoryStats = {
            lastCheck: 0,
            peakUsage: 0,
            warningThreshold: 0.8
        };
    }
}