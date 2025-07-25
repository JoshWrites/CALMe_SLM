// Script to merge frequency words with vocabulary - Chunk 2 (words 501-1000)
const fs = require('fs');

// Second chunk of frequency words (words 501-1000)
const newWords = [
    'department', 'either', 'toward', 'leader', 'photo', 'wear', 'space', 'project', 'return', 'position',
    'special', 'film', 'major', 'type', 'town', 'article', 'road', 'form', 'chance', 'drug',
    'economic', 'situation', 'choose', 'practice', 'cause', 'happy', 'science', 'join', 'teach', 'develop',
    'share', 'yourself', 'carry', 'clear', 'brother', 'matter', 'dead', 'image', 'star', 'cost',
    'simply', 'post', 'society', 'picture', 'piece', 'paper', 'energy', 'personal', 'building', 'military',
    'doctor', 'activity', 'exactly', 'media', 'miss', 'evidence', 'product', 'realize', 'save', 'arm',
    'technology', 'catch', 'comment', 'term', 'color', 'cover', 'describe', 'guess', 'choice', 'source',
    'mom', 'soon', 'director', 'international', 'rule', 'campaign', 'ground', 'election', 'uh', 'check',
    'page', 'fight', 'itself', 'test', 'patient', 'produce', 'certain', 'whatever', 'half', 'video',
    'throw', 'third', 'rest', 'recent', 'available', 'step', 'ready', 'opportunity', 'official', 'oil',
    'organization', 'character', 'single', 'current', 'likely', 'county', 'future', 'dad', 'whose', 'shoot',
    'industry', 'list', 'general', 'stuff', 'figure', 'attention', 'forget', 'risk', 'focus', 'short',
    'fire', 'dog', 'red', 'hair', 'condition', 'wall', 'daughter', 'deal', 'author', 'truth',
    'upon', 'husband', 'period', 'series', 'order', 'officer', 'close', 'land', 'note', 'computer',
    'thought', 'economy', 'goal', 'bank', 'behavior', 'sound', 'certainly', 'nearly', 'increase', 'act',
    'north', 'blood', 'culture', 'medical', 'ok', 'everybody', 'top', 'difficult', 'language', 'window',
    'response', 'population', 'lie', 'tree', 'worker', 'draw', 'drop', 'push', 'earth', 'cause',
    'per', 'private', 'tonight', 'race', 'letter', 'gun', 'simple', 'course', 'wonder', 'involve',
    'hell', 'poor', 'each', 'answer', 'nature', 'administration', 'common', 'hard', 'message', 'song',
    'enjoy', 'similar', 'congress', 'attack', 'past', 'hot', 'seek', 'amount', 'analysis', 'store',
    'defense', 'bill', 'cell', 'away', 'performance', 'hospital', 'bed', 'board', 'protect', 'century',
    'summer', 'material', 'individual', 'recently', 'example', 'represent', 'fill', 'animal', 'fail', 'factor',
    'natural', 'sir', 'agency', 'usually', 'significant', 'ability', 'mile', 'statement', 'entire', 'democrat',
    'floor', 'serious', 'career', 'dollar', 'vote', 'sex', 'compare', 'south', 'forward', 'subject',
    'financial', 'identify', 'beautiful', 'decade', 'bit', 'reduce', 'sister', 'quality', 'quickly', 'press',
    'worry', 'accept', 'enter', 'mention', 'thus', 'plant', 'movement', 'scene', 'section', 'treatment',
    'wish', 'benefit', 'interesting', 'west', 'candidate', 'approach', 'determine', 'resource', 'claim', 'prove',
    'sort', 'size', 'somebody', 'knowledge', 'rather', 'hang', 'sport', 'tv', 'loss', 'argue',
    'left', 'meeting', 'skill', 'card', 'feeling', 'despite', 'degree', 'crime', 'sign', 'occur',
    'imagine', 'near', 'king', 'box', 'present', 'seven', 'foreign', 'laugh', 'disease', 'lady',
    'beyond', 'discuss', 'finish', 'design', 'concern', 'ball', 'east', 'recognize', 'apply', 'prepare',
    'network', 'huge', 'success', 'district', 'cup', 'physical', 'growth', 'rise', 'hi', 'standard',
    'fan', 'theory', 'staff', 'hurt', 'legal', 'september', 'outside', 'et', 'strategy', 'clearly',
    'property', 'lay', 'final', 'authority', 'perfect', 'method', 'region', 'impact', 'indicate', 'safe',
    'committee', 'supposed', 'dream', 'training', 'shit', 'central', 'option', 'eight', 'particularly', 'completely',
    'opinion', 'main', 'ten', 'interview', 'exist', 'remove', 'dark', 'union', 'professor', 'pressure',
    'purpose', 'stage', 'blue', 'herself', 'sun', 'pain', 'artist', 'employee', 'avoid', 'account',
    'release', 'fund', 'environment', 'treat', 'specific', 'version', 'shot', 'hate', 'reality', 'visit',
    'club', 'justice', 'river', 'brain', 'memory', 'rock', 'camera', 'global', 'various', 'arrive',
    'notice', 'detail', 'challenge', 'argument', 'nobody', 'weapon', 'station', 'island', 'absolutely', 'instead',
    'discussion', 'affect', 'anyway', 'respond', 'trouble', 'conversation', 'manage', 'date', 'army', 'charge',
    'seat', 'assume', 'writer', 'perform', 'credit', 'green', 'marriage', 'operation', 'indeed', 'sleep',
    'necessary', 'reveal', 'agent', 'access', 'bar', 'debate', 'leg', 'contain', 'beat', 'cool',
    'democratic', 'cold', 'glass', 'improve', 'adult', 'trade', 'religious', 'review', 'address', 'association',
    'measure', 'stock', 'gas', 'deep', 'lawyer', 'production', 'relate', 'middle', 'management', 'original',
    'victim', 'cancer', 'speech', 'particular', 'trial', 'none', 'item', 'weight', 'tomorrow', 'positive',
    'citizen', 'trip', 'establish', 'executive', 'politics', 'stick', 'customer', 'manager', 'publish', 'popular',
    'sing', 'ahead', 'conference', 'total', 'discover', 'fast', 'direction', 'sunday', 'maintain', 'majority',
    'peace', 'dinner', 'partner', 'user', 'above', 'fly', 'bag', 'therefore', 'rich', 'tough',
    'owner', 'shall', 'inside', 'voter', 'tool', 'june', 'mountain', 'range', 'coach', 'fear',
    'friday', 'attorney', 'unless', 'nor', 'expert', 'structure', 'budget', 'insurance', 'text', 'freedom',
    'crazy', 'reader', 'style', 'march', 'machine', 'november', 'generation', 'income', 'born', 'admit',
    'hello', 'onto', 'sea', 'mouth', 'throughout', 'web', 'shake', 'threat', 'solution', 'shut',
    'travel', 'scientist', 'hide', 'obviously', 'refer', 'alone', 'drink', 'investigation', 'senator', 'unit',
    'photograph', 'july', 'television', 'key', 'sexual', 'radio', 'prevent', 'once', 'modern', 'senate',
    'violence', 'touch', 'feature', 'audience', 'evening', 'whom', 'front', 'hall', 'task', 'score',
    'skin', 'suffer', 'wide', 'spring', 'civil', 'safety', 'weekend', 'while', 'worth', 'title',
    'heat', 'normal', 'yard', 'finger', 'tend', 'mission', 'eventually', 'participant', 'hotel', 'judge',
    'pattern', 'institution', 'faith', 'professional', 'reflect', 'folk', 'surface', 'client', 'edge', 'traditional',
    'council', 'device', 'firm', 'environmental', 'responsibility', 'chair', 'internet', 'october', 'funny', 'immediately',
    'investment', 'ship', 'effective', 'previous', 'consumer', 'element', 'nuclear', 'spirit', 'directly', 'afraid'
];

