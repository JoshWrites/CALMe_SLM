// Script to merge frequency words with vocabulary - Chunk 4 (words 1501-2000)
const fs = require('fs');

// Fourth chunk of frequency words (words 1501-2000)
const newWords = [
    'inspire', 'separate', 'noise', 'yellow', 'aim', 'e-mail', 'cycle', 'signal', 'app', 'golden',
    'reject', 'inform', 'perception', 'visitor', 'cast', 'contrast', 'judgment', 'representative', 'regime', 'merely',
    'producer', 'whoa', 'route', 'typical', 'analyst', 'elect', 'living', 'disability', 'comparison', 'rating',
    'campus', 'assess', 'solid', 'branch', 'mad', 'somewhat', 'gentleman', 'opposition', 'suspect', 'hit',
    'aside', 'athlete', 'opening', 'prayer', 'frequently', 'employ', 'basketball', 'existing', 'revolution', 'click',
    'emotion', 'platform', 'frame', 'appeal', 'quote', 'potential', 'struggle', 'brand', 'enable', 'legislation',
    'addition', 'lab', 'oppose', 'row', 'immigration', 'asset', 'observation', 'taste', 'decline', 'attract',
    'ha', 'household', 'breathe', 'existence', 'mirror', 'pilot', 'stand', 'relief', 'warning', 'heaven',
    'flow', 'literally', 'quit', 'calorie', 'seed', 'vast', 'bike', 'german', 'employer', 'drag',
    'technical', 'disaster', 'display', 'sale', 'bathroom', 'succeed', 'consistent', 'agenda', 'enforcement', 'diet',
    'silence', 'journalist', 'bible', 'queen', 'divide', 'expense', 'cream', 'exposure', 'priority', 'soil',
    'angel', 'journey', 'relevant', 'tank', 'cheese', 'schedule', 'bedroom', 'tone', 'selection', 'perfectly',
    'wheel', 'gap', 'veteran', 'disagree', 'characteristic', 'protein', 'resolution', 'regard', 'fewer', 'engineer',
    'dish', 'waste', 'print', 'depression', 'dude', 'present', 'upper', 'wrap', 'ceo', 'visual',
    'initiative', 'rush', 'gate', 'whenever', 'entry', 'japanese', 'gray', 'assistance', 'height', 'compete',
    'rule', 'essentially', 'phase', 'recover', 'criticism', 'faculty', 'achievement', 'alcohol', 'therapy', 'offense',
    'killer', 'personality', 'landscape', 'deeply', 'reasonable', 'suck', 'transition', 'fairly', 'column', 'wash',
    'button', 'opponent', 'pour', 'immigrant', 'distribution', 'golf', 'pregnant', 'unable', 'alternative', 'violent',
    'portion', 'acquire', 'suicide', 'stretch', 'deficit', 'symptom', 'solar', 'complaint', 'capable', 'analyze',
    'scared', 'supporter', 'dig', 'twenty', 'pretend', 'philosophy', 'childhood', 'lower', 'outside', 'wealth',
    'welfare', 'poverty', 'prosecutor', 'spiritual', 'double', 'evaluate', 'israeli', 'reply', 'buck', 'knife',
    'round', 'tech', 'detective', 'pack', 'disorder', 'creature', 'closely', 'industrial', 'housing', 'chip',
    'regardless', 'numerous', 'command', 'shooting', 'dozen', 'pop', 'layer', 'bread', 'exception', 'passion',
    'highway', 'pure', 'commander', 'extreme', 'publication', 'vice', 'fellow', 'win', 'mystery', 'championship',
    'install', 'tale', 'liberty', 'beneath', 'passenger', 'physician', 'graduate', 'sharp', 'substance', 'atmosphere',
    'stir', 'muslim', 'passage', 'pepper', 'emphasize', 'cable', 'square', 'recipe', 'load', 'beside',
    'roof', 'vegetable', 'accomplish', 'silent', 'habit', 'discovery', 'recovery', 'dna', 'territory', 'girlfriend',
    'consist', 'surely', 'proof', 'nervous', 'immediate', 'sin', 'unusual', 'rice', 'engineering', 'advance',
    'bury', 'cake', 'anonymous', 'flag', 'contemporary', 'jail', 'rural', 'coach', 'interpretation', 'wage',
    'breakfast', 'severe', 'profile', 'saving', 'brief', 'adjust', 'reduction', 'constantly', 'assist', 'bitch',
    'constant', 'permit', 'primarily', 'entertainment', 'shout', 'academy', 'teaspoon', 'transfer', 'usual', 'ally',
    'clinical', 'swear', 'avenue', 'priest', 'employment', 'waste', 'relax', 'owe', 'transform', 'grass',
    'narrow', 'ethnic', 'scholar', 'edition', 'abandon', 'practical', 'infection', 'musical', 'suggestion', 'resistance',
    'smoke', 'prince', 'illness', 'embrace', 'republic', 'volunteer', 'evaluation', 'opposite', 'awesome', 'switch',
    'iraqi', 'iron', 'perceive', 'fundamental', 'phrase', 'assumption', 'sand', 'designer', 'leading', 'mode',
    'widely', 'occasion', 'pose', 'approximately', 'retire', 'elsewhere', 'festival', 'cap', 'secure', 'attach',
    'mechanism', 'intention', 'scenario', 'yell', 'incredible', 'spanish', 'strongly', 'racial', 'transportation', 'pot',
    'boyfriend', 'consideration', 'prior', 'retirement', 'rarely', 'joint', 'preserve', 'enormous', 'cigarette', 'factory',
    'valuable', 'clip', 'electric', 'giant', 'slave', 'submit', 'effectively', 'monitor', 'wonder', 'resolve',
    'remaining', 'participation', 'stream', 'rid', 'origin', 'teen', 'congressional', 'bind', 'coat', 'tower',
    'license', 'twitter', 'impose', 'innocent', 'curriculum', 'mail', 'insight', 'investigator', 'virus', 'hurricane',
    'accurate', 'provision', 'communicate', 'vary', 'jacket', 'increasing', 'equally', 'implication', 'fiction', 'protest',
    'mama', 'imply', 'twin', 'pant', 'ahead', 'bend', 'shock', 'criteria', 'arab', 'dirty',
    'toy', 'potentially', 'assault', 'peak', 'anger', 'boot', 'dramatic', 'peer', 'enhance', 'math',
    'slide', 'favor', 'pink', 'dust', 'aunt', 'lost', 'prospect', 'mood', 'mm-hmm', 'settlement',
    'justify', 'depth', 'juice', 'formal', 'virtually', 'gallery', 'tension', 'throat', 'draft', 'reputation',
    'index', 'normally', 'mess', 'joy', 'steel', 'motor', 'enterprise', 'salary', 'moreover', 'giant',
    'cousin', 'ordinary', 'evolution', 'so-called', 'helpful', 'competitive', 'lovely', 'fishing', 'anxiety', 'professional',
    'carbon', 'essay', 'islamic', 'drama', 'odd', 'evil', 'stranger', 'belt', 'urge', 'toss',
    'fifth', 'formula', 'potato', 'monster', 'telephone', 'rape', 'palm', 'jet', 'navy', 'excited',
    'plot', 'angle', 'criticize', 'prisoner', 'discipline', 'negotiation', 'damn', 'butter', 'desert', 'complicated',
    'prize', 'blind', 'assign', 'bullet', 'awareness', 'sequence', 'illustrate', 'provider', 'fucking', 'minor',
    'activist', 'poem', 'vacation', 'weigh', 'gang', 'privacy', 'clock', 'arrange', 'penalty', 'stomach',
    'concert', 'originally', 'statistics', 'electronic', 'properly', 'bureau', 'wolf', 'and/or', 'classic', 'recommendation',
    'exciting', 'maker', 'dear', 'impression', 'broken', 'battery', 'narrative', 'arise', 'sake', 'delivery',
    'forgive', 'visible', 'heavily', 'junior', 'rep', 'diversity', 'string', 'lawsuit', 'latter', 'cute',
    'deputy', 'restore', 'buddy', 'psychological', 'besides', 'intense', 'friendly', 'lane', 'bean', 'sauce',
    'dominate', 'testing', 'trick', 'fantasy', 'absence', 'offensive', 'symbol', 'recognition', 'detect', 'tablespoon',
    'construct', 'hmm', 'arrest', 'approval', 'aids', 'whereas', 'defensive', 'independence', 'apologize', 'asian',
    'rose', 'ghost', 'involvement', 'permanent', 'wire', 'whisper', 'mouse', 'airline', 'founder', 'objective',
    'nowhere', 'phenomenon', 'evolve', 'exact', 'silver', 'cent', 'universal', 'teenager', 'crucial', 'viewer',
    'ridiculous', 'chocolate', 'sensitive', 'grandmother', 'missile', 'roughly', 'constitutional', 'adventure', 'genetic', 'related',
    'swing', 'ultimate', 'manufacturer', 'unknown', 'wipe', 'crop', 'survival', 'dimension', 'resist', 'darkness',
    'guarantee', 'historic', 'educator', 'rough', 'personnel', 'confront', 'terrorist', 'royal', 'elite', 'occupy',
    'emphasis', 'wet', 'destruction', 'raw', 'inner', 'proceed', 'violate', 'chart', 'pace', 'finance',
    'champion', 'snap', 'advise', 'initially', 'advanced', 'unlikely', 'barrier', 'advocate', 'horrible', 'burden',
    'violation', 'unlike', 'idiot', 'lifetime', 'working', 'fund', 'ongoing', 'react', 'routine', 'presentation',
    'gear', 'mexican', 'stadium', 'translate', 'mortgage', 'sheriff', 'clinic', 'spin', 'coalition', 'naturally',
    'hopefully', 'menu', 'smooth', 'advertising', 'interpret', 'plant', 'dismiss', 'apparent', 'arrangement', 'incorporate',
    'split', 'brilliant', 'storage', 'framework', 'honestly', 'chase', 'sigh', 'assure', 'utility', 'aggressive',
    'cookie', 'terror', 'wealthy', 'update', 'forum', 'alliance', 'possess', 'empire', 'curious', 'corn',
    'calculate', 'hurry', 'testimony', 'elementary', 'stake', 'precisely', 'bite', 'given', 'substantial', 'depending',
    'glance', 'tissue', 'concentration', 'developer', 'found', 'ballot', 'consume', 'overcome', 'biological', 'chamber',
    'similarly', 'stick', 'dare', 'developing', 'tiger', 'ratio', 'lover', 'expansion', 'encounter', 'occasionally',
    'unemployment', 'pet', 'awful', 'laboratory', 'administrator', 'quarterback', 'rocket', 'preparation', 'relative', 'confident',
    'strategic', 'marine', 'publisher', 'innovation', 'highlight', 'nut', 'fighter', 'rank', 'electricity', 'instance',
    'fortune', 'freeze', 'variation', 'armed', 'negotiate', 'laughter', 'wisdom', 'correspondent', 'mixture', 'retain',
    'tomato', 'testify', 'ingredient', 'galaxy', 'qualify', 'scheme', 'gop', 'shame', 'concentrate', 'contest',
    'introduction', 'boundary', 'tube', 'versus', 'chef', 'regularly', 'ugly', 'screw', 'tongue', 'palestinian',
    'fiscal', 'creek', 'hip', 'accompany', 'terrorism', 'respondent', 'narrator', 'voting', 'refugee', 'assembly',
    'fraud', 'limitation', 'partnership', 'crash', 'representation', 'ministry', 'flat', 'wise', 'register', 'comedy',
    'tap', 'infrastructure', 'organic', 'islam', 'diverse', 'intellectual', 'tight', 'port', 'fate', 'absolute',
    'dialogue', 'frequency', 'tribe', 'external', 'appointment', 'convert', 'surprising', 'mobile', 'establishment', 'worried',
    'bye', 'shopping', 'celebrity', 'congressman', 'impress', 'taxpayer', 'adapt', 'publicly', 'pride', 'clothing',
    'rapidly', 'domain', 'mainly', 'ceiling', 'alter', 'shelter', 'random', 'obligation', 'shower', 'beg',
    'asleep', 'musician', 'extraordinary', 'dirt', 'pc', 'bell', 'ceremony', 'clue', 'guideline', 'comfort',
    'pregnancy', 'borrow', 'conventional', 'tourist', 'incentive', 'custom', 'cheek', 'tournament', 'satellite', 'nearby',
    'comprehensive', 'stable', 'medication', 'script', 'educate', 'efficient', 'welcome', 'scare', 'psychology', 'logic',
    'economics', 'nevertheless', 'devil', 'thirty', 'beat', 'charity', 'fiber', 'ideal', 'friendship', 'net',
    'motivation', 'differently', 'reserve', 'observer', 'humanity', 'survivor', 'fence', 'quietly', 'humor', 'funeral',
    'spokesman', 'extension', 'loose', 'sink', 'historian', 'ruin', 'chemical', 'singer', 'drunk', 'swim',
    'onion', 'specialist', 'missing', 'pan', 'distribute', 'silly', 'deck', 'reflection', 'shortly', 'database',
    'remote', 'permission', 'remarkable', 'everyday', 'lifestyle', 'sweep', 'naked', 'sufficient', 'lion', 'consumption',
    'capability', 'practice', 'emission', 'sidebar', 'crap', 'dealer', 'measurement', 'vital', 'impressive', 'bake',
    'fantastic', 'adviser', 'yield', 'mere', 'imagination', 'radical', 'tragedy', 'scary', 'consultant', 'lieutenant',
    'upset', 'attractive', 'acre', 'drawing', 'defeat', 'newly', 'scandal', 'ambassador', 'ooh', 'content',
    'bench', 'guide', 'counter', 'chemical', 'odds', 'rat', 'horror', 'vulnerable', 'prevention', 'segment',
    'ban', 'tail', 'constitute', 'badly', 'bless', 'literary', 'magic', 'implementation', 'legitimate', 'slight',
    'strip', 'desperate', 'distant', 'preference', 'politically', 'feedback', 'health-care', 'italian', 'detailed', 'buyer',
    'cooperation', 'profession', 'incredibly', 'orange', 'killing', 'sue', 'photographer', 'running', 'engagement', 'differ',
    'pitch', 'extensive', 'salad', 'stair', 'grace', 'divorce', 'vessel', 'pig', 'assignment', 'distinction',
    'circuit', 'acid', 'canadian', 'flee', 'efficiency', 'memorial', 'proposed', 'entity', 'iphone', 'punishment',
    'pause', 'pill', 'rub', 'romantic', 'myth', 'economist', 'latin', 'decent', 'craft', 'poetry',
    'thread', 'wooden', 'confuse', 'privilege', 'coal', 'fool', 'cow', 'characterize', 'pie', 'decrease',
    'resort', 'legacy', 're', 'frankly', 'cancel', 'derive', 'dumb', 'scope', 'formation', 'grandfather',
    'hence', 'wish', 'margin', 'wound', 'exhibition', 'legislature', 'furthermore', 'portrait', 'sustain', 'uniform',
    'painful', 'loud', 'miracle', 'harm', 'zero', 'tactic', 'mask', 'calm', 'inflation', 'hunting',
    'physically', 'flesh', 'temporary', 'fellow', 'nerve', 'lung', 'steady', 'headline', 'sudden', 'successfully',
    'defendant', 'pole', 'satisfy', 'entrance', 'aircraft', 'withdraw', 'cabinet', 'repeatedly', 'happiness', 'admission',
    'correlation', 'proportion', 'dispute', 'candy', 'reward', 'counselor', 'recording', 'pile', 'explosion', 'appoint',
    'couch', 'cognitive', 'furniture', 'significance', 'grateful', 'suit', 'commissioner', 'shelf', 'tremendous', 'warrior',
    'physics', 'garage', 'flavor', 'squeeze', 'prominent', 'fifty', 'fade', 'oven', 'satisfaction', 'discrimination',
    'recession', 'allegation', 'boom', 'weekly', 'lately', 'restriction', 'diamond', 'document', 'crack', 'conviction',
    'heel', 'fake', 'fame', 'shine', 'playoff', 'actress', 'cheat', 'format', 'controversy', 'auto',
    'grocery', 'headquarters', 'rip', 'shade', 'regulate', 'meter', 'olympic', 'pipe', 'celebration', 'handful',
    'copyright', 'dependent', 'signature', 'bishop', 'strengthen', 'soup', 'entitle', 'whoever', 'carrier', 'anniversary',
    'pizza', 'ethics', 'legend', 'eagle', 'scholarship', 'membership', 'standing', 'possession', 'treaty', 'partly',
    'consciousness', 'manufacturing', 'announcement', 'tire', 'makeup', 'prediction', 'stability', 'trace', 'norm', 'irish',
    'genius', 'gently', 'operator', 'mall', 'rumor', 'poet', 'tendency', 'subsequent', 'alien', 'explode',
    'controversial', 'maintenance', 'courage', 'exceed', 'principal', 'vaccine', 'identification', 'sandwich', 'bull', 'lens',
    'twelve', 'mainstream', 'presidency', 'integrity', 'distinct', 'intelligent', 'secondary', 'bias', 'hypothesis', 'fifteen',
    'nomination', 'delay', 'adjustment', 'sanction', 'render', 'acceptable', 'mutual', 'examination', 'meaningful', 'communist',
    'superior', 'currency', 'collective', 'flame', 'guitar', 'doctrine', 'float', 'commerce', 'invent', 'robot',
    'rapid', 'plain', 'respectively', 'particle', 'glove', 'till', 'edit', 'moderate', 'jazz', 'infant',
    'summary', 'server', 'leather', 'radiation', 'prompt', 'composition', 'operating', 'assert', 'discourse', 'dump',
    'wildlife', 'soccer', 'complex', 'mandate', 'downtown', 'nightmare', 'barrel', 'homeless', 'globe', 'uncomfortable',
    'execute', 'trap', 'gesture', 'pale', 'tent', 'receiver', 'horizon', 'diagnosis', 'considerable', 'gospel',
    'automatically', 'stroke', 'wander', 'duck', 'grain', 'beast', 'remark', 'fabric', 'civilization', 'corruption',
    'collapse', 'ma\'am', 'greatly', 'workshop', 'inquiry', 'cd', 'admire', 'exclude', 'rifle', 'closet',
    'reporting', 'curve', 'patch', 'touchdown', 'experimental', 'earnings', 'hunter', 'tunnel', 'corps', 'behave',
    'motivate', 'attribute', 'elderly', 'virtual', 'minimum', 'weakness', 'progressive', 'doc', 'medium', 'virtue',
    'ounce', 'athletic', 'confusion', 'legislative', 'facilitate', 'midnight', 'deer', 'undergo', 'heritage', 'summit',
    'sword', 'telescope', 'donate', 'blade', 'toe', 'agriculture', 'enforce', 'recruit', 'dose', 'concerning',
    'integrate', 'prescription', 'retail', 'adoption', 'monthly', 'deadly', 'grave', 'rope', 'reliable', 'transaction',
    'lawn', 'consistently', 'mount', 'bubble', 'briefly', 'absorb', 'princess', 'log', 'blanket', 'kingdom'
];

