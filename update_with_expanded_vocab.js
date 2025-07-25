// Script to update model-loader.js with expanded vocabulary
const fs = require('fs');

// Read the original file
const content = fs.readFileSync('docs/model-loader.js', 'utf8');

// Read the expanded vocabulary
const expandedVocab = fs.readFileSync('expanded_vocab_structure.js', 'utf8');

// Find the vocab section to replace
const startPattern = /this\.tokenizer = \{[\s\S]*?vocab: \{/;
const endPattern = /\},\s*encode:/;

// Extract the current vocab section
const startMatch = content.match(startPattern);
if (!startMatch) {
    console.error('Could not find start of vocab section');
    process.exit(1);
}

const startIndex = content.indexOf(startMatch[0]);
const afterStart = content.substring(startIndex);
const endMatch = afterStart.match(endPattern);

if (!endMatch) {
    console.error('Could not find end of vocab section');
    process.exit(1);
}

const endIndex = startIndex + afterStart.indexOf(endMatch[0]);

// Build the new tokenizer section
const newTokenizerSection = `this.tokenizer = {
${expandedVocab}
            
            encode: `;

// Replace the vocab section
const newContent = content.substring(0, startIndex) + newTokenizerSection + content.substring(endIndex + endMatch[0].length - 9);

// Update decoder limits to match new vocabulary size (2158)
let updatedContent = newContent.replace(/for \(let j = 0; j < Math\.min\(lastPositionLogits\.length, \d+\); j\+\+\)/g, 
                                        'for (let j = 0; j < Math.min(lastPositionLogits.length, 2158); j++)');

// Save the updated file
fs.writeFileSync('docs/model-loader.js', updatedContent);
console.log('Successfully updated model-loader.js with expanded vocabulary (2158 unique tokens)');