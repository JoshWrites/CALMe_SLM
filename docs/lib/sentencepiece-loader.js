// SentencePiece loader for browser
// This loads the library using dynamic import since it's ES module based

window.SentencePieceProcessor = null;

async function loadSentencePiece() {
    try {
        console.log('Loading SentencePiece from CDN...');
        
        // Try to load from jsDelivr ESM
        const module = await import('https://cdn.jsdelivr.net/npm/@sctg/sentencepiece-js@1.3.3/+esm');
        
        if (module && module.SentencePieceProcessor) {
            window.SentencePieceProcessor = module.SentencePieceProcessor;
            console.log('✅ SentencePiece loaded successfully');
            return true;
        } else {
            throw new Error('SentencePieceProcessor not found in module');
        }
    } catch (error) {
        console.error('Failed to load SentencePiece:', error);
        
        // Fallback: create a mock processor that logs the issue
        window.SentencePieceProcessor = class MockSentencePieceProcessor {
            constructor() {
                console.warn('Using mock SentencePieceProcessor - actual tokenization unavailable');
            }
            
            async loadFromB64StringModel(model) {
                console.warn('Mock: loadFromB64StringModel called');
            }
            
            encodeIds(text) {
                console.warn('Mock: encodeIds called with:', text);
                // Return simple mock token IDs
                return text.split(/\s+/).map((_, i) => i + 4);
            }
            
            decodeIds(ids) {
                console.warn('Mock: decodeIds called with:', ids);
                return "Mock response - SentencePiece not loaded";
            }
        };
        
        return false;
    }
}

// Auto-load on script load
loadSentencePiece();