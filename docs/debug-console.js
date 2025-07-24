/*
 * AI Therapy Assistant Demo
 * Copyright (c) 2025 CALMe Team
 * 
 * Educational and non-commercial use only.
 * See LICENSE file for full terms.
 */

class DebugConsole {
    constructor() {
        this.logs = [];
        this.isVisible = CONFIG.debug.enabled && CONFIG.debug.showPanel;
        this.performanceMetrics = {
            startTime: Date.now(),
            modelLoadTime: null,
            averageResponseTime: [],
            memorySnapshots: []
        };
        
        this.setupConsole();
        this.setupLoadingDebug();
        this.startPerformanceMonitoring();
    }

    setupConsole() {
        const consoleElement = document.getElementById('debug-console');
        const outputElement = document.getElementById('debug-output');
        const clearButton = document.getElementById('clear-debug');
        const exportButton = document.getElementById('export-debug');
        const closeButton = document.getElementById('close-debug');

        // Don't show main debug console during loading - only show it after app loads
        const loadingOverlay = document.getElementById('loading-overlay');
        if (this.isVisible && loadingOverlay && loadingOverlay.classList.contains('hidden')) {
            consoleElement.classList.remove('hidden');
        }

        clearButton.addEventListener('click', () => this.clear());
        exportButton.addEventListener('click', () => this.export());
        closeButton.addEventListener('click', () => this.hide());

        // Make console resizable
        this.makeResizable(consoleElement);

        // Override console methods if enabled
        if (CONFIG.debug.logToConsole) {
            this.overrideConsoleMethods();
        }
    }

    setupLoadingDebug() {
        // Show loading debug area if debug mode is enabled
        if (this.isVisible) {
            const loadingDebug = document.getElementById('loading-debug');
            if (loadingDebug) {
                loadingDebug.classList.remove('hidden');
            }
        }
    }

