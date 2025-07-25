// Script to add TV frequency words to the vocabulary and deduplicate
const fs = require('fs');

// New words from Wiktionary TV frequency list (1001-2000)
const newWords = [
    'station', 'acting', 'accept', 'blow', 'strange', 'saved', 'ivy', 'conversation', 'plane', 'mama',
    'yesterday', 'lied', 'quick', 'lately', 'stuck', 'lovely', 'security', 'report', 'barbara', 'difference',
    'rid', 'tv', 'adam', 'store', "she'd", 'bag', 'mike', 'bought', 'ball', 'single',
    'kevin', 'doubt', 'listening', 'major', 'walking', 'cops', 'blue', 'deep', 'dangerous', 'buffy',
    'park', 'sleeping', 'chloe', 'rafe', 'shh', 'record', 'lord', 'erica', 'moved', 'join',
    'key', 'captain', 'card', 'crime', 'gentlemen', 'willing', 'window', 'return', 'walked', 'guilty',
    'brenda', 'likes', 'fighting', 'difficult', 'soul', 'joke', 'service', 'magic', 'favorite', 'uncle',
    'promised', 'public', 'bother', 'island', 'jim', 'seriously', 'cell', 'lead', 'knowing', 'broken',
    'advice', 'somehow', 'paid', 'blair', 'losing', 'push', 'helped', 'killing', 'usually', 'earlier',
    'boss', 'laura', 'beginning', 'liked', 'innocent', 'doc', 'rules', 'elizabeth', 'sabrina', 'summer',
    'ex', 'cop', 'learned', 'thirty', 'risk', 'letting', 'phillip', 'speaking', 'officer', 'ridiculous',
    'support', 'afternoon', 'eric', 'born', 'dreams', 'apologize', 'seat', 'nervous', 'across', 'song',
    'olivia', 'charge', 'patient', 'cassie', 'boat', "how'd", 'brain', 'hide', 'detective', 'aaron',
    'kendall', 'general', 'tom', 'planning', 'nine', 'huge', 'breakfast', 'horrible', 'age', 'awful',
    'pleasure', 'driving', 'hanging', 'picked', 'system', 'sell', 'quit', 'apparently', 'dying', 'notice',
    'josh', 'congratulations', 'chief', 'faith', 'simon', 'gay', 'ho', "one's", 'month', 'visit',
    'hal', "could've", "c'mon", 'aw', 'edmund', 'brady', 'letter', 'decide', 'american', 'double',
    'troy', 'sad', 'press', 'forward', 'fool', 'showed', 'smell', 'seemed', 'mary', 'spell',
    'courtney', 'memory', 'mark', 'alan', 'pictures', 'paris', 'slow', 'joe', 'tim', 'seconds',
    'hungry', 'board', 'position', 'hearing', 'roz', 'kitchen', "ma'am", 'bob', 'force', 'fly',
    'during', 'space', "should've", 'realized', 'experience', 'kick', 'others', 'grab', "mother's", 'p',
    'sharon', 'discuss', 'third', 'cat', 'fifty', 'responsible', 'jennifer', 'philip', 'miles', 'fat',
    'reading', 'idiot', 'yep', 'rock', 'rich', 'suddenly', 'agent', 'bunch', 'destroy'
];

// Read the current vocabulary from model-loader.js
const content = fs.readFileSync('docs/model-loader.js', 'utf8');

// Extract the vocab object
const vocabMatch = content.match(/vocab:\s*{([^}]+(?:{[^}]+}[^}]+)*?)}/s);
if (!vocabMatch) {
    console.error('Could not find vocab object');
    process.exit(1);
}

// Parse the existing vocabulary
const vocabString = vocabMatch[1];
const existingEntries = [];
const seenWords = new Set();

// Match all vocabulary entries
const entryRegex = /'([^']+)':\s*(\d+)|"([^"]+)":\s*(\d+)/g;
let match;

while ((match = entryRegex.exec(vocabString)) !== null) {
    const word = match[1] || match[3];
    const tokenId = parseInt(match[2] || match[4]);
    
    if (!seenWords.has(word)) {
        existingEntries.push({ word, tokenId });
        seenWords.add(word);
    }
}

console.log(`Existing unique words: ${existingEntries.length}`);

// Add new words that aren't already in the vocabulary
let addedCount = 0;
let duplicateCount = 0;
const allEntries = [...existingEntries];

for (const word of newWords) {
    if (!seenWords.has(word)) {
        allEntries.push({ word, tokenId: 3000 + addedCount }); // Place in TV frequency category
        seenWords.add(word);
        addedCount++;
    } else {
        duplicateCount++;
    }
}

console.log(`New words added: ${addedCount}`);
console.log(`Duplicates skipped: ${duplicateCount}`);
console.log(`Total unique words: ${allEntries.length}`);

// Create new vocabulary with reassigned token IDs
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
    3000: '// TV Frequency Words (3001+)'
};

// Build deduplicated vocabulary maintaining logical groups
let outputLines = [`            // Expanded vocabulary for mT5 (${allEntries.length} unique tokens)`, '            vocab: {'];
let lastCategory = '';

for (const entry of allEntries) {
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

// Save the expanded vocabulary
fs.writeFileSync('expanded_vocab_structure.js', outputLines.join('\n'));
console.log(`\nExpanded vocabulary structure saved to expanded_vocab_structure.js`);
console.log(`Final vocabulary size: ${currentTokenId} unique tokens`);