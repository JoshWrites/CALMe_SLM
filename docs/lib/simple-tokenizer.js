// Simple tokenizer that mimics SmolLM2 behavior for testing
// This is a fallback solution when Transformers.js fails to load

window.SimpleTokenizer = class {
    constructor() {
        // Basic vocabulary mapping for common words
        // In reality, SmolLM2 has ~50K tokens, but we'll use a simple approach
        this.vocab = new Map();
        this.reverseVocab = new Map();
        
        // Special tokens
        this.addToken('<pad>', 0);
        this.addToken('<unk>', 1);
        this.addToken('<s>', 2);
        this.addToken('</s>', 3);
        
        // Build a basic vocabulary from common words
        this.nextId = 4;
        
        console.log('✅ Simple tokenizer initialized (temporary solution)');
    }
    
    addToken(token, id) {
        this.vocab.set(token, id);
        this.reverseVocab.set(id, token);
    }
    
    encodeIds(text) {
        // Simple whitespace tokenization
        const words = text.toLowerCase().replace(/[.,!?;:]/g, '').split(/\s+/);
        const ids = [];
        
        for (const word of words) {
            if (this.vocab.has(word)) {
                ids.push(this.vocab.get(word));
            } else {
                // Assign new ID to unknown words
                const newId = this.nextId++;
                this.addToken(word, newId);
                ids.push(newId);
            }
        }
        
        return ids;
    }
    
    decodeIds(ids) {
        const words = [];
        for (const id of ids) {
            if (this.reverseVocab.has(id)) {
                const word = this.reverseVocab.get(id);
                if (!word.startsWith('<') || !word.endsWith('>')) {
                    words.push(word);
                }
            }
        }
        return words.join(' ');
    }
};

// Auto-initialize
window.TransformersTokenizer = window.SimpleTokenizer;
console.log('Simple tokenizer loaded as fallback for SmolLM2');