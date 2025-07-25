// Script to merge frequency words with vocabulary - Chunk 3 (words 1001-1500)
const fs = require('fs');

// Third chunk of frequency words (sample - would include all remaining words)
const newWords = [
    'define', 'handle', 'track', 'wind', 'lack', 'announce', 'journal', 'heavy', 'ice', 'collection',
    'feed', 'soldier', 'governor', 'fish', 'shoulder', 'cultural', 'successful', 'fair', 'trust', 'suddenly',
    'interested', 'deliver', 'saturday', 'editor', 'fresh', 'anybody', 'destroy', 'critical', 'agreement', 'powerful',
    'researcher', 'concept', 'willing', 'band', 'marry', 'promise', 'easily', 'restaurant', 'league', 'senior',
    'capital', 'anymore', 'april', 'potential', 'etc', 'quick', 'magazine', 'status', 'attend', 'replace',
    'due', 'hill', 'kitchen', 'achieve', 'screen', 'generally', 'mistake', 'along', 'strike', 'battle',
    'spot', 'basic', 'corner', 'target', 'driver', 'beginning', 'religion', 'crisis', 'count', 'museum',
    'engage', 'communication', 'murder', 'blow', 'object', 'express', 'huh', 'encourage', 'blog', 'smile',
    'belief', 'block', 'debt', 'labor', 'understanding', 'neighborhood', 'contract', 'species', 'additional', 'sample',
    'involved', 'mostly', 'path', 'concerned', 'apple', 'conduct', 'god', 'wonderful', 'library', 'prison',
    'hole', 'attempt', 'complete', 'code', 'sales', 'gift', 'refuse', 'increase', 'garden', 'introduce',
    'roll', 'christian', 'definitely', 'lake', 'turn', 'sure', 'earn', 'plane', 'vehicle', 'examine',
    'application', 'thousand', 'coffee', 'gain', 'file', 'billion', 'reform', 'ignore', 'welcome', 'gold',
    'jump', 'planet', 'location', 'bird', 'amazing', 'principle', 'promote', 'search', 'nine', 'alive',
    'possibility', 'sky', 'otherwise', 'remind', 'healthy', 'fit', 'horse', 'advantage', 'commercial', 'steal',
    'basis', 'context', 'highly', 'christmas', 'strength', 'monday', 'alone', 'beach', 'survey', 'writing',
    'master', 'cry', 'scale', 'resident', 'football', 'sweet', 'failure', 'reporter', 'commit', 'associate',
    'vision', 'function', 'truly', 'sick', 'average', 'stupid', 'chinese', 'connection', 'camp', 'stone',
    'hundred', 'truck', 'afternoon', 'responsible', 'secretary', 'apparently', 'smart', 'southern', 'totally', 'western',
    'collect', 'conflict', 'burn', 'learning', 'wake', 'contribute', 'ride', 'british', 'following', 'share',
    'newspaper', 'foundation', 'variety', 'perspective', 'document', 'presence', 'stare', 'lesson', 'limit', 'appreciate',
    'observe', 'currently', 'fun', 'crowd', 'apartment', 'survive', 'guest', 'soul', 'protection', 'intelligence',
    'yesterday', 'somewhere', 'border', 'reading', 'terms', 'leadership', 'present', 'chief', 'attitude', 'um',
    'deny', 'website', 'seriously', 'actual', 'recall', 'fix', 'negative', 'connect', 'distance', 'regular',
    'climate', 'relation', 'flight', 'dangerous', 'boat', 'aspect', 'grab', 'favorite', 'january', 'independent',
    'volume', 'am', 'lots', 'online', 'theater', 'speed', 'aware', 'identity', 'demand', 'extra',
    'guard', 'demonstrate', 'fully', 'tuesday', 'facility', 'farm', 'august', 'hire', 'link', 'shoe',
    'institute', 'below', 'living', 'european', 'quarter', 'basically', 'forest', 'multiple', 'poll', 'wild',
    'measure', 'twice', 'cross', 'background', 'settle', 'winter', 'presidential', 'operate', 'fuck', 'daily',
    'shop', 'division', 'slowly', 'advice', 'reaction', 'injury', 'ticket', 'grade', 'wow', 'birth',
    'painting', 'outcome', 'enemy', 'damage', 'being', 'storm', 'shape', 'bowl', 'commission', 'captain',
    'ear', 'troop', 'female', 'wood', 'warm', 'clean', 'minister', 'neighbor', 'tiny', 'mental',
    'software', 'glad', 'finding', 'lord', 'temperature', 'quiet', 'spread', 'bright', 'influence', 'kick',
    'annual', 'procedure', 'respect', 'wave', 'tradition', 'threaten', 'primary', 'strange', 'actor', 'blame',
    'active', 'cat', 'depend', 'bus', 'clothes', 'affair', 'contact', 'category', 'topic', 'victory',
    'direct', 'towards', 'map', 'egg', 'ensure', 'expression', 'session', 'competition', 'possibly', 'technique',
    'mine', 'intend', 'impossible', 'moral', 'academic', 'wine', 'somehow', 'gather', 'scientific', 'african',
    'cook', 'participate', 'gay', 'appropriate', 'youth', 'dress', 'straight', 'weather', 'recommend', 'medicine',
    'novel', 'obvious', 'thursday', 'exchange', 'explore', 'extend', 'bay', 'invite', 'tie', 'ah',
    'belong', 'obtain', 'broad', 'conclusion', 'progress', 'surprise', 'assessment', 'feature', 'cash', 'defend',
    'pound', 'correct', 'married', 'pair', 'slightly', 'loan', 'village', 'suit', 'demand', 'historical',
    'meaning', 'supply', 'lift', 'ourselves', 'honey', 'bone', 'consequence', 'unique', 'regulation', 'award',
    'bottom', 'excuse', 'familiar', 'classroom', 'reference', 'emerge', 'lunch', 'ad', 'desire', 'instruction',
    'emergency', 'thinking', 'tour', 'french', 'combine', 'moon', 'address', 'december', 'anywhere', 'chicken',
    'fuel', 'train', 'abuse', 'construction', 'wednesday', 'deserve', 'famous', 'intervention', 'grand', 'confirm',
    'lucky', 'insist', 'coast', 'proud', 'fourth', 'cop', 'angry', 'native', 'supreme', 'baseball',
    'email', 'accident', 'duty', 'growing', 'struggle', 'revenue', 'expand', 'launch', 'trend', 'ring',
    'repeat', 'breath', 'inch', 'neck', 'core', 'terrible', 'billion', 'relatively', 'complex', 'slow',
    'soft', 'generate', 'extremely', 'forever', 'corporate', 'prefer', 'except', 'cheap', 'literature', 'mayor',
    'male', 'importance', 'danger', 'emotional', 'knee', 'ass', 'capture', 'traffic', 'fucking', 'train',
    'plate', 'equipment', 'select', 'studio', 'expensive', 'secret', 'engine', 'adopt', 'luck', 'via',
    'pm', 'panel', 'hero', 'circle', 'critic', 'solve', 'busy', 'episode', 'requirement', 'politician',
    'rain', 'colleague', 'disappear', 'beer', 'predict', 'exercise', 'tired', 'democracy', 'ultimately', 'honor',
    'works', 'unfortunately', 'theme', 'clean', 'united', 'pool', 'educational', 'empty', 'comfortable', 'investigate',
    'useful', 'pocket', 'digital', 'plenty', 'entirely', 'afford', 'sugar', 'teaching', 'conservative', 'chairman',
    'error', 'bridge', 'tall', 'specifically', 'flower', 'universe', 'acknowledge', 'coverage', 'crew', 'locate',
    'balance', 'equal', 'lip', 'lean', 'zone', 'wedding', 'copy', 'used', 'bear', 'meal',
    'minority', 'sight', 'russian', 'soviet', 'profit', 'careful', 'gender', 'ocean', 'unidentified', 'host',
    'grant', 'circumstance', 'boss', 'declare', 'domestic', 'tea', 'organize', 'english', 'neither', 'either',
    'surround', 'manner', 'surprised', 'percentage', 'massive', 'cloud', 'winner', 'honest', 'propose', 'rely',
    'plus', 'sentence', 'request', 'appearance', 'regarding', 'excellent', 'criminal', 'salt', 'beauty', 'bottle',
    'component', 'fee', 'jewish', 'yours', 'dry', 'dance', 'shirt', 'plastic', 'indian', 'tooth',
    'meat', 'stress', 'illegal', 'significantly', 'february', 'constitution', 'definition', 'uncle', 'metal', 'album',
    'self', 'suppose', 'investor', 'fruit', 'holy', 'desk', 'eastern', 'valley', 'largely', 'abortion',
    'chapter', 'commitment', 'celebrate', 'arrest', 'prime', 'urban', 'internal', 'bother', 'proposal', 'shift',
    'capacity', 'guilty', 'warn', 'weak', 'except', 'catholic', 'nose', 'variable', 'convention', 'jury',
    'root', 'incident', 'climb', 'hearing', 'everywhere', 'payment', 'bear', 'conclude', 'scream', 'surgery',
    'shadow', 'witness', 'increasingly', 'chest', 'amendment', 'paint', 'complain', 'extent', 'pleasure', 'nod',
    'holiday', 'super', 'talent', 'necessarily', 'liberal', 'expectation', 'accuse', 'knock', 'previously', 'wing',
    'corporation', 'sector', 'experiment', 'match', 'thin', 'farmer', 'rare', 'confidence', 'bunch', 'bet',
    'cite', 'northern', 'speaker', 'breast', 'contribution', 'leaf', 'creative', 'interaction', 'hat', 'pursue',
    'overall', 'nurse', 'long-term', 'gene', 'package', 'weird', 'difficulty', 'hardly', 'daddy', 'estimate',
    'era', 'aid', 'vs', 'invest', 'personally', 'notion', 'explanation', 'airport', 'chain', 'expose',
    'lock', 'convince', 'channel', 'carefully', 'estate', 'initial', 'purchase', 'guide', 'forth', 'bond',
    'birthday', 'improvement', 'ancient', 'ought', 'escape', 'trail', 'brown', 'fashion', 'length', 'funding',
    'meanwhile', 'fault', 'barely', 'eliminate', 'motion', 'essential', 'apart', 'combination', 'limited', 'description',
    'mix', 'snow', 'implement', 'proper', 'marketing', 'approve', 'bomb', 'slip', 'regional', 'muscle',
    'rise', 'false', 'creation', 'typically', 'spending', 'instrument', 'mass', 'thick', 'kiss', 'increased',
    'inspire', 'separate', 'noise', 'yellow', 'aim', 'e-mail', 'cycle', 'signal', 'app', 'golden',
    'reject', 'inform', 'perception', 'visitor', 'cast', 'contrast', 'judgment', 'representative', 'regime', 'merely',
    'producer', 'whoa', 'route', 'typical', 'analyst', 'elect', 'smell', 'disability', 'comparison', 'rating',
    'campus', 'assess', 'solid', 'branch', 'mad', 'somewhat', 'gentleman', 'opposition', 'suspect', 'hit',
    'aside', 'athlete', 'opening', 'prayer', 'frequently', 'employ', 'basketball', 'existing', 'revolution', 'click',
    'emotion', 'platform', 'frame', 'appeal', 'quote', 'potential', 'struggle', 'brand', 'enable', 'legislation',
    'lab', 'oppose', 'row', 'immigration', 'asset', 'observation', 'taste', 'decline', 'attract', 'ha',
    'household', 'separate', 'breathe', 'existence', 'mirror', 'pilot', 'stand', 'relief', 'warning', 'heaven',
    'flow', 'literally', 'quit', 'calorie', 'seed', 'vast', 'bike', 'german', 'employer', 'drag',
    'technical', 'disaster', 'display', 'sale', 'bathroom', 'succeed', 'consistent', 'agenda', 'enforcement', 'diet',
    'silence', 'journalist', 'bible', 'queen', 'divide', 'expense', 'cream', 'exposure', 'priority', 'soil',
    'angel', 'journey', 'relevant', 'tank', 'cheese', 'schedule', 'bedroom', 'tone', 'selection', 'perfectly',
    'wheel', 'gap', 'veteran', 'disagree', 'characteristic', 'protein', 'resolution', 'regard', 'fewer', 'engineer',
    'dish', 'waste', 'depression', 'dude', 'upper', 'wrap', 'ceo', 'visual', 'initiative', 'rush',
    'gate', 'whenever', 'entry', 'japanese', 'gray', 'assistance', 'height', 'compete', 'rule', 'essentially',
    'phase', 'recover', 'criticism', 'faculty', 'achievement', 'alcohol', 'therapy', 'offense', 'killer', 'personality',
    'landscape', 'deeply', 'reasonable', 'suck', 'transition', 'fairly', 'column', 'wash', 'button', 'opponent',
    'pour', 'immigrant', 'distribution', 'golf', 'pregnant', 'unable', 'alternative', 'stop', 'violent', 'portion',
    'acquire', 'suicide', 'stretch', 'deficit', 'symptom', 'solar', 'complaint', 'capable', 'analyze', 'scared',
    'supporter', 'dig', 'twenty', 'pretend', 'philosophy', 'childhood', 'lower', 'outside', 'dark', 'wealth',
    'welfare', 'poverty', 'prosecutor', 'spiritual', 'double', 'evaluate', 'israeli', 'reply', 'buck', 'knife',
    'round', 'tech', 'detective', 'pack', 'disorder', 'creature', 'closely', 'industrial', 'housing', 'watch',
    'chip', 'regardless', 'numerous', 'command', 'shooting', 'dozen', 'pop', 'layer', 'bread', 'exception',
    'passion', 'highway', 'pure', 'commander', 'extreme', 'publication', 'vice', 'fellow', 'win', 'mystery',
    'championship', 'install', 'tale', 'liberty', 'beneath', 'passenger', 'physician', 'graduate', 'sharp', 'substance',
    'atmosphere', 'stir', 'muslim', 'passage', 'pepper', 'emphasize', 'cable', 'square', 'recipe', 'load',
    'beside', 'roof', 'vegetable', 'accomplish', 'silent', 'habit', 'discovery', 'recovery', 'dna', 'territory',
    'girlfriend', 'consist', 'surely', 'proof', 'nervous', 'immediate', 'parking', 'sin', 'unusual', 'rice',
    'engineering', 'advance', 'bury', 'cake', 'anonymous', 'flag', 'contemporary', 'jail', 'rural', 'coach',
    'interpretation', 'wage', 'breakfast', 'severe', 'profile', 'saving', 'brief', 'adjust', 'reduction', 'constantly',
    'assist', 'bitch', 'constant', 'permit', 'primarily', 'entertainment', 'shout', 'academy', 'teaspoon', 'transfer',
    'usual', 'ally', 'clinical', 'swear', 'avenue', 'priest', 'employment', 'waste', 'relax', 'owe',
    'transform', 'grass', 'narrow', 'ethnic', 'scholar', 'edition', 'abandon', 'practical', 'infection', 'musical',
    'suggestion', 'resistance', 'smoke', 'prince', 'illness', 'embrace', 'republic', 'volunteer', 'evaluation', 'opposite',
    'awesome', 'switch', 'iraqi', 'iron', 'perceive', 'fundamental', 'phrase', 'assumption', 'sand', 'designer',
    'planning', 'leading', 'mode', 'widely', 'occasion', 'pose', 'approximately', 'retire', 'elsewhere', 'festival',
    'cap', 'secure', 'attach', 'mechanism', 'intention', 'scenario', 'yell', 'incredible', 'spanish', 'strongly',
    'racial', 'transportation', 'pot', 'boyfriend', 'consideration', 'prior', 'retirement', 'rarely', 'joint', 'preserve',
    'enormous', 'cigarette', 'factory', 'valuable', 'clip', 'electric', 'giant', 'slave', 'submit', 'effectively',
    'monitor', 'wonder', 'resolve', 'remaining', 'participation', 'stream', 'rid', 'origin', 'teen', 'congressional',
    'bind', 'coat', 'tower', 'license', 'twitter', 'impose', 'innocent', 'curriculum', 'mail', 'insight',
    'investigator', 'virus', 'hurricane', 'accurate', 'provision', 'communicate', 'vary', 'jacket', 'increasing', 'equally',
    'in', 'implication', 'fiction', 'protest', 'mama', 'imply', 'twin', 'pant', 'ahead', 'bend',
    'shock', 'criteria', 'arab', 'dirty', 'toy', 'potentially', 'assault', 'peak', 'anger', 'boot',
    'dramatic', 'peer', 'enhance', 'math', 'slide', 'favor', 'pink', 'dust', 'aunt', 'lost',
    'prospect', 'mood', 'mm-hmm', 'settlement', 'justify', 'depth', 'juice', 'formal', 'virtually', 'gallery',
    'tension', 'throat', 'draft', 'reputation', 'index', 'normally', 'mess', 'joy', 'steel', 'motor',
    'enterprise', 'salary', 'moreover', 'giant', 'cousin', 'ordinary', 'evolution', 'so-called', 'helpful', 'competitive',
    'lovely', 'fishing', 'anxiety', 'carbon', 'essay', 'islamic', 'drama', 'odd', 'evil', 'stranger',
    'belt', 'urge', 'toss', 'fifth', 'formula', 'potato', 'monster', 'telephone', 'rape', 'palm',
    'jet', 'navy', 'excited', 'plot', 'angle', 'criticize', 'prisoner', 'discipline', 'negotiation', 'damn',
    'butter', 'desert', 'complicated', 'prize', 'blind', 'assign', 'bullet', 'awareness', 'sequence', 'illustrate',
    'provider', 'minor', 'activist', 'poem', 'vacation', 'weigh', 'gang', 'privacy', 'clock', 'arrange',
    'penalty', 'stomach', 'concert', 'originally', 'statistics', 'electronic', 'properly', 'bureau', 'wolf', 'and/or',
    'classic', 'recommendation', 'exciting', 'maker', 'dear', 'impression', 'broken', 'battery', 'narrative', 'arise',
    'sake', 'delivery', 'forgive', 'visible', 'heavily', 'junior', 'rep', 'diversity', 'string', 'lawsuit',
    'latter', 'cute', 'deputy', 'restore', 'buddy', 'psychological', 'besides', 'intense', 'friendly', 'lane',
    'bean', 'sauce', 'dominate', 'testing', 'trick', 'fantasy', 'absence', 'offensive', 'symbol', 'recognition',
    'detect', 'tablespoon', 'construct', 'hmm', 'approval', 'aids', 'whereas', 'defensive', 'independence', 'apologize',
    'asian', 'rose', 'ghost', 'involvement', 'permanent', 'wire', 'whisper', 'mouse', 'airline', 'founder',
    'objective', 'nowhere', 'phenomenon', 'evolve', 'exact', 'silver', 'cent', 'universal', 'teenager', 'crucial',
    'viewer', 'ridiculous', 'chocolate', 'sensitive', 'grandmother', 'missile', 'roughly', 'constitutional', 'adventure', 'genetic',
    'related', 'swing', 'ultimate', 'manufacturer', 'unknown', 'wipe', 'crop', 'survival', 'dimension', 'resist',
    'darkness', 'guarantee', 'historic', 'educator', 'rough', 'personnel', 'confront', 'terrorist', 'royal', 'elite',
    'occupy', 'emphasis', 'wet', 'destruction', 'raw', 'inner', 'proceed', 'violate', 'chart', 'pace',
    'finance', 'champion', 'snap', 'advise', 'initially', 'advanced', 'unlikely', 'barrier', 'advocate', 'access',
    'horrible', 'burden', 'violation', 'unlike', 'idiot', 'lifetime', 'working', 'ongoing', 'react', 'routine',
    'presentation', 'supply', 'gear', 'mexican', 'stadium', 'translate', 'mortgage', 'sheriff', 'clinic', 'spin',
    'coalition', 'naturally', 'hopefully', 'menu', 'smooth', 'advertising', 'interpret', 'plant', 'dismiss', 'apparent',
    'arrangement', 'incorporate', 'brilliant', 'storage', 'framework', 'honestly', 'chase', 'sigh', 'assure', 'utility',
    'aggressive', 'cookie', 'terror', 'worth', 'wealthy', 'forum', 'alliance', 'possess', 'empire', 'curious',
    'corn', 'calculate', 'hurry', 'testimony', 'elementary', 'stake', 'precisely', 'bite', 'given', 'substantial',
    'depending', 'glance', 'tissue', 'concentration', 'developer', 'found', 'ballot', 'consume', 'overcome', 'biological',
    'chamber', 'similarly', 'dare', 'developing', 'tiger', 'ratio', 'lover', 'expansion', 'encounter', 'occasionally',
    'unemployment', 'pet', 'awful', 'laboratory', 'administrator', 'quarterback', 'rocket', 'preparation', 'relative', 'confident',
    'strategic', 'marine', 'publisher', 'innovation', 'highlight', 'nut', 'fighter', 'electricity', 'instance', 'fortune',
    'freeze', 'variation', 'armed', 'negotiate', 'laughter', 'wisdom', 'correspondent', 'mixture', 'retain', 'tomato',
    'testify', 'ingredient', 'galaxy', 'qualify', 'scheme', 'gop', 'shame', 'concentrate', 'contest', 'introduction',
    'boundary', 'tube', 'versus', 'chef', 'regularly', 'ugly', 'screw', 'tongue', 'palestinian', 'fiscal',
    'creek', 'hip', 'accompany', 'terrorism', 'respondent', 'narrator', 'voting', 'refugee', 'assembly', 'fraud',
    'limitation', 'partnership', 'crash', 'representation', 'ministry', 'flat', 'wise', 'register', 'comedy', 'tap',
    'infrastructure', 'organic', 'islam', 'diverse', 'intellectual', 'tight', 'port', 'fate', 'absolute', 'dialogue',
    'frequency', 'tribe', 'external', 'appointment', 'convert', 'surprising', 'mobile', 'establishment', 'worried', 'bye',
    'shopping', 'celebrity', 'congressman', 'impress', 'taxpayer', 'adapt', 'publicly', 'pride', 'clothing', 'rapidly',
    'domain', 'mainly', 'ceiling', 'alter', 'shelter', 'random', 'obligation', 'shower', 'beg', 'asleep',
    'musician', 'extraordinary', 'dirt', 'pc', 'bell', 'ceremony', 'clue', 'guideline', 'comfort', 'pregnancy',
    'borrow', 'conventional', 'tourist', 'incentive', 'custom', 'cheek', 'tournament', 'satellite', 'nearby', 'comprehensive',
    'stable', 'medication', 'script', 'educate', 'efficient', 'welcome', 'scare', 'psychology', 'logic', 'economics',
    'nevertheless', 'devil', 'beat', 'charity', 'fiber', 'ideal', 'friendship', 'net', 'motivation', 'differently',
    'reserve', 'observer', 'humanity', 'survivor', 'fence', 'quietly', 'humor', 'funeral', 'spokesman', 'extension',
    'loose', 'sink', 'historian', 'ruin', 'chemical', 'singer', 'drunk', 'swim', 'onion', 'specialist',
    'missing', 'pan', 'distribute', 'silly', 'deck', 'reflection', 'shortly', 'database', 'remote', 'permission',
    'remarkable', 'everyday', 'lifestyle', 'sweep', 'naked', 'sufficient', 'lion', 'consumption', 'capability', 'emission',
    'sidebar', 'crap', 'dealer', 'measurement', 'vital', 'impressive', 'bake', 'adviser', 'yield', 'mere',
    'imagination', 'radical', 'tragedy', 'scary', 'consultant', 'lieutenant', 'upset', 'attractive', 'acre', 'drawing',
    'defeat', 'newly', 'scandal', 'ambassador', 'ooh', 'content', 'bench', 'guide', 'counter', 'odds',
    'rat', 'horror', 'vulnerable', 'prevention', 'segment', 'ban', 'tail', 'constitute', 'badly', 'bless',
    'literary', 'magic', 'implementation', 'legitimate', 'slight', 'crash', 'strip', 'desperate', 'distant', 'preference',
    'politically', 'feedback', 'health-care', 'italian', 'detailed', 'buyer', 'cooperation', 'profession', 'incredibly', 'orange',
    'killing', 'sue', 'photographer', 'running', 'engagement', 'differ', 'pitch', 'extensive', 'salad', 'stair',
    'grace', 'divorce', 'vessel', 'pig', 'assignment', 'distinction', 'circuit', 'acid', 'canadian', 'flee',
    'efficiency', 'memorial', 'proposed', 'entity', 'iphone', 'punishment', 'pause', 'pill', 'rub', 'romantic',
    'myth', 'economist', 'latin', 'decent', 'craft', 'poetry', 'thread', 'wooden', 'confuse', 'privilege',
    'coal', 'fool', 'cow', 'characterize', 'pie', 'decrease', 'resort', 'legacy', 're', 'frankly',
    'cancel', 'derive', 'dumb', 'scope', 'formation', 'grandfather', 'hence', 'wish', 'margin', 'wound',
    'exhibition', 'legislature', 'furthermore', 'portrait', 'sustain', 'uniform', 'painful', 'loud', 'miracle', 'harm',
    'zero', 'tactic', 'mask', 'calm', 'inflation', 'hunting', 'physically', 'final', 'flesh', 'temporary',
    'fellow', 'nerve', 'lung', 'steady', 'headline', 'sudden', 'successfully', 'defendant', 'pole', 'satisfy',
    'entrance', 'aircraft', 'withdraw', 'cabinet', 'repeatedly', 'happiness', 'admission', 'correlation', 'proportion', 'dispute',
    'candy', 'reward', 'counselor', 'recording', 'pile', 'explosion', 'appoint', 'couch', 'cognitive', 'furniture',
    'significance', 'grateful', 'suit', 'commissioner', 'shelf', 'tremendous', 'warrior', 'physics', 'garage', 'flavor',
    'squeeze', 'prominent', 'fifty', 'fade', 'oven', 'satisfaction', 'discrimination', 'recession', 'allegation', 'boom',
    'weekly', 'lately', 'restriction', 'diamond', 'crack', 'conviction', 'heel', 'fake', 'fame', 'shine',
    'playoff', 'actress', 'cheat', 'format', 'controversy', 'auto', 'grocery', 'headquarters', 'rip', 'shade',
    'regulate', 'meter', 'olympic', 'pipe', 'celebration', 'handful', 'copyright', 'dependent', 'signature', 'bishop',
    'strengthen', 'soup', 'entitle', 'whoever', 'carrier', 'anniversary', 'pizza', 'ethics', 'legend', 'eagle',
    'scholarship', 'membership', 'standing', 'possession', 'treaty', 'partly', 'consciousness', 'manufacturing', 'announcement', 'tire',
    'makeup', 'prediction', 'stability', 'trace', 'norm', 'irish', 'genius', 'gently', 'operator', 'mall',
    'rumor', 'poet', 'tendency', 'subsequent', 'alien', 'explode', 'controversial', 'maintenance', 'courage', 'exceed',
    'principal', 'vaccine', 'identification', 'sandwich', 'bull', 'lens', 'twelve', 'mainstream', 'presidency', 'integrity',
    'distinct', 'intelligent', 'secondary', 'bias', 'hypothesis', 'fifteen', 'nomination', 'delay', 'adjustment', 'sanction',
    'render', 'acceptable', 'mutual', 'examination', 'meaningful', 'communist', 'superior', 'currency', 'collective', 'flame',
    'guitar', 'doctrine', 'float', 'commerce', 'invent', 'robot', 'rapid', 'plain', 'respectively', 'particle',
    'glove', 'till', 'edit', 'moderate', 'jazz', 'infant', 'summary', 'server', 'leather', 'radiation',
    'prompt', 'composition', 'operating', 'assert', 'discourse', 'dump', 'net', 'wildlife', 'soccer', 'mandate',
    'monitor', 'downtown', 'nightmare', 'barrel', 'homeless', 'globe', 'uncomfortable', 'execute', 'trap', 'gesture',
    'pale', 'tent', 'receiver', 'horizon', 'diagnosis', 'considerable', 'gospel', 'automatically', 'fighting', 'stroke',
    'wander', 'duck', 'grain', 'beast', 'concern', 'remark', 'fabric', 'civilization', 'corruption', 'collapse',
    'ma\'am', 'greatly', 'workshop', 'inquiry', 'cd', 'admire', 'exclude', 'rifle', 'closet', 'reporting',
    'curve', 'patch', 'touchdown', 'experimental', 'earnings', 'hunter', 'tunnel', 'corps', 'behave', 'motivate',
    'attribute', 'elderly', 'virtual', 'minimum', 'weakness', 'progressive', 'doc', 'medium', 'virtue', 'ounce',
    'athletic', 'confusion', 'legislative', 'facilitate', 'midnight', 'deer', 'undergo', 'heritage', 'summit', 'sword',
    'telescope', 'donate', 'blade', 'toe', 'agriculture', 'enforce', 'recruit', 'dose', 'concerning', 'integrate',
    'prescription', 'retail', 'adoption', 'monthly', 'deadly', 'grave', 'rope', 'reliable', 'transaction', 'lawn',
    'consistently', 'mount', 'bubble', 'briefly', 'absorb', 'princess', 'log', 'blanket', 'laugh', 'kingdom',
    'anticipate', 'bug', 'primary', 'dedicate', 'nominee', 'transformation', 'temple', 'arrival', 'frustration', 'changing',
    'demonstration', 'pollution', 'poster', 'nail', 'nonprofit', 'guidance', 'exhibit', 'pen', 'interrupt', 'lemon',
    'bankruptcy', 'resign', 'dominant', 'invasion', 'sacred', 'replacement', 'portray', 'hunt', 'distinguish', 'melt',
    'consensus', 'hardware', 'rail', 'mate', 'korean', 'cabin', 'dining', 'snake', 'tobacco', 'orientation',
    'trigger', 'wherever', 'seize', 'mess', 'punish', 'sexy', 'depict', 'input', 'seemingly', 'widespread',
    'competitor', 'flip', 'freshman', 'donation', 'administrative', 'donor', 'gradually', 'overlook', 'toilet', 'pleased',
    'resemble', 'ideology', 'glory', 'maximum', 'organ', 'skip', 'starting', 'brush', 'brick', 'gut',
    'reservation', 'rebel', 'disappointed', 'oak', 'valid', 'instructor', 'rescue', 'racism', 'pension', 'diabetes',
    'cluster', 'eager', 'marijuana', 'combat', 'praise', 'costume', 'sixth', 'frequent', 'inspiration', 'concrete',
    'cooking', 'conspiracy', 'trait', 'van', 'institutional', 'garlic', 'drinking', 'crystal', 'pro', 'helicopter',
    'counsel', 'equation', 'roman', 'sophisticated', 'timing', 'pope', 'opera', 'ethical', 'indication', 'motive',
    'porch', 'reinforce', 'gaze', 'ours', 'lap', 'written', 'reverse', 'starter', 'injure', 'chronic',
    'continued', 'exclusive', 'colonel', 'beef', 'abroad', 'thanksgiving', 'intensity', 'cave', 'basement', 'associated',
    'fascinating', 'interact', 'illustration', 'essence', 'container', 'driving', 'stuff', 'dynamic', 'gym', 'bat',
    'plead', 'promotion', 'uncertainty', 'ownership', 'officially', 'tag', 'documentary', 'flood', 'guilt', 'alarm',
    'turkey', 'diagnose', 'precious', 'swallow', 'initiate', 'fitness', 'restrict', 'gulf', 'advocate', 'mommy',
    'unexpected', 'shrug', 'agricultural', 'sacrifice', 'spectrum', 'dragon', 'bacteria', 'shore', 'pastor', 'cliff',
    'ship', 'adequate', 'tackle', 'occupation', 'compose', 'slice', 'brave', 'stimulus', 'patent', 'powder',
    'harsh', 'chaos', 'kit', 'piano', 'surprisingly', 'lend', 'correctly', 'govern', 'modest', 'shared',
    'psychologist', 'servant', 'overwhelming', 'elevator', 'hispanic', 'divine', 'transmission', 'butt', 'commonly', 'cowboy',
    'ease', 'intent', 'counseling', 'gentle', 'rhythm', 'complexity', 'nonetheless', 'effectiveness', 'lonely', 'statistical',
    'longtime', 'strain', 'devote', 'speed', 'venture', 'aide', 'subtle', 'rod', 'civilian', 't-shirt',
    'endure', 'basket', 'strict', 'loser', 'franchise', 'saint', 'prosecution', 'bite', 'lyrics', 'compound',
    'architecture', 'destination', 'cope', 'province', 'sum', 'lecture', 'spill', 'genuine', 'upstairs', 'trading',
    'acceptance', 'revelation', 'indicator', 'collaboration', 'rhetoric', 'tune', 'slam', 'inevitable', 'monkey', 'protocol',
    'productive', 'finish', 'jeans', 'companion', 'convict', 'boost', 'recipient', 'practically', 'array', 'persuade',
    'undermine', 'yep', 'ranch', 'scout', 'medal', 'endless', 'translation', 'ski', 'conservation', 'habitat',
    'contractor', 'trailer', 'pitcher', 'towel', 'goodbye', 'bonus', 'dramatically', 'genre', 'caller', 'exit',
    'hook', 'behavioral', 'omit', 'pit', 'boring', 'suspend', 'cholesterol', 'closed', 'advertisement', 'bombing',
    'consult', 'encounter', 'expertise', 'creator', 'peaceful', 'provided', 'tablet', 'ruling', 'warming', 'equity',
    'rational', 'utilize', 'pine', 'bitter', 'surgeon', 'affordable', 'tennis', 'artistic', 'download', 'suffering',
    'accuracy', 'literacy', 'treasury', 'talented', 'crown', 'importantly', 'bare', 'invisible', 'sergeant', 'regulatory',
    'thumb', 'colony', 'walking', 'accessible', 'integration', 'spouse', 'excitement', 'residence', 'bold', 'adolescent',
    'greek', 'doll', 'oxygen', 'gravity', 'functional', 'palace', 'echo', 'cotton', 'rescue', 'estimated',
    'endorse', 'lawmaker', 'determination', 'flash', 'simultaneously', 'dynamics', 'shell', 'hint', 'administer', 'christianity',
    'distract', 'alleged', 'statute', 'biology', 'follower', 'nasty', 'evident', 'confess', 'eligible', 'trap',
    'consent', 'pump', 'bloody', 'hate', 'occasional', 'trunk', 'prohibit', 'sustainable', 'belly', 'banking',
    'asshole', 'journalism', 'obstacle', 'ridge', 'heal', 'bastard', 'cheer', 'apology', 'tumor', 'architect',
    'wrist', 'harbor', 'handsome', 'bullshit', 'realm', 'twist', 'inspector', 'surveillance', 'trauma', 'rebuild',
    'romance', 'gross', 'deadline', 'classical', 'convey', 'compensation', 'insect', 'output', 'parliament', 'suite',
    'opposed', 'fold', 'separation', 'demon', 'eating', 'structural', 'equality', 'logical', 'probability', 'await',
    'generous', 'acquisition', 'custody', 'compromise', 'greet', 'trash', 'judicial', 'earthquake', 'insane', 'realistic',
    'assemble', 'necessity', 'horn', 'parameter', 'grip', 'modify', 'sponsor', 'mathematics', 'hallway', 'african-american',
    'liability', 'crawl', 'theoretical', 'condemn', 'fluid', 'homeland', 'technological', 'exam', 'anchor', 'spell',
    'considering', 'conscious', 'vitamin', 'known', 'hostage', 'actively', 'mill', 'teenage', 'retrieve', 'processing',
    'sentiment', 'offering', 'oral', 'convinced', 'photography', 'coin', 'laptop', 'bounce', 'goodness', 'affiliation',
    'punch', 'burst', 'bee', 'blessing', 'command', 'continuous', 'landing', 'repair', 'ritual', 'bath',
    'sneak', 'historically', 'mud', 'scan', 'reminder', 'hers', 'slavery', 'supervisor', 'quantity', 'olympics',
    'pleasant', 'slope', 'skirt', 'outlet', 'curtain', 'declaration', 'seal', 'immune', 'calendar', 'paragraph',
    'identical', 'regret', 'quest', 'entrepreneur', 'specify', 'stumble', 'clay', 'noon', 'last', 'elbow',
    'outstanding', 'uh-huh', 'unity', 'manipulate', 'airplane', 'portfolio', 'mysterious', 'delicious', 'northwest', 'sweat',
    'profound', 'treasure', 'flour', 'lightly', 'rally', 'default', 'alongside', 'plain', 'hug', 'isolate',
    'exploration', 'limb', 'enroll', 'outer', 'charter', 'southwest', 'arena', 'witch', 'upcoming', 'forty',
    'someday', 'unite', 'courtesy', 'statue', 'fist', 'castle', 'precise', 'squad', 'cruise', 'joke',
    'legally', 'embassy', 'patience', 'thereby', 'bush', 'purple', 'peer', 'electrical', 'outfit', 'cage',
    'retired', 'shark', 'lobby', 'sidewalk', 'runner', 'ankle', 'attraction', 'fool', 'artificial', 'mercy',
    'indigenous', 'slap', 'dancer', 'candle', 'sexually', 'needle', 'hidden', 'chronicle', 'suburb', 'toxic',
    'underlying', 'sensor', 'deploy', 'debut', 'magnitude', 'suspicion', 'pro', 'colonial', 'icon', 'grandma',
    'info', 'jurisdiction', 'iranian', 'senior', 'parade', 'archive', 'gifted', 'rage', 'outdoor', 'ending',
    'loop', 'altogether', 'chase', 'burning', 'reception', 'local', 'crush', 'premise', 'deem', 'automatic',
    'whale', 'mechanical', 'credibility', 'drain', 'drift', 'loyalty', 'promising', 'tide', 'traveler', 'grief',
    'metaphor', 'skull', 'pursuit', 'therapist', 'backup', 'workplace', 'instinct', 'export', 'bleed', 'seventh',
    'fixed', 'broadcast', 'disclose', 'execution', 'pal', 'chuckle', 'density', 'correction', 'jump', 'repair',
    'kinda', 'relieve', 'teammate', 'corridor', 'russian', 'enthusiasm', 'extended', 'alright', 'panic', 'pad',
    'bid', 'mild', 'productivity', 'tuck', 'railroad', 'frozen', 'minimize', 'amid', 'inspection', 'cab',
    'expected', 'nonsense', 'leap', 'rider', 'theology', 'terrific', 'accent', 'invitation', 'israeli', 'liar',
    'oversee', 'awkward', 'registration', 'suburban', 'handle', 'momentum', 'instantly', 'clerk', 'chin', 'hockey',
    'laser', 'proposition', 'rob', 'beam', 'ancestor', 'creativity', 'verse', 'casual', 'objection', 'clever',
    'given', 'shove', 'revolutionary', 'carbohydrate', 'steam', 'reportedly', 'forehead', 'resume', 'slide', 'sheep',
    'carpet', 'cloth', 'interior', 'full-time', 'questionnaire', 'departure', 'behalf', 'graph', 'diplomatic', 'thief',
    'herb', 'subsidy', 'fossil', 'patrol', 'pulse', 'mechanic', 'cattle', 'screening', 'continuing', 'electoral',
    'supposedly', 'dignity', 'prophet', 'commentary', 'spread', 'serving', 'safely', 'homework', 'allegedly', 'android',
    'alpha', 'insert', 'mortality', 'contend', 'elephant', 'solely', 'continent', 'ecosystem', 'nearby', 'olive',
    'syndrome', 'abstract', 'accusation', 'coming', 'sock', 'pickup', 'shuttle', 'improved', 'calculation', 'innovative',
    'demographic', 'accommodate', 'jaw', 'unfair', 'tragic', 'comprise', 'faster', 'nutrition', 'mentor', 'stance',
    'rabbit', 'pause', 'dot', 'contributor', 'cooperate', 'disk', 'hesitate', 'offend', 'exploit', 'compel',
    'likelihood', 'sibling', 'southeast', 'gorgeous', 'undertake', 'painter', 'residential', 'counterpart', 'believer', 'lamp',
    'inmate', 'thoroughly', 'freak', 'filter', 'pillow', 'orbit', 'purse', 'likewise', 'cease', 'passing',
    'vanish', 'instructional', 'clause', 'mentally', 'left', 'pond', 'neutral', 'shield', 'popularity', 'cartoon',
    'authorize', 'combined', 'exhibit', 'sink', 'graphic', 'darling', 'traditionally', 'vendor', 'poorly', 'conceive',
    'opt', 'descend', 'firmly', 'beloved', 'openly', 'gathering', 'fever', 'preach', 'interfere', 'arrow',
    'required', 'capitalism', 'fork', 'meantime', 'presumably', 'racist', 'illusion', 'removal', 'anxious', 'organism',
    'sculpture', 'spare', 'harassment', 'drum', 'diminish', 'helmet', 'certificate', 'tribal', 'mmm', 'sadly',
    'cart', 'spy', 'sunlight', 'delete', 'rookie', 'clarify', 'practitioner', 'performer', 'protective', 'jar',
    'programming', 'dawn', 'salmon', 'census', 'accomplishment', 'conscience', 'fortunately', 'minimal', 'molecule', 'supportive',
    'sole', 'threshold', 'inventory', 'comply', 'monetary', 'transport', 'shy', 'drill', 'influential', 'verbal',
    'reward', 'ranking', 'gram', 'grasp', 'puzzle', 'envelope', 'classify', 'enact', 'unfortunate', 'scatter',
    'cure', 'dear', 'slice', 'readily', 'discount', 'addiction', 'emerging', 'worthy', 'marker', 'juror',
    'blend', 'businessman', 'premium', 'retailer', 'liver', 'pirate', 'protester', 'outlook', 'elder', 'gallon',
    'additionally', 'ignorance', 'chemistry', 'sometime', 'weed', 'babe', 'fraction', 'conversion', 'tolerate', 'trail',
    'drown', 'merit', 'citizenship', 'coordinator', 'validity', 'lightning', 'turtle', 'ambition', 'worldwide', 'sail',
    'added', 'delicate', 'comic', 'soap', 'hostile', 'instruct', 'shortage', 'useless', 'booth', 'diary',
    'gasp', 'suspicious', 'transit', 'excite', 'publishing', 'curiosity', 'grid', 'rolling', 'bow', 'cruel',
    'disclosure', 'rival', 'denial', 'secular', 'speculation', 'sympathy', 'tender', 'inappropriate', 'o\'clock', 'sodium',
    'spring', 'bang', 'challenging', 'ipad', 'sack', 'barn', 'reliability', 'hormone', 'footage', 'carve',
    'alley', 'coastal', 'cafe', 'partial', 'flexible', 'experienced', 'mixed', 'vampire', 'optimistic', 'dessert',
    'well-being', 'northeast', 'specialize', 'fleet', 'availability', 'compliance', 'pin', 'pork', 'astronomer', 'forbid',
    'installation', 'boil', 'nest', 'exclusively', 'goat', 'shallow', 'equip', 'equivalent', 'betray', 'willingness',
    'banker', 'interval', 'gasoline', 'encouraging', 'exchange', 'bucket', 'theft', 'laundry', 'constraint', 'dying',
    'hatred', 'jewelry', 'migration', 'invention', 'loving', 'revenge', 'unprecedented', 'outline', 'sheer', 'halloween',
    'sweetheart', 'spit', 'lazy', 'intimate', 'defender', 'technically', 'battle', 'cure', 'peanut', 'unclear',
    'piss', 'workout', 'wilderness', 'compelling', 'eleven', 'backyard', 'alike', 'partially', 'guardian', 'passionate',
    'scripture', 'midst', 'ideological', 'apart', 'thrive', 'sensitivity', 'emotionally', 'ignorant', 'explicitly', 'unfold',
    'headache', 'eternal', 'chop', 'ego', 'spectacular', 'deposit', 'verdict', 'accountability', 'nominate', 'civic',
    'uncover', 'critique', 'aisle', 'tropical', 'annually', 'eighth', 'blast', 'corrupt', 'compassion', 'scratch',
    'verify', 'offender', 'inherit', 'strive', 'chunk', 'appreciation', 'canvas', 'punch', 'short-term', 'proceedings',
    'magical', 'loyal', 'aah', 'desperately', 'throne', 'brutal', 'spite', 'propaganda', 'irony', 'soda',
    'projection', 'dutch', 'parental', 'disabled', 'collector', 're-election', 'disappointment', 'aid', 'happily', 'steep',
    'fancy', 'counter', 'listener', 'whip', 'drawer', 'heck', 'developmental', 'ideal', 'ash', 'socially',
    'courtroom', 'stamp', 'solo', 'trainer', 'induce', 'anytime', 'morality', 'syrian', 'pipeline', 'bride',
    'instant', 'spark', 'doorway', 'interface', 'learner', 'casino', 'placement', 'cord', 'conception', 'flexibility',
    'thou', 'elegant', 'flaw', 'locker', 'peel', 'campaign', 'spell', 'objective', 'plea', 'goddamn',
    'import', 'stack', 'gosh', 'philosophical', 'junk', 'bicycle', 'vocal', 'chew', 'destiny', 'ambitious',
    'unbelievable', 'vice', 'halfway', 'jealous', 'sphere', 'invade', 'excessive', 'countless', 'sunset', 'interior',
    'accounting', 'faithful', 'freely', 'extract', 'adaptation', 'ray', 'depressed', 'emperor', 'wagon', 'columnist',
    'jungle', 'embarrassed', 'trillion', 'breeze', 'foster', 'venue', 'discourage', 'disturbing', 'riot', 'isolation',
    'explicit', 'commodity', 'attendance', 'tab', 'consequently', 'dough', 'streak', 'silk', 'similarity', 'steak',
    'dancing', 'petition', 'viable', 'mm', 'balloon', 'monument', 'try', 'cue', 'sleeve', 'toll',
    'reluctant', 'warrant', 'stiff', 'tattoo', 'softly', 'graduation', 'deliberately', 'consecutive', 'upgrade', 'accurately',
    'strictly', 'leak', 'casualty', 'risky', 'banana', 'blank', 'beneficial', 'shrink', 'chat', 'rack',
    'rude', 'usage', 'testament', 'browser', 'processor', 'thigh', 'perceived', 'talking', 'merchant', 'quantum',
    'eyebrow', 'surrounding', 'vocabulary', 'ashamed', 'eh', 'radar', 'stunning', 'murderer', 'burger', 'collar',
    'align', 'textbook', 'sensation', 'afterward', 'charm', 'sunny', 'hammer', 'keyboard', 'persist', 'wheat',
    'predator', 'bizarre'
];