// Read the vocabulary from chunk 1
const content = fs.readFileSync('vocab_chunk1.js', 'utf8');

// Extract the vocab object
const vocabMatch = content.match(/vocab:\s*{([^}]+(?:{[^}]+}[^}]+)*?)}/s);
if (!vocabMatch) {
    console.error('Could not find vocab object from chunk 1');
    process.exit(1);
}

// Parse the existing vocabulary from chunk 1
const vocabString = vocabMatch[1];
const existingEntries = [];
const seenWords = new Set();

// Match all vocabulary entries
const entryRegex = /'([^']+)':\s*(\d+)|"([^"]+)":\s*(\d+)/g;
let match;

while ((match = entryRegex.exec(vocabString)) !== null) {
    const word = match[1] || match[3];
    const tokenId = parseInt(match[2] || match[4]);
    
    if (!seenWords.has(word.toLowerCase())) {
        existingEntries.push({ word, tokenId });
        seenWords.add(word.toLowerCase());
    }
}

console.log(`Words from chunk 1: ${existingEntries.length}`);

// Add new words that aren't already in the vocabulary (case-insensitive check)
let addedCount = 0;
let duplicateCount = 0;
const allEntries = [...existingEntries];

for (const word of newWords) {
    const lowerWord = word.toLowerCase();
    if (!seenWords.has(lowerWord)) {
        allEntries.push({ word: lowerWord, tokenId: 4500 + addedCount }); // Place in chunk 2 category
        seenWords.add(lowerWord);
        addedCount++;
    } else {
        duplicateCount++;
    }
}

console.log(`Chunk 2 - New words added: ${addedCount}`);
console.log(`Chunk 2 - Duplicates skipped: ${duplicateCount}`);
console.log(`Total unique words after chunk 2: ${allEntries.length}`);

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
    3000: '// TV Frequency Words (3001+)',
    4000: '// Common English Words - Chunk 1 (4001+)',
    4500: '// Common English Words - Chunk 2 (4501+)'
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
fs.writeFileSync('vocab_chunk2.js', outputLines.join('\n'));
console.log(`\nChunk 2 vocabulary saved to vocab_chunk2.js`);
console.log(`Final vocabulary size after chunk 2: ${currentTokenId} unique tokens`);