    makeResizable(element) {
        let isResizing = false;
        let startX, startY, startWidth, startHeight;

        element.addEventListener('mousedown', (e) => {
            if (e.offsetX < 10 || e.offsetY < 10) {
                isResizing = true;
                startX = e.clientX;
                startY = e.clientY;
                startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
                startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
                e.preventDefault();
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            element.style.width = (startWidth - e.clientX + startX) + 'px';
            element.style.height = (startHeight - e.clientY + startY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });
    }

    overrideConsoleMethods() {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = (...args) => {
            originalLog.apply(console, args);
            this.log(args.join(' '), 'info');
        };

        console.error = (...args) => {
            originalError.apply(console, args);
            this.log(args.join(' '), 'error');
        };

        console.warn = (...args) => {
            originalWarn.apply(console, args);
            this.log(args.join(' '), 'warn');
        };
    }

    log(message, level = 'info') {
        const timestamp = new Date();
        const logEntry = {
            timestamp: timestamp.toISOString(),
            time: timestamp.toLocaleTimeString(),
            level,
            message
        };

        this.logs.push(logEntry);

        // Limit log entries
        if (this.logs.length > CONFIG.debug.maxLogEntries) {
            this.logs.shift();
        }

        // Update UI
        this.updateOutput(logEntry);

        // Log to console if not already done
        if (!CONFIG.debug.logToConsole) {
            console.log(`[${level.toUpperCase()}] ${message}`);
        }
    }

    updateOutput(logEntry) {
        // Helper function to create log entry element
        const createLogElement = () => {
            const logDiv = document.createElement('div');
            logDiv.className = `debug-log ${logEntry.level}`;
            
            const timeSpan = document.createElement('span');
            timeSpan.style.opacity = '0.7';
            timeSpan.textContent = `[${logEntry.time}] `;
            
            const levelSpan = document.createElement('span');
            levelSpan.style.fontWeight = 'bold';
            levelSpan.textContent = `${logEntry.level.toUpperCase()}: `;
            
            const messageSpan = document.createElement('span');
            messageSpan.textContent = logEntry.message;
            
            logDiv.appendChild(timeSpan);
            if (logEntry.level !== 'verbose') {
                logDiv.appendChild(levelSpan);
            }
            logDiv.appendChild(messageSpan);
            
            return logDiv;
        };

        // Update main debug console
        const outputElement = document.getElementById('debug-output');
        if (outputElement) {
            const logDiv = createLogElement();
            outputElement.appendChild(logDiv);
            outputElement.scrollTop = outputElement.scrollHeight;
        }

        // Update loading debug if visible and debug mode is enabled
        const loadingDebugOutput = document.getElementById('loading-debug-output');
        const loadingDebug = document.getElementById('loading-debug');
        if (loadingDebugOutput && loadingDebug && !loadingDebug.classList.contains('hidden') && this.isVisible) {
            const loadingLogDiv = createLogElement();
            loadingDebugOutput.appendChild(loadingLogDiv);
            loadingDebugOutput.scrollTop = loadingDebugOutput.scrollHeight;
        }
    }

    startPerformanceMonitoring() {
        if (!CONFIG.debug.showPerformanceMetrics) return;

        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 5000);
    }

    updatePerformanceMetrics() {
        const metrics = {
            uptime: Math.floor((Date.now() - this.performanceMetrics.startTime) / 1000),
            memory: this.getMemoryUsage(),
            fps: this.calculateFPS()
        };

        const metricsElement = document.getElementById('performance-metrics');
        metricsElement.innerHTML = `
            Uptime: ${this.formatUptime(metrics.uptime)} | 
            Memory: ${metrics.memory} | 
            FPS: ${metrics.fps}
        `;

        // Track memory snapshots
        if (performance.memory) {
            this.performanceMetrics.memorySnapshots.push({
                time: Date.now(),
                used: performance.memory.usedJSHeapSize
            });

            // Keep only last 100 snapshots
            if (this.performanceMetrics.memorySnapshots.length > 100) {
                this.performanceMetrics.memorySnapshots.shift();
            }
        }
    }

    getMemoryUsage() {
        if (performance.memory) {
            const used = performance.memory.usedJSHeapSize / 1024 / 1024;
            const total = performance.memory.totalJSHeapSize / 1024 / 1024;
            return `${used.toFixed(1)}/${total.toFixed(1)}MB`;
        }
        return 'N/A';
    }

    calculateFPS() {
        // Simple FPS calculation
        let fps = 0;
        let lastTime = performance.now();
        
        const measureFPS = () => {
            const currentTime = performance.now();
            fps = Math.round(1000 / (currentTime - lastTime));
            lastTime = currentTime;
        };
        
        requestAnimationFrame(measureFPS);
        return fps;
    }

    formatUptime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }

    toggle() {
        const consoleElement = document.getElementById('debug-console');
        this.isVisible = !this.isVisible;
        
        if (this.isVisible) {
            consoleElement.classList.remove('hidden');
            this.log('Debug console opened', 'info');
        } else {
            consoleElement.classList.add('hidden');
        }
    }

    show() {
        const consoleElement = document.getElementById('debug-console');
        consoleElement.classList.remove('hidden');
        this.isVisible = true;
    }

    hide() {
        const consoleElement = document.getElementById('debug-console');
        consoleElement.classList.add('hidden');
        this.isVisible = false;
    }

    clear() {
        this.logs = [];
        document.getElementById('debug-output').innerHTML = '';
        this.log('Debug console cleared', 'info');
    }

    export() {
        const exportData = {
            timestamp: new Date().toISOString(),
            logs: this.logs,
            performance: this.performanceMetrics,
            config: CONFIG,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            memory: performance.memory ? {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            } : null
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `therapy-demo-debug-${Date.now()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        
        this.log('Debug logs exported', 'info');
    }

    trackResponseTime(duration) {
        this.performanceMetrics.averageResponseTime.push(duration);
        
        // Keep only last 50 response times
        if (this.performanceMetrics.averageResponseTime.length > 50) {
            this.performanceMetrics.averageResponseTime.shift();
        }
        
        const average = this.performanceMetrics.averageResponseTime.reduce((a, b) => a + b, 0) / 
                       this.performanceMetrics.averageResponseTime.length;
        
        if (average > 2000) {
            this.log(`High average response time: ${average.toFixed(0)}ms`, 'warn');
        }
    }

    setModelLoadTime(duration) {
        this.performanceMetrics.modelLoadTime = duration;
        this.log(`Model loaded in ${duration}ms`, 'info');
    }
}