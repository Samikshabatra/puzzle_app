import { PuzzleData } from '../types';

// ─── Word Banks ───────────────────────────────────────────────────────────────
const WORDS = {
  Easy: [
    { word: 'BRAIN',  theme: 'Neuroscience',  clues: ['Central organ of the nervous system', 'Protected inside your skull', 'Controls thought, memory & emotion'] },
    { word: 'LIGHT',  theme: 'Physics',        clues: ['Travels at 300,000 km/s in vacuum', 'Composed of massless photons', 'Makes vision possible'] },
    { word: 'WATER',  theme: 'Chemistry',      clues: ['Molecular formula is H₂O', 'Covers 71% of Earth\'s surface', 'Essential for all known life'] },
    { word: 'CLOUD',  theme: 'Meteorology',    clues: ['Visible mass of water droplets', 'Forms in the troposphere', 'Can produce rain, snow or hail'] },
    { word: 'PLANT',  theme: 'Biology',        clues: ['Converts sunlight into energy', 'Produces oxygen as a byproduct', 'Foundation of most food chains'] },
    { word: 'OCEAN',  theme: 'Geography',      clues: ['Saltwater body covering most of Earth', 'Home to millions of species', 'Regulates global climate'] },
    { word: 'ORBIT',  theme: 'Astronomy',      clues: ['Curved path of one body around another', 'Maintained by gravitational force', 'Planets follow this around the Sun'] },
    { word: 'VIRUS',  theme: 'Microbiology',   clues: ['Requires a host cell to replicate', 'Smaller than any bacterium', 'Can cause infectious disease'] },
    { word: 'CHESS',  theme: 'Strategy',       clues: ['Played on a 64-square board', 'Objective: checkmate the king', 'Originated in ancient India'] },
    { word: 'RADAR',  theme: 'Technology',     clues: ['Uses radio waves to detect objects', 'A perfect palindrome word', 'Essential for air traffic control'] },
    { word: 'SOLAR',  theme: 'Astronomy',      clues: ['Relating to the Sun', 'Powers photovoltaic panels', 'Our planetary system is named this'] },
    { word: 'FLAME',  theme: 'Chemistry',      clues: ['Visible result of rapid combustion', 'Produces both heat and light', 'Requires oxygen, fuel and heat'] },
    { word: 'TIGER',  theme: 'Zoology',        clues: ['Largest living wild cat species', 'Recognisable by black stripes', 'Native to Asia, apex predator'] },
    { word: 'DELTA',  theme: 'Geography',      clues: ['Triangular landform at a river mouth', 'Fourth letter of Greek alphabet', 'Formed by sediment deposition'] },
    { word: 'NERVE',  theme: 'Anatomy',        clues: ['Carries electrical signals in the body', 'Bundle of axons and dendrites', 'Pain travels along these fibres'] },
  ],
  Medium: [
    { word: 'QUARTZ',  theme: 'Mineralogy',      clues: ['Most abundant mineral in Earth\'s crust', 'Silicon dioxide crystal structure', 'Key component of granite rock'] },
    { word: 'PHOTON',  theme: 'Quantum Physics',  clues: ['Massless particle that carries light', 'Quantum of the electromagnetic field', 'Exhibits wave–particle duality'] },
    { word: 'GENOME',  theme: 'Genetics',         clues: ['Complete set of DNA in an organism', 'Contains all genetic instructions', 'Human version has ~3 billion base pairs'] },
    { word: 'PLASMA',  theme: 'Physics',          clues: ['Fourth state of matter', 'Makes up the interior of stars', 'Ionised gas with free electrons'] },
    { word: 'CIPHER',  theme: 'Cryptography',     clues: ['Algorithm for encrypting information', 'Caesar invented a famous letter-shift version', 'A key is needed to decode it'] },
    { word: 'NEBULA',  theme: 'Astronomy',        clues: ['Vast cloud of gas and dust in space', 'Birthplace of new stars', 'Latin word meaning "mist"'] },
    { word: 'ENZYME',  theme: 'Biochemistry',     clues: ['Biological catalyst made of protein', 'Speeds up chemical reactions in cells', 'Its name usually ends in -ase'] },
    { word: 'FOSSIL',  theme: 'Paleontology',     clues: ['Preserved remains of an ancient organism', 'Most often found in sedimentary rock', 'Provides evidence of prehistoric life'] },
    { word: 'VORTEX',  theme: 'Fluid Dynamics',   clues: ['Spinning region of fluid or air', 'Tornadoes are a dramatic example', 'Creates a spiral flow pattern'] },
    { word: 'MAGNET',  theme: 'Physics',          clues: ['Object that produces a magnetic field', 'Opposite poles attract each other', 'Earth acts as a giant one'] },
    { word: 'TUNDRA',  theme: 'Ecology',          clues: ['Cold, treeless Arctic biome', 'Permafrost layer lies just beneath', 'Extremely short growing season'] },
    { word: 'FRACTAL', theme: 'Mathematics',      clues: ['Self-similar pattern at every scale', 'The Mandelbrot set is a famous example', 'Shows infinite complexity from simple rules'] },
    { word: 'MATRIX',  theme: 'Mathematics',      clues: ['Rectangular array of numbers or expressions', 'Used extensively in linear algebra', 'Defined by its rows and columns'] },
    { word: 'COMET',   theme: 'Astronomy',        clues: ['Icy body that orbits the Sun', 'Develops a bright tail when near the Sun', 'Halley\'s returns every 75–76 years'] },
    { word: 'PRISM',   theme: 'Optics',           clues: ['Transparent solid that refracts light', 'Splits white light into its spectrum', 'Triangular cross-section is most common'] },
  ],
  Hard: [
    { word: 'QUANTUM',    theme: 'Quantum Physics',    clues: ['Discrete minimum unit of energy', 'Planck\'s constant defines its scale', 'Classical physics cannot explain it'] },
    { word: 'ENTROPY',    theme: 'Thermodynamics',     clues: ['Measure of disorder in a system', 'Always increases in an isolated system', 'Central to the second law of thermodynamics'] },
    { word: 'NEURON',     theme: 'Neuroscience',       clues: ['Fundamental electrically active cell of the nervous system', 'Has an axon that transmits outgoing signals', 'Receives input through branching dendrites'] },
    { word: 'ISOTOPE',    theme: 'Nuclear Physics',    clues: ['Atoms of the same element with different neutron counts', 'Carbon-14 is used for radiocarbon dating', 'Some are unstable and radioactive'] },
    { word: 'SYNAPSE',    theme: 'Neurobiology',       clues: ['Nanometre-scale junction between two neurons', 'Neurotransmitters diffuse across it', 'Where chemical and electrical signalling meet'] },
    { word: 'POLYMER',    theme: 'Chemistry',          clues: ['Macromolecule built from repeating monomer units', 'Plastics are synthetic examples', 'DNA and proteins are biological ones'] },
    { word: 'CATALYST',   theme: 'Chemistry',          clues: ['Speeds up a reaction without being consumed', 'Lowers the activation energy required', 'Enzymes are nature\'s version'] },
    { word: 'AXIOM',      theme: 'Logic',              clues: ['Self-evident statement assumed without proof', 'Starting point of a deductive system', 'Euclid built geometry on five of these'] },
    { word: 'MUTATION',   theme: 'Genetics',           clues: ['Heritable change in the DNA sequence', 'Primary driver of evolutionary change', 'Can be beneficial, neutral or harmful'] },
    { word: 'TOPOLOGY',   theme: 'Mathematics',        clues: ['Study of properties preserved under continuous deformation', 'A donut and a coffee cup are equivalent in it', 'Does not care about exact shape or size'] },
    { word: 'DIFFUSION',  theme: 'Physics',            clues: ['Net movement of particles from high to low concentration', 'How oxygen enters red blood cells', 'Requires no energy — purely passive'] },
    { word: 'RESONANCE',  theme: 'Physics',            clues: ['Large amplitude response at a system\'s natural frequency', 'Can cause bridges to oscillate dangerously', 'Used in MRI machines and musical instruments'] },
    { word: 'ALGORITHM',  theme: 'Computer Science',   clues: ['Finite sequence of well-defined instructions', 'Named after the mathematician Al-Khwarizmi', 'Powers search engines, GPS and recommendation systems'] },
    { word: 'MOMENTUM',   theme: 'Physics',            clues: ['Product of mass and velocity', 'Conserved in all closed systems', 'Newton\'s second law links it to force'] },
    { word: 'OXIDATION',  theme: 'Chemistry',          clues: ['Loss of electrons in a chemical reaction', 'Rusting of iron is a slow example', 'Paired with reduction in redox reactions'] },
  ],
};

