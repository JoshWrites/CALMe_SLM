// Script to analyze vocabulary for duplicates
const fs = require('fs');

// Read the model-loader.js file
const content = fs.readFileSync('docs/model-loader.js', 'utf8');

// Extract the vocab object
const vocabMatch = content.match(/vocab:\s*{([^}]+(?:{[^}]+}[^}]+)*?)}/s);
if (!vocabMatch) {
    console.error('Could not find vocab object');
    process.exit(1);
}

// Parse the vocabulary entries
const vocabString = vocabMatch[1];
const entries = [];
const tokenToWord = {};
const wordToTokens = {};

// Match all vocabulary entries
const entryRegex = /'([^']+)':\s*(\d+)|"([^"]+)":\s*(\d+)/g;
let match;

while ((match = entryRegex.exec(vocabString)) !== null) {
    const word = match[1] || match[3];
    const tokenId = parseInt(match[2] || match[4]);
    
    entries.push({ word, tokenId });
    tokenToWord[tokenId] = word;
    
    if (!wordToTokens[word]) {
        wordToTokens[word] = [];
    }
    wordToTokens[word].push(tokenId);
}

// Find duplicates
const duplicates = {};
for (const [word, tokens] of Object.entries(wordToTokens)) {
    if (tokens.length > 1) {
        duplicates[word] = tokens;
    }
}

// Sort entries by token ID
entries.sort((a, b) => a.tokenId - b.tokenId);

// Output analysis
console.log(`Total vocabulary entries: ${entries.length}`);
console.log(`Unique words: ${Object.keys(wordToTokens).length}`);
console.log(`Duplicate words: ${Object.keys(duplicates).length}`);
console.log('\nDuplicates found:');

// Show duplicates sorted by first occurrence
const duplicateList = Object.entries(duplicates)
    .map(([word, tokens]) => ({ word, tokens, first: Math.min(...tokens) }))
    .sort((a, b) => a.first - b.first);

for (const { word, tokens } of duplicateList) {
    console.log(`  "${word}": [${tokens.join(', ')}]`);
}

// Create deduplicated vocabulary
console.log('\nCreating deduplicated vocabulary...');

const deduplicatedVocab = {};
const usedWords = new Set();
let newTokenId = 0;

// First pass: preserve special tokens and original order
for (const entry of entries) {
    if (!usedWords.has(entry.word)) {
        deduplicatedVocab[entry.word] = newTokenId++;
        usedWords.add(entry.word);
    }
}

console.log(`\nDeduplicated vocabulary size: ${Object.keys(deduplicatedVocab).length}`);

// Save deduplicated vocabulary to file
const outputLines = [];
outputLines.push('// Deduplicated vocabulary');
outputLines.push(`// Total unique tokens: ${Object.keys(deduplicatedVocab).length}`);
outputLines.push('// Special Tokens (0-3)');

let currentCategory = '';
for (const [word, tokenId] of Object.entries(deduplicatedVocab)) {
    // Add category comments based on token ranges
    if (tokenId === 0) currentCategory = '// Special Tokens (0-3)';
    else if (tokenId === 4) currentCategory = '// Core crisis support vocabulary';
    else if (tokenId === 331) currentCategory = '// Essential Articles & Pronouns';
    else if (tokenId === 1001) currentCategory = '// Daily Life & General Communication';
    else if (tokenId === 2501) currentCategory = '// Punctuation & Sentence Structure';
    else if (tokenId === 3001) currentCategory = '// TV Frequency Words';
    
    if (currentCategory) {
        outputLines.push(currentCategory);
        currentCategory = '';
    }
    
    const quotedWord = word.includes("'") ? `"${word}"` : `'${word}'`;
    outputLines.push(`${quotedWord}: ${tokenId},`);
}

fs.writeFileSync('deduplicated_vocab.txt', outputLines.join('\n'));
console.log('\nDeduplicated vocabulary saved to deduplicated_vocab.txt');