// Script to add TV frequency words (2001-3000) to the vocabulary and deduplicate
const fs = require('fs');

// New words from Wiktionary TV frequency list (2001-3000)
const newWords = [
    'milk', 'survive', 'forced', 'daria', 'victoria', 'operation', 'suck', 'offered', 'hm', 'ends',
    'dump', 'rent', 'marshall', 'remembered', 'lieutenant', 'trade', 'thanksgiving', 'rain', 'revenge', 'physical',
    'available', 'program', 'prefer', "baby's", 'spare', 'pray', 'disappeared', 'aside', 'statement', 'sometime',
    'animal', 'sugar', 'ricky', 'meat', 'fantastic', 'breathing', 'laughing', 'itself', 'tip', 'stood',
    'market', 'raul', 'affair', 'stephen', 'ours', 'depends', 'cook', 'babe', 'main', 'woods',
    'protecting', 'jury', 'harley', 'national', 'brave', 'storm', 'large', 'prince', "jack's", 'interview',
    'daniel', 'roger', 'football', 'fingers', 'murdered', 'stan', 'sexy', 'julia', 'explanation', 'da',
    'process', 'picking', 'based', 'style', 'stone', 'pieces', 'blah', 'assistant', 'stronger', 'block',
    'aah', 'newman', 'bullshit', 'pie', 'handsome', 'unbelievable', 'anytime', 'nearly', 'maureen', 'shake',
    "everyone's", 'oakdale', 'cars', 'wherever', 'serve', 'pulling', 'points', 'medicine', 'facts', 'waited',
    'pete', 'lousy', 'circumstances', 'stage', 'lucas', 'disappointed', 'weak', 'trusted', 'license', 'nothin',
    'community', 'trey', 'jan', 'trash', 'understanding', 'slip', 'cab', 'abby', 'sounded', 'awake',
    'friendship', 'stomach', 'weapon', 'threatened', 'don', 'mystery', 'sean', 'official', 'lee', 'dick',
    'regular', 'donna', 'river', 'malcolm', 'vegas', 'valley', 'understood', 'contract', 'bud', 'sexual',
    'race', 'basically', 'switch', 'lake', 'frankly', 'issues', 'cheap', 'lifetime', 'deny', 'painting',
    'ear', 'clock', 'baldwin', 'weight', 'garbage', "why'd", 'tear', 'ears', 'dig', 'bullet',
    'selling', 'setting', 'indeed', 'gus', 'changing', 'singing', 'tiny', 'particular', 'draw', 'decent',
    'susan', 'super', 'spring', 'santos', 'avoid', 'messed', 'united', 'filled', 'touched', 'score',
    "people's", 'disappear', 'stranger', 'exact', 'pills', 'kicked', 'harm', 'recently', 'ma', 'snow',
    'fortune', 'strike', 'pretending', 'raised', 'annie', 'slayer', 'monkey', 'insurance', 'fancy', 'sydney',
    'drove', 'cared', 'belongs', 'nights', 'shape', 'dogs', 'lorelai', 'jackie', 'base', 'maggie',
    'lift', 'lewis', 'stock', "sonny's", 'fashion', 'freedom', 'timing', 'johnny', 'guarantee', 'chest',
    'bridge'
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
        allEntries.push({ word: lowerWord, tokenId: 3000 + addedCount }); // Place in TV frequency category
        seenWords.add(lowerWord);
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
fs.writeFileSync('expanded_vocab_structure_v2.js', outputLines.join('\n'));
console.log(`\nExpanded vocabulary structure saved to expanded_vocab_structure_v2.js`);
console.log(`Final vocabulary size: ${currentTokenId} unique tokens`);