// ─── Cryptogram Quotes ────────────────────────────────────────────────────────
const QUOTES = [
  { quote: 'THE ONLY WAY TO DO GREAT WORK IS TO LOVE WHAT YOU DO',           author: 'Steve Jobs',        difficulty: 'Easy'   },
  { quote: 'IN THE MIDDLE OF DIFFICULTY LIES OPPORTUNITY',                    author: 'Albert Einstein',   difficulty: 'Easy'   },
  { quote: 'STAY HUNGRY STAY FOOLISH',                                        author: 'Steve Jobs',        difficulty: 'Easy'   },
  { quote: 'LIFE IS WHAT HAPPENS WHEN YOU ARE BUSY MAKING PLANS',             author: 'John Lennon',       difficulty: 'Easy'   },
  { quote: 'TO BE OR NOT TO BE THAT IS THE QUESTION',                         author: 'William Shakespeare',difficulty: 'Easy'  },
  { quote: 'IMAGINATION IS MORE IMPORTANT THAN KNOWLEDGE',                    author: 'Albert Einstein',   difficulty: 'Medium' },
  { quote: 'THE UNEXAMINED LIFE IS NOT WORTH LIVING',                         author: 'Socrates',          difficulty: 'Medium' },
  { quote: 'WE ARE THE UNIVERSE EXPERIENCING ITSELF',                         author: 'Carl Sagan',        difficulty: 'Medium' },
  { quote: 'THE MEASURE OF INTELLIGENCE IS THE ABILITY TO CHANGE',            author: 'Albert Einstein',   difficulty: 'Medium' },
  { quote: 'SIMPLICITY IS THE ULTIMATE SOPHISTICATION',                       author: 'Leonardo da Vinci', difficulty: 'Medium' },
  { quote: 'KNOWLEDGE SPEAKS BUT WISDOM LISTENS',                             author: 'Jimi Hendrix',      difficulty: 'Medium' },
  { quote: 'THE COSMOS IS WITHIN US WE ARE MADE OF STAR STUFF',               author: 'Carl Sagan',        difficulty: 'Hard'   },
  { quote: 'THE ONLY TRUE WISDOM IS IN KNOWING YOU KNOW NOTHING',             author: 'Socrates',          difficulty: 'Hard'   },
  { quote: 'GENIUS IS ONE PERCENT INSPIRATION NINETY NINE PERCENT PERSPIRATION', author: 'Thomas Edison',  difficulty: 'Hard'   },
  { quote: 'DO NOT GO WHERE THE PATH MAY LEAD GO INSTEAD WHERE THERE IS NO PATH AND LEAVE A TRAIL', author: 'Ralph Waldo Emerson', difficulty: 'Hard' },
] as const;

