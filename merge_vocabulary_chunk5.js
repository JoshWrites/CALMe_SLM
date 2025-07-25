// Script to merge frequency words with vocabulary - Chunk 5 (remaining words)
const fs = require('fs');

// Fifth chunk of frequency words (remaining words from the large list)
const newWords = [
    'anticipate', 'bug', 'primary', 'dedicate', 'nominee', 'transformation', 'temple', 'sense', 'arrival', 'frustration',
    'changing', 'demonstration', 'pollution', 'poster', 'nail', 'nonprofit', 'guidance', 'exhibit', 'pen', 'interrupt',
    'lemon', 'bankruptcy', 'resign', 'dominant', 'invasion', 'sacred', 'replacement', 'portray', 'hunt', 'distinguish',
    'melt', 'consensus', 'hardware', 'rail', 'mate', 'korean', 'cabin', 'dining', 'snake', 'tobacco',
    'orientation', 'trigger', 'wherever', 'seize', 'mess', 'punish', 'sexy', 'depict', 'input', 'seemingly',
    'widespread', 'competitor', 'flip', 'freshman', 'donation', 'administrative', 'donor', 'gradually', 'overlook', 'toilet',
    'pleased', 'resemble', 'ideology', 'glory', 'maximum', 'organ', 'skip', 'starting', 'brush', 'brick',
    'gut', 'reservation', 'rebel', 'disappointed', 'oak', 'valid', 'instructor', 'rescue', 'racism', 'pension',
    'diabetes', 'cluster', 'eager', 'marijuana', 'combat', 'praise', 'costume', 'sixth', 'frequent', 'inspiration',
    'concrete', 'cooking', 'conspiracy', 'trait', 'van', 'institutional', 'garlic', 'drinking', 'crystal', 'pro',
    'associate', 'helicopter', 'counsel', 'equation', 'roman', 'sophisticated', 'timing', 'pope', 'opera', 'ethical',
    'indication', 'motive', 'porch', 'reinforce', 'gaze', 'ours', 'lap', 'written', 'reverse', 'starter',
    'injure', 'chronic', 'continued', 'exclusive', 'colonel', 'beef', 'abroad', 'thanksgiving', 'intensity', 'cave',
    'basement', 'associated', 'unlike', 'fascinating', 'interact', 'illustration', 'essence', 'container', 'stuff', 'dynamic',
    'gym', 'bat', 'plead', 'promotion', 'uncertainty', 'ownership', 'officially', 'tag', 'documentary', 'stem',
    'flood', 'guilt', 'alarm', 'turkey', 'conduct', 'diagnose', 'precious', 'swallow', 'initiate', 'fitness',
    'restrict', 'gulf', 'advocate', 'mommy', 'unexpected', 'shrug', 'agricultural', 'sacrifice', 'spectrum', 'dragon',
    'bacteria', 'shore', 'pastor', 'cliff', 'ship', 'adequate', 'tackle', 'occupation', 'compose', 'slice',
    'stimulus', 'patent', 'powder', 'harsh', 'chaos', 'kit', 'piano', 'surprisingly', 'lend', 'correctly',
    'govern', 'modest', 'shared', 'psychologist', 'servant', 'overwhelming', 'elevator', 'hispanic', 'divine', 'transmission',
    'butt', 'commonly', 'cowboy', 'ease', 'intent', 'counseling', 'gentle', 'rhythm', 'complexity', 'nonetheless',
    'effectiveness', 'lonely', 'statistical', 'longtime', 'strain', 'garbage', 'devote', 'speed', 'venture', 'aide',
    'subtle', 'rod', 'civilian', 't-shirt', 'endure', 'basket', 'strict', 'loser', 'franchise', 'saint',
    'prosecution', 'lyrics', 'compound', 'architecture', 'reach', 'destination', 'cope', 'province', 'sum', 'lecture',
    'spill', 'genuine', 'upstairs', 'trading', 'acceptance', 'revelation', 'indicator', 'collaboration', 'rhetoric', 'tune',
    'slam', 'inevitable', 'monkey', 'protocol', 'productive', 'principal', 'finish', 'jeans', 'companion', 'convict',
    'boost', 'recipient', 'practically', 'array', 'persuade', 'undermine', 'yep', 'ranch', 'scout', 'medal',
    'endless', 'translation', 'ski', 'conservation', 'habitat', 'contractor', 'trailer', 'pitcher', 'towel', 'goodbye',
    'bonus', 'dramatically', 'genre', 'caller', 'exit', 'hook', 'behavioral', 'omit', 'pit', 'boring',
    'suspend', 'cholesterol', 'closed', 'advertisement', 'bombing', 'consult', 'encounter', 'expertise', 'creator', 'peaceful',
    'provided', 'tablet', 'ruling', 'launch', 'warming', 'equity', 'rational', 'utilize', 'pine', 'bitter',
    'guard', 'surgeon', 'affordable', 'tennis', 'artistic', 'download', 'suffering', 'accuracy', 'literacy', 'treasury',
    'talented', 'crown', 'importantly', 'bare', 'invisible', 'sergeant', 'regulatory', 'thumb', 'colony', 'walking',
    'accessible', 'integration', 'spouse', 'excitement', 'residence', 'bold', 'adolescent', 'greek', 'doll', 'oxygen',
    'gravity', 'functional', 'palace', 'echo', 'cotton', 'rescue', 'estimated', 'endorse', 'lawmaker', 'determination',
    'flash', 'simultaneously', 'dynamics', 'shell', 'hint', 'administer', 'christianity', 'distract', 'alleged', 'statute',
    'biology', 'follower', 'nasty', 'evident', 'confess', 'eligible', 'consent', 'pump', 'bloody', 'occasional',
    'trunk', 'prohibit', 'sustainable', 'belly', 'banking', 'asshole', 'journalism', 'obstacle', 'ridge', 'heal',
    'bastard', 'cheer', 'apology', 'tumor', 'architect', 'wrist', 'harbor', 'handsome', 'bullshit', 'realm',
    'twist', 'inspector', 'surveillance', 'trauma', 'rebuild', 'romance', 'gross', 'deadline', 'classical', 'convey',
    'compensation', 'insect', 'output', 'parliament', 'suite', 'opposed', 'fold', 'separation', 'demon', 'eating',
    'structural', 'equality', 'logical', 'probability', 'await', 'generous', 'acquisition', 'custody', 'compromise', 'greet',
    'trash', 'judicial', 'earthquake', 'insane', 'realistic', 'assemble', 'necessity', 'horn', 'parameter', 'grip',
    'modify', 'sponsor', 'mathematics', 'hallway', 'african-american', 'liability', 'crawl', 'theoretical', 'condemn', 'fluid',
    'homeland', 'technological', 'exam', 'anchor', 'spell', 'considering', 'conscious', 'vitamin', 'known', 'hostage',
    'actively', 'mill', 'teenage', 'retrieve', 'processing', 'sentiment', 'offering', 'oral', 'convinced', 'photography',
    'coin', 'laptop', 'bounce', 'goodness', 'affiliation', 'punch', 'burst', 'bee', 'blessing', 'continuous',
    'landing', 'repair', 'ritual', 'bath', 'sneak', 'historically', 'mud', 'scan', 'reminder', 'hers',
    'slavery', 'supervisor', 'quantity', 'olympics', 'pleasant', 'slope', 'skirt', 'outlet', 'curtain', 'declaration',
    'seal', 'immune', 'calendar', 'paragraph', 'identical', 'regret', 'quest', 'entrepreneur', 'specify', 'stumble',
    'clay', 'noon', 'elbow', 'outstanding', 'uh-huh', 'unity', 'manipulate', 'airplane', 'portfolio', 'mysterious',
    'delicious', 'northwest', 'sweat', 'profound', 'treasure', 'flour', 'lightly', 'rally', 'default', 'alongside',
    'hug', 'isolate', 'exploration', 'limb', 'enroll', 'outer', 'charter', 'southwest', 'escape', 'arena',
    'witch', 'upcoming', 'forty', 'someday', 'unite', 'courtesy', 'statue', 'fist', 'castle', 'precise',
    'squad', 'cruise', 'legally', 'embassy', 'patience', 'thereby', 'bush', 'purple', 'electrical', 'outfit',
    'cage', 'retired', 'shark', 'lobby', 'sidewalk', 'runner', 'ankle', 'attraction', 'artificial', 'mercy',
    'indigenous', 'slap', 'dancer', 'candle', 'sexually', 'needle', 'chronicle', 'suburb', 'toxic', 'underlying',
    'sensor', 'deploy', 'debut', 'magnitude', 'suspicion', 'colonial', 'icon', 'grandma', 'info', 'jurisdiction',
    'iranian', 'senior', 'parade', 'archive', 'gifted', 'rage', 'outdoor', 'ending', 'loop', 'altogether',
    'burning', 'reception', 'local', 'crush', 'premise', 'deem', 'automatic', 'whale', 'mechanical', 'credibility',
    'drain', 'drift', 'loyalty', 'promising', 'tide', 'traveler', 'grief', 'metaphor', 'skull', 'pursuit',
    'therapist', 'backup', 'workplace', 'instinct', 'export', 'bleed', 'seventh', 'fixed', 'broadcast', 'disclose',
    'execution', 'pal', 'chuckle', 'density', 'correction', 'jump', 'kinda', 'relieve', 'teammate', 'corridor',
    'russian', 'enthusiasm', 'extended', 'root', 'alright', 'panic', 'pad', 'bid', 'mild', 'productivity',
    'tuck', 'railroad', 'frozen', 'minimize', 'amid', 'inspection', 'cab', 'expected', 'nonsense', 'leap',
    'rider', 'theology', 'terrific', 'accent', 'invitation', 'israeli', 'liar', 'oversee', 'awkward', 'registration',
    'suburban', 'momentum', 'instantly', 'clerk', 'chin', 'hockey', 'laser', 'proposition', 'rob', 'beam',
    'ancestor', 'creativity', 'verse', 'casual', 'objection', 'clever', 'shove', 'revolutionary', 'carbohydrate', 'steam',
    'reportedly', 'forehead', 'resume', 'sheep', 'carpet', 'cloth', 'interior', 'full-time', 'questionnaire', 'departure',
    'behalf', 'graph', 'diplomatic', 'thief', 'herb', 'subsidy', 'fossil', 'patrol', 'pulse', 'mechanic',
    'cattle', 'screening', 'continuing', 'electoral', 'supposedly', 'dignity', 'prophet', 'commentary', 'serving', 'safely',
    'homework', 'allegedly', 'android', 'alpha', 'insert', 'mortality', 'contend', 'elephant', 'solely', 'hurt',
    'continent', 'ecosystem', 'nearby', 'olive', 'syndrome', 'minimum', 'abstract', 'accusation', 'coming', 'sock',
    'pickup', 'shuttle', 'improved', 'calculation', 'innovative', 'demographic', 'accommodate', 'jaw', 'unfair', 'tragic',
    'comprise', 'faster', 'nutrition', 'mentor', 'stance', 'rabbit', 'dot', 'contributor', 'cooperate', 'disk',
    'hesitate', 'offend', 'exploit', 'compel', 'likelihood', 'sibling', 'southeast', 'gorgeous', 'undertake', 'painter',
    'residential', 'counterpart', 'believer', 'lamp', 'inmate', 'thoroughly', 'freak', 'filter', 'pillow', 'orbit',
    'purse', 'likewise', 'cease', 'passing', 'vanish', 'instructional', 'clause', 'mentally', 'pond', 'neutral',
    'shield', 'popularity', 'cartoon', 'authorize', 'combined', 'graphic', 'darling', 'traditionally', 'vendor', 'poorly',
    'conceive', 'opt', 'descend', 'firmly', 'beloved', 'openly', 'gathering', 'fever', 'preach', 'interfere',
    'arrow', 'required', 'capitalism', 'fork', 'meantime', 'presumably', 'racist', 'illusion', 'removal', 'anxious',
    'organism', 'sculpture', 'spare', 'harassment', 'drum', 'diminish', 'helmet', 'certificate', 'tribal', 'mmm',
    'sadly', 'cart', 'spy', 'sunlight', 'delete', 'rookie', 'clarify', 'hunger', 'practitioner', 'performer',
    'protective', 'jar', 'programming', 'dawn', 'salmon', 'census', 'accomplishment', 'conscience', 'fortunately', 'minimal',
    'molecule', 'supportive', 'sole', 'threshold', 'inventory', 'comply', 'monetary', 'transport', 'shy', 'drill',
    'influential', 'verbal', 'ranking', 'gram', 'grasp', 'puzzle', 'envelope', 'classify', 'enact', 'unfortunate',
    'scatter', 'cure', 'dear', 'readily', 'discount', 'addiction', 'emerging', 'worthy', 'marker', 'juror',
    'blend', 'businessman', 'premium', 'retailer', 'liver', 'pirate', 'protester', 'outlook', 'elder', 'gallon',
    'additionally', 'ignorance', 'chemistry', 'sometime', 'weed', 'babe', 'fraction', 'conversion', 'tolerate', 'trail',
    'drown', 'merit', 'citizenship', 'coordinator', 'validity', 'lightning', 'turtle', 'ambition', 'worldwide', 'sail',
    'added', 'delicate', 'comic', 'soap', 'hostile', 'instruct', 'shortage', 'useless', 'booth', 'diary',
    'gasp', 'suspicious', 'transit', 'excite', 'publishing', 'curiosity', 'grid', 'rolling', 'bow', 'cruel',
    'disclosure', 'rival', 'denial', 'secular', 'speculation', 'sympathy', 'tender', 'inappropriate', "o'clock", 'sodium',
    'spring', 'bang', 'challenging', 'ipad', 'sack', 'barn', 'reliability', 'hormone', 'footage', 'carve',
    'alley', 'coastal', 'cafe', 'partial', 'flexible', 'experienced', 'mixed', 'vampire', 'optimistic', 'dessert',
    'well-being', 'northeast', 'specialize', 'fleet', 'availability', 'compliance', 'pin', 'pork', 'astronomer', 'forbid',
    'installation', 'boil', 'nest', 'exclusively', 'goat', 'shallow', 'equip', 'equivalent', 'betray', 'willingness',
    'banker', 'interval', 'gasoline', 'encouraging', 'bucket', 'theft', 'laundry', 'constraint', 'dying', 'hatred',
    'jewelry', 'migration', 'invention', 'loving', 'revenge', 'unprecedented', 'outline', 'sheer', 'halloween', 'sweetheart',
    'spit', 'lazy', 'intimate', 'defender', 'technically', 'battle', 'peanut', 'unclear', 'piss', 'workout',
    'wilderness', 'compelling', 'eleven', 'backyard', 'alike', 'partially', 'guardian', 'passionate', 'scripture', 'midst',
    'ideological', 'apart', 'thrive', 'sensitivity', 'emotionally', 'ignorant', 'explicitly', 'unfold', 'headache', 'eternal',
    'chop', 'ego', 'spectacular', 'deposit', 'verdict', 'accountability', 'nominate', 'civic', 'uncover', 'critique',
    'aisle', 'tropical', 'annually', 'eighth', 'blast', 'corrupt', 'compassion', 'scratch', 'verify', 'offender',
    'inherit', 'strive', 'chunk', 'appreciation', 'canvas', 'short-term', 'proceedings', 'magical', 'loyal', 'aah',
    'desperately', 'throne', 'brutal', 'spite', 'propaganda', 'irony', 'soda', 'projection', 'dutch', 'parental',
    'disabled', 'collector', 're-election', 'disappointment', 'aid', 'happily', 'steep', 'fancy', 'listener', 'whip',
    'drawer', 'heck', 'developmental', 'ash', 'socially', 'courtroom', 'stamp', 'solo', 'trainer', 'induce',
    'morality', 'syrian', 'pipeline', 'bride', 'instant', 'spark', 'doorway', 'interface', 'learner', 'casino',
    'placement', 'cord', 'conception', 'flexibility', 'thou', 'elegant', 'flaw', 'locker', 'peel', 'campaign',
    'spell', 'objective', 'plea', 'goddamn', 'import', 'stack', 'gosh', 'philosophical', 'junk', 'bicycle',
    'vocal', 'chew', 'destiny', 'ambitious', 'unbelievable', 'vice', 'halfway', 'jealous', 'sphere', 'invade',
    'excessive', 'countless', 'sunset', 'interior', 'accounting', 'faithful', 'freely', 'extract', 'adaptation', 'ray',
    'depressed', 'emperor', 'wagon', 'columnist', 'jungle', 'embarrassed', 'trillion', 'breeze', 'foster', 'venue',
    'discourage', 'disturbing', 'riot', 'isolation', 'explicit', 'commodity', 'attendance', 'tab', 'consequently', 'dough',
    'streak', 'silk', 'similarity', 'steak', 'dancing', 'petition', 'viable', 'mm', 'balloon', 'monument',
    'try', 'cue', 'sleeve', 'toll', 'reluctant', 'warrant', 'stiff', 'tattoo', 'softly', 'graduation',
    'deliberately', 'consecutive', 'upgrade', 'accurately', 'strictly', 'leak', 'casualty', 'risky', 'banana', 'blank',
    'beneficial', 'shrink', 'chat', 'rack', 'rude', 'usage', 'testament', 'browser', 'processor', 'thigh',
    'perceived', 'merchant', 'quantum', 'eyebrow', 'surrounding', 'vocabulary', 'ashamed', 'eh', 'radar', 'stunning',
    'murderer', 'burger', 'collar', 'align', 'textbook', 'sensation', 'afterward', 'charm', 'sunny', 'hammer',
    'keyboard', 'persist', 'wheat', 'predator', 'bizarre'
];

