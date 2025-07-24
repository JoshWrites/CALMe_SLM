/*
 * AI Therapy Assistant Demo
 * Copyright (c) 2025 CALMe Team
 * 
 * Educational and non-commercial use only.
 * See LICENSE file for full terms.
 */

const CONFIG = {
    models: {
        mt5: {
            source: "huggingface", // or "local"
            path: "google/mt5-small",
            huggingface_url: "https://huggingface.co/google/mt5-small/resolve/main/onnx/model.onnx",
            local_path: "./models/mt5-trained.onnx",
            cache_key: "mt5-model-v1",
            fallback_urls: [
                "https://huggingface.co/google/mt5-small/resolve/main/onnx/model_quantized.onnx"
            ],
            expected_size: 600 * 1024 * 1024 // ~600MB
        },
        vosk: {
            model_path: "./models/vosk-model-small-en-us-0.15/",
            sample_rate: 16000,
            alternatives: 3
        }
    },
    audio: {
        chunk_size: 4096,
        buffer_size: 16384,
        silence_threshold: 0.01,
        silence_duration: 1500, // ms
        max_recording_duration: 60000, // 60 seconds
        audio_context_options: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
        }
    },
    ui: {
        max_message_length: 1000,
        typing_indicator_delay: 500,
        notification_duration: 3000,
        animation_duration: 300
    },
    debug: {
        enabled: window.location.search.includes('debug=true') || false,
        level: 'info', // 'error', 'warn', 'info', 'verbose'
        showPanel: true,
        logToConsole: true,
        runStartupTests: true,
        showPerformanceMetrics: true,
        enableTestPhrases: true,
        maxLogEntries: 1000
    },
    performance: {
        enable_web_workers: true,
        model_loading_timeout: 300000, // 5 minutes
        response_generation_timeout: 30000, // 30 seconds
        memory_warning_threshold: 500 * 1024 * 1024, // 500MB
        enable_model_quantization: true
    },
    privacy: {
        disable_telemetry: true,
        clear_cache_on_exit: false,
        secure_storage_only: true
    }
};

// Allow local config overrides
if (typeof CONFIG_LOCAL !== 'undefined') {
    Object.assign(CONFIG, CONFIG_LOCAL);
}