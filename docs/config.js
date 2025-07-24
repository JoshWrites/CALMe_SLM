/*
 * AI Therapy Assistant Demo
 * Copyright (c) 2025 CALMe Team
 * 
 * Educational and non-commercial use only.
 * See LICENSE file for full terms.
 */

const CONFIG = {
    version: "Quant v0.0.2",
    models: {
        mt5: {
            source: "huggingface", // or "local"
            path: "google/mt5-small",
            // Use INT8 quantized models for maximum memory efficiency
            encoder_url: "https://huggingface.co/Xenova/mt5-small/resolve/main/onnx/encoder_model_quantized.onnx",
            decoder_url: "https://huggingface.co/Xenova/mt5-small/resolve/main/onnx/decoder_model_quantized.onnx",
            huggingface_url: "https://huggingface.co/google/mt5-small/resolve/main/onnx/encoder_model.onnx", // backward compatibility
            local_path: "./models/mt5-trained.onnx",
            cache_key: "mt5-quantized-encoder-v1",
            decoder_cache_key: "mt5-quantized-decoder-v1",
            fallback_urls: [], // No fallbacks - quantized models must work
            // Updated size expectations for quantized models
            expected_size: 150 * 1024 * 1024, // ~150MB for quantized encoder
            decoder_expected_size: 280 * 1024 * 1024, // ~280MB for quantized decoder
            system_prompt: `You are an offline AI assistant designed for crisis support during active conflict situations when professional help is unavailable. Your purpose is to help civilians sheltering from bombardment, air raids, or military action to maintain psychological stability, think clearly, and manage acute stress using the Ma'aseh Model within shelter periods of 10-30 minutes.

Follow the Ma'aseh 4-step sequence:
1. COMMITMENT - "I'm here with you." Show consistent support and reliable presence
2. ACTIVATION - Give achievable tasks and simple choices to restore autonomy  
3. THINKING QUESTIONS - Use factual, concrete questions to engage prefrontal cortex (AVOID "How do you feel?")
4. CHRONOLOGICAL FRAMING - Organize timeline and emphasize this situation will end

CRITICAL: Never ask "How do you feel?" - focus on factual, thinking-oriented questions. Keep responses concrete and action-oriented. Build capability through small tasks. Provide psychological stabilization within this session.`
        },
        vosk: {
            model_url: "https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip",
            cache_key: "vosk-model-small-en-us-0.15",
            sample_rate: 16000,
            alternatives: 3,
            expected_size: 40 * 1024 * 1024 // ~40MB
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
    huggingface: {
        token: new URLSearchParams(window.location.search).get('hf_token') || null
    },
    performance: {
        enable_web_workers: true,
        memory_warning_threshold: 200 * 1024 * 1024, // 200MB threshold (lower for quantized)
        model_loading_timeout: 120000, // 2 minutes (faster loading)
        response_generation_timeout: 15000, // 15 seconds (faster inference)
        enable_quantized_inference: true
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