// Read the vocabulary from chunk 3
const content = fs.readFileSync('vocab_chunk3.js', 'utf8');

// Extract the vocab object
const vocabMatch = content.match(/vocab:\s*{([^}]+(?:{[^}]+}[^}]+)*?)}/s);
if (!vocabMatch) {
    console.error('Could not find vocab object from chunk 3');
    process.exit(1);
}

// Parse the existing vocabulary from chunk 3
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

console.log(`Words from chunks 1-3: ${existingEntries.length}`);

// Add new words that aren't already in the vocabulary (case-insensitive check)
let addedCount = 0;
let duplicateCount = 0;
const allEntries = [...existingEntries];

for (const word of newWords) {
    const lowerWord = word.toLowerCase();
    if (!seenWords.has(lowerWord)) {
        allEntries.push({ word: lowerWord, tokenId: 5500 + addedCount }); // Place in chunk 4 category
        seenWords.add(lowerWord);
        addedCount++;
    } else {
        duplicateCount++;
    }
}

console.log(`Chunk 4 - New words added: ${addedCount}`);
console.log(`Chunk 4 - Duplicates skipped: ${duplicateCount}`);
console.log(`Total unique words after chunk 4: ${allEntries.length}`);

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
    5500: '// Common English Words - Chunk 4 (5501+)'
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
fs.writeFileSync('vocab_chunk4.js', outputLines.join('\n'));
console.log(`\nChunk 4 vocabulary saved to vocab_chunk4.js`);
console.log(`Final vocabulary size after chunk 4: ${currentTokenId} unique tokens`);