// Script to merge frequency words with vocabulary - Chunk 1 (first 500 words)
const fs = require('fs');

// First chunk of frequency words (words 1-500)
const newWords = [
    'lemma', 'be', 'and', 'a', 'of', 'to', 'in', 'i', 'you', 'it',
    'have', 'that', 'for', 'do', 'he', 'with', 'on', 'this', "n't", 'we',
    'not', 'but', 'they', 'say', 'at', 'what', 'his', 'from', 'go', 'or',
    'by', 'get', 'she', 'my', 'can', 'as', 'know', 'if', 'me', 'your',
    'all', 'who', 'about', 'their', 'will', 'so', 'would', 'make', 'just', 'up',
    'think', 'time', 'there', 'see', 'her', 'out', 'one', 'come', 'people', 'take',
    'year', 'him', 'them', 'some', 'want', 'how', 'when', 'which', 'now', 'like',
    'other', 'could', 'our', 'into', 'here', 'then', 'than', 'look', 'way', 'more',
    'these', 'no', 'thing', 'well', 'because', 'also', 'two', 'use', 'tell', 'good',
    'first', 'man', 'day', 'find', 'give', 'new', 'us', 'any', 'those', 'very',
    'need', 'back', 'should', 'even', 'only', 'many', 'really', 'work', 'life', 'why',
    'right', 'down', 'try', 'let', 'something', 'too', 'call', 'woman', 'may', 'still',
    'through', 'mean', 'after', 'never', 'world', 'feel', 'yeah', 'great', 'last', 'child',
    'oh', 'over', 'ask', 'school', 'state', 'much', 'talk', 'keep', 'leave', 'put',
    'help', 'big', 'where', 'same', 'own', 'while', 'start', 'three', 'high', 'every',
    'another', 'become', 'most', 'between', 'happen', 'family', 'president', 'old', 'yes', 'house',
    'show', 'again', 'student', 'seem', 'might', 'part', 'hear', 'its', 'place', 'problem',
    'believe', 'country', 'always', 'week', 'point', 'hand', 'off', 'play', 'turn', 'few',
    'group', 'such', 'against', 'run', 'guy', 'case', 'question', 'night', 'live', 'game',
    'number', 'write', 'bring', 'without', 'money', 'lot', 'book', 'system', 'government', 'next',
    'city', 'company', 'story', 'today', 'job', 'move', 'must', 'bad', 'friend', 'during',
    'begin', 'love', 'each', 'hold', 'different', 'american', 'little', 'before', 'ever', 'word',
    'fact', 'read', 'anything', 'nothing', 'sure', 'small', 'month', 'program', 'maybe', 'under',
    'business', 'home', 'kind', 'stop', 'pay', 'study', 'since', 'issue', 'name', 'idea',
    'room', 'percent', 'far', 'away', 'law', 'actually', 'large', 'though', 'provide', 'lose',
    'power', 'kid', 'war', 'understand', 'head', 'mother', 'real', 'best', 'team', 'eye',
    'long', 'side', 'water', 'young', 'wait', 'okay', 'both', 'yet', 'meet', 'service',
    'area', 'important', 'person', 'hey', 'thank', 'someone', 'end', 'change', 'however', 'around',
    'hour', 'everything', 'national', 'four', 'line', 'girl', 'watch', 'until', 'father', 'sit',
    'create', 'information', 'car', 'learn', 'least', 'already', 'kill', 'minute', 'party', 'include',
    'stand', 'together', 'follow', 'health', 'remember', 'often', 'reason', 'speak', 'ago', 'set',
    'black', 'member', 'community', 'once', 'social', 'news', 'allow', 'win', 'body', 'lead',
    'continue', 'whether', 'enough', 'spend', 'level', 'able', 'political', 'almost', 'boy', 'university',
    'stay', 'add', 'later', 'five', 'probably', 'center', 'among', 'face', 'public', 'die',
    'food', 'else', 'history', 'buy', 'result', 'morning', 'parent', 'office', 'course', 'send',
    'research', 'walk', 'door', 'white', 'several', 'court', 'grow', 'better', 'open', 'moment',
    'including', 'consider', 'such', 'within', 'second', 'late', 'street', 'free', 'everyone', 'policy',
    'table', 'sorry', 'care', 'low', 'human', 'please', 'hope', 'true', 'process', 'teacher',
    'data', 'offer', 'death', 'whole', 'experience', 'plan', 'easy', 'education', 'build', 'expect',
    'fall', 'himself', 'age', 'hard', 'sense', 'across', 'early', 'college', 'music', 'appear',
    'mind', 'class', 'police', 'effect', 'season', 'tax', 'heart', 'son', 'art', 'possible',
    'serve', 'break', 'although', 'market', 'air', 'force', 'require', 'foot', 'listen', 'agree',
    'according', 'anyone', 'baby', 'wrong', 'cut', 'decide', 'republican', 'full', 'behind', 'pass',
    'interest', 'sometimes', 'security', 'eat', 'control', 'rate', 'local', 'suggest', 'nation', 'sell',
    'action', 'wife', 'decision', 'receive', 'value', 'base', 'pick', 'phone', 'thanks', 'event',
    'drive', 'strong', 'reach', 'remain', 'explain', 'site', 'hit', 'pull', 'church', 'model',
    'perhaps', 'relationship', 'six', 'fine', 'movie', 'field', 'raise', 'less', 'player', 'couple',
    'million', 'themselves', 'record', 'especially', 'difference', 'light', 'development', 'federal', 'former', 'role',
    'pretty', 'myself', 'view', 'price', 'effort', 'nice', 'quite', 'along', 'voice', 'finally'
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
    
    if (!seenWords.has(word.toLowerCase())) {
        existingEntries.push({ word, tokenId });
        seenWords.add(word.toLowerCase());
    }
}

console.log(`Existing unique words: ${existingEntries.length}`);

// Add new words that aren't already in the vocabulary (case-insensitive check)
let addedCount = 0;
let duplicateCount = 0;
const allEntries = [...existingEntries];

for (const word of newWords) {
    const lowerWord = word.toLowerCase();
    if (!seenWords.has(lowerWord)) {
        allEntries.push({ word: lowerWord, tokenId: 4000 + addedCount }); // Place in new frequency category
        seenWords.add(lowerWord);
        addedCount++;
    } else {
        duplicateCount++;
    }
}

console.log(`Chunk 1 - New words added: ${addedCount}`);
console.log(`Chunk 1 - Duplicates skipped: ${duplicateCount}`);
console.log(`Total unique words after chunk 1: ${allEntries.length}`);

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
    4000: '// Common English Words - Chunk 1 (4001+)'
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
fs.writeFileSync('vocab_chunk1.js', outputLines.join('\n'));
console.log(`\nChunk 1 vocabulary saved to vocab_chunk1.js`);
console.log(`Final vocabulary size after chunk 1: ${currentTokenId} unique tokens`);