// Read the vocabulary from chunk 4
const content = fs.readFileSync('vocab_chunk4.js', 'utf8');

// Extract the vocab object
const vocabMatch = content.match(/vocab:\s*{([^}]+(?:{[^}]+}[^}]+)*?)}/s);
if (!vocabMatch) {
    console.error('Could not find vocab object from chunk 4');
    process.exit(1);
}

// Parse the existing vocabulary from chunk 4
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

console.log(`Words from chunks 1-4: ${existingEntries.length}`);

// Add new words that aren't already in the vocabulary (case-insensitive check)
let addedCount = 0;
let duplicateCount = 0;
const allEntries = [...existingEntries];

for (const word of newWords) {
    const lowerWord = word.toLowerCase();
    if (!seenWords.has(lowerWord)) {
        allEntries.push({ word: lowerWord, tokenId: 6000 + addedCount }); // Place in chunk 5 category
        seenWords.add(lowerWord);
        addedCount++;
    } else {
        duplicateCount++;
    }
}

console.log(`Chunk 5 - New words added: ${addedCount}`);
console.log(`Chunk 5 - Duplicates skipped: ${duplicateCount}`);
console.log(`Total unique words after chunk 5: ${allEntries.length}`);

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
    4500: '// Common English Words - Chunk 2 (4501+)',
    5000: '// Common English Words - Chunk 3 (5001+)',
    5500: '// Common English Words - Chunk 4 (5501+)',
    6000: '// Common English Words - Chunk 5 (6001+)'
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
fs.writeFileSync('vocab_final.js', outputLines.join('\n'));
console.log(`\nFinal vocabulary saved to vocab_final.js`);
console.log(`Final vocabulary size: ${currentTokenId} unique tokens`);