// ─── SHA-256 hashing ──────────────────────────────────────────────────────────
async function sha256(msg: string): Promise<string> {
  const buf  = new TextEncoder().encode(msg);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Seeded LCG PRNG ─────────────────────────────────────────────────────────
function makePrng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}

// ─── Difficulty from day of week ──────────────────────────────────────────────
function getDifficulty(date: string): 'Easy' | 'Medium' | 'Hard' {
  const day = new Date(date.replace(/-/g, '/')).getDay();
  if (day === 0 || day === 6) return 'Hard';
  if (day >= 3)               return 'Medium';
  return 'Easy';
}

// ─── Build substitution cipher (no letter maps to itself) ─────────────────────
function buildCipher(rng: () => number): Record<string, string> {
  const alpha    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const shuffled = [...alpha];
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // Fix any fixed points
  for (let i = 0; i < alpha.length; i++) {
    if (shuffled[i] === alpha[i]) {
      const j = (i + 1) % alpha.length;
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  }
  const cipher: Record<string, string> = {};
  alpha.forEach((c, i) => { cipher[c] = shuffled[i]; });
  return cipher;
}

// ─── Main generator ───────────────────────────────────────────────────────────
export async function generateDailyPuzzle(date: string): Promise<PuzzleData> {
  const secret = (import.meta as any).env?.VITE_PUZZLE_SECRET || 'bluestock_secret_2024';
  const hash   = await sha256(`${date}:${secret}`);
  const seed   = parseInt(hash.slice(0, 8), 16);
  const rng    = makePrng(seed);

  const difficulty = getDifficulty(date);
  const isWordMaster = rng() < 0.55;
  const baseScore    = difficulty === 'Hard' ? 1000 : difficulty === 'Medium' ? 750 : 500;

  if (isWordMaster) {
    const pool   = WORDS[difficulty];
    const picked = pool[Math.floor(rng() * pool.length)];
    const word   = picked.word;

    // Shuffle until different from original
    let scrambled = [...word];
    for (let attempt = 0; attempt < 30; attempt++) {
      for (let i = scrambled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
      }
      if (scrambled.join('') !== word) break;
    }

    return {
      id:               hash.slice(0, 12),
      date,
      theme:            picked.theme,
      targetWord:       word,
      clues:            picked.clues as unknown as string[],
      scrambledLetters: scrambled,
      difficulty,
      baseScore,
      puzzleType:       'word_master',
    };
  } else {
    const pool   = QUOTES.filter(q => q.difficulty === difficulty);
    const picked = pool.length ? pool[Math.floor(rng() * pool.length)] : QUOTES[Math.floor(rng() * QUOTES.length)];
    const cipher = buildCipher(rng);

    const encoded = picked.quote.split('').map(c => (c === ' ' ? ' ' : cipher[c] ?? c)).join('');

    return {
      id:               hash.slice(0, 12),
      date,
      theme:            'Daily Cryptogram',
      targetWord:       picked.quote,
      clues:            [`Author: ${picked.author}`, `${picked.quote.split(' ').length} words`, `${picked.quote.replace(/ /g, '').length} letters total`],
      scrambledLetters: [],
      difficulty,
      baseScore,
      puzzleType:       'cryptogram',
      quote:            encoded,
      author:           picked.author,
      cipher,
    };
  }
}

export function calculateScore(baseScore: number, timeSec: number, hintsUsed: number, difficulty: 'Easy' | 'Medium' | 'Hard'): number {
  const multiplier  = difficulty === 'Hard' ? 3 : difficulty === 'Medium' ? 2 : 1;
  const timeBonus   = Math.max(0, 300 - timeSec) * multiplier;
  const hintPenalty = hintsUsed * 75;
  return Math.max(50, Math.round(baseScore + timeBonus - hintPenalty));
}

export async function generateProof(userId: string, date: string, score: number): Promise<string> {
  const secret = (import.meta as any).env?.VITE_PUZZLE_SECRET || 'bluestock_secret_2024';
  return sha256(`${userId}:${date}:${score}:${secret}`);
}