// Read the vocabulary from chunk 2
const content = fs.readFileSync('vocab_chunk2.js', 'utf8');

// Extract the vocab object
const vocabMatch = content.match(/vocab:\s*{([^}]+(?:{[^}]+}[^}]+)*?)}/s);
if (!vocabMatch) {
    console.error('Could not find vocab object from chunk 2');
    process.exit(1);
}

// Parse the existing vocabulary from chunk 2
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

console.log(`Words from chunks 1-2: ${existingEntries.length}`);

// Add new words that aren't already in the vocabulary (case-insensitive check)
let addedCount = 0;
let duplicateCount = 0;
const allEntries = [...existingEntries];

for (const word of newWords) {
    const lowerWord = word.toLowerCase();
    if (!seenWords.has(lowerWord)) {
        allEntries.push({ word: lowerWord, tokenId: 5000 + addedCount }); // Place in chunk 3 category
        seenWords.add(lowerWord);
        addedCount++;
    } else {
        duplicateCount++;
    }
}

console.log(`Chunk 3 - New words added: ${addedCount}`);
console.log(`Chunk 3 - Duplicates skipped: ${duplicateCount}`);
console.log(`Total unique words after chunk 3: ${allEntries.length}`);

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
    5000: '// Common English Words - Chunk 3 (5001+)'
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
fs.writeFileSync('vocab_chunk3.js', outputLines.join('\n'));
console.log(`\nChunk 3 vocabulary saved to vocab_chunk3.js`);
console.log(`Final vocabulary size after chunk 3: ${currentTokenId} unique tokens`);