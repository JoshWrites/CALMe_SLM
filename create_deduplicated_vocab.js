// Script to create a properly structured deduplicated vocabulary
const fs = require('fs');

// Read the model-loader.js file
const content = fs.readFileSync('docs/model-loader.js', 'utf8');

// Extract the vocab object
const vocabMatch = content.match(/vocab:\s*{([^}]+(?:{[^}]+}[^}]+)*?)}/s);
if (!vocabMatch) {
    console.error('Could not find vocab object');
    process.exit(1);
}

// Parse the vocabulary entries maintaining order
const vocabString = vocabMatch[1];
const entries = [];
const seenWords = new Set();
const duplicates = [];

// Match all vocabulary entries
const entryRegex = /'([^']+)':\s*(\d+)|"([^"]+)":\s*(\d+)/g;
let match;

while ((match = entryRegex.exec(vocabString)) !== null) {
    const word = match[1] || match[3];
    const tokenId = parseInt(match[2] || match[4]);
    
    if (seenWords.has(word)) {
        duplicates.push({ word, tokenId });
    } else {
        entries.push({ word, tokenId });
        seenWords.add(word);
    }
}

console.log(`Original entries: ${entries.length + duplicates.length}`);
console.log(`Unique entries: ${entries.length}`);
console.log(`Duplicates removed: ${duplicates.length}`);

// Create new vocabulary with reassigned token IDs
const newVocab = [];
let currentTokenId = 0;

// Map to track category boundaries
const categoryMap = {
    0: '// Special Tokens (0-3)',
    4: '// Core crisis support vocabulary (4-330)',
    331: '// Essential Articles & Pronouns (331-350)',
    351: '// Prepositions & Connecting Words (351-380)',
    381: '// Conjunctions & Logic Words (381-400)',
    401: '// Question Words & Conversation (401-420)',
    421: '// Auxiliary & Modal Verbs (421-450)',
    451: '// Numbers & Quantities (451-480)',
    481: '// Enhanced Emotional States (481-520)',
    521: '// Enhanced Crisis/Safety Terms (521-560)',
    561: '// Ma\'aseh & SIX Cs Enhanced (561-600)',
    601: '// Sensory & Grounding Terms (601-640)',
    641: '// Body Awareness & Physical States (641-680)',
    681: '// Breathing & Calming Techniques (681-710)',
    711: '// Environment & Shelter Details (711-750)',
    751: '// Communication & Technology (751-780)',
    781: '// Time & Duration Extended (781-810)',
    811: '// Actions & Movements Extended (811-850)',
    851: '// Relationships & Social Support (851-890)',
    891: '// Coping & Resilience (891-930)',
    931: '// Resources & Supplies (931-970)',
    971: '// Assessment & Evaluation (971-1000)',
    1001: '// Daily Life & General Communication (1001-2500)',
    2501: '// Punctuation & Sentence Structure (2501-2520)',
    2521: '// Common Contractions (2521-2550)',
    2551: '// Advanced Therapeutic Terms (2551-2600)',
    2601: '// Medical & Emergency Terms (2601-2700)',
    2701: '// Hebrew/Arabic Crisis Terms (2701-2800)',
    2801: '// Advanced Emotional Vocabulary (2801-2900)',
    2901: '// Conversational Fillers & Transitions (2901-3000)',
    3001: '// TV Frequency Words (3001+)'
};

// Build deduplicated vocabulary maintaining logical groups
let outputLines = [`            // Expanded vocabulary for mT5 (${entries.length} unique tokens)`, '            vocab: {'];
let lastCategory = '';

for (const entry of entries) {
    // Find appropriate category based on original token ID
    let category = '';
    for (const [boundary, categoryName] of Object.entries(categoryMap)) {
        if (entry.tokenId >= parseInt(boundary)) {
            category = categoryName;
        }
    }
    
    // Add category comment if changed
    if (category !== lastCategory) {
        outputLines.push('                ');
        outputLines.push(`                ${category}`);
        lastCategory = category;
    }
    
    // Add the vocabulary entry
    const quotedWord = entry.word.includes("'") ? `"${entry.word}"` : `'${entry.word}'`;
    outputLines.push(`                ${quotedWord}: ${currentTokenId},`);
    
    currentTokenId++;
}

// Remove the last comma
outputLines[outputLines.length - 1] = outputLines[outputLines.length - 1].slice(0, -1);
outputLines.push('            },');

// Save the deduplicated vocabulary
fs.writeFileSync('deduplicated_vocab_structure.js', outputLines.join('\n'));
console.log('\nDeduplicated vocabulary structure saved to deduplicated_vocab_structure.js');
console.log(`Final vocabulary size: ${currentTokenId} unique tokens`);