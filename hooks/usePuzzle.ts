import { useState, useEffect, useCallback, useRef } from 'react';
import { PuzzleData, GameStatus, LockReason, DailyActivity, Achievement } from '../types';
import { generateDailyPuzzle, calculateScore, generateProof } from '../services/deterministicPuzzle';
import { dbInstance } from '../db/idb';

// ─── Types consumed by components ─────────────────────────────────────────────
export interface PuzzleState {
  // shared
  puzzle:      PuzzleData | null;
  status:      GameStatus;
  isLocked:    boolean;
  lockReason:  LockReason;
  loading:     boolean;
  hintsUsed:   number;
  timeTaken:   number;
  finalScore:  number;
  // word-master specific
  input:             string[];       // placed letters in answer slots
  sourceTiles:       string[];       // available letter tiles ('' = used)
  selectedTileIdx:   number | null;
  revealedSlots:     boolean[];
  shaking:           boolean;
  // cryptogram specific
  cipherMap:         Record<string, string>; // encodedChar -> userGuess
  selectedCipher:    string | null;
  revealedCipherKeys:string[];
  // actions
  updatePuzzleState: (action: PuzzleAction) => void;
  useHint:           () => void;
}

export type PuzzleAction =
  | { type: 'SELECT_TILE';    idx: number }
  | { type: 'PLACE_TILE';     slotIdx: number }
  | { type: 'CLEAR_SLOT';     slotIdx: number }
  | { type: 'KEY_PRESS';      key: string }
  | { type: 'SUBMIT_WORD' }
  | { type: 'SELECT_CIPHER';  char: string }
  | { type: 'INPUT_CIPHER';   plain: string }
  | { type: 'CLEAR_CIPHER';   char: string }
  | { type: 'SUBMIT_CRYPTO' }
  | { type: 'RESET' };

function getToday(): string {
  return new Date().toLocaleDateString('en-CA');
}

function checkLock(date: string): { isLocked: boolean; lockReason: LockReason } {
  const today = getToday();
  if (date < today) return { isLocked: true,  lockReason: LockReason.PAST   };
  if (date > today) return { isLocked: true,  lockReason: LockReason.FUTURE };
  return               { isLocked: false, lockReason: LockReason.NONE   };
}

export function usePuzzle(date: string): PuzzleState {
  const [puzzle,     setPuzzle]     = useState<PuzzleData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [status,     setStatus]     = useState<GameStatus>(GameStatus.IDLE);
  const [hintsUsed,  setHintsUsed]  = useState(0);
  const [timeTaken,  setTimeTaken]  = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const startRef  = useRef<number | null>(null);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;

  // Word master state
  const [sourceTiles,     setSourceTiles]     = useState<string[]>([]);
  const [input,           setInput]           = useState<string[]>([]);
  const [selectedTileIdx, setSelectedTileIdx] = useState<number | null>(null);
  const [revealedSlots,   setRevealedSlots]   = useState<boolean[]>([]);
  const [shaking,         setShaking]         = useState(false);

  // Cryptogram state
  const [cipherMap,          setCipherMap]          = useState<Record<string, string>>({});
  const [selectedCipher,     setSelectedCipher]     = useState<string | null>(null);
  const [revealedCipherKeys, setRevealedCipherKeys] = useState<string[]>([]);

  const { isLocked, lockReason } = checkLock(date);

  // ─── Timer ────────────────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    if (startRef.current) return;
    startRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeTaken(Math.floor((Date.now() - startRef.current!) / 1000));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  useEffect(() => () => stopTimer(), [stopTimer]);

  // ─── Load puzzle ──────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setStatus(GameStatus.IDLE);
    setHintsUsed(0);
    setTimeTaken(0);
    setFinalScore(0);
    setShaking(false);
    setSelectedTileIdx(null);
    setSelectedCipher(null);
    stopTimer();
    startRef.current = null;

    generateDailyPuzzle(date).then(async p => {
      if (cancelled) return;
      setPuzzle(p);

      // Check already solved
      const saved = await dbInstance.getDailyActivity(date);
      if (saved?.solved) {
        setStatus(GameStatus.WON);
        setTimeTaken(saved.timeTaken);
        setFinalScore(saved.score);
        setLoading(false);
        return;
      }

      // Restore progress
      const prog = await dbInstance.getPuzzleProgress(date);

      if (p.puzzleType === 'word_master') {
        const restored: string[] = prog ? JSON.parse(prog.progressState) : Array(p.targetWord.length).fill('');
        const used = restored.filter(Boolean);
        const tiles = [...p.scrambledLetters];
        for (const letter of used) {
          const idx = tiles.findIndex(t => t === letter);
          if (idx !== -1) tiles[idx] = '';
        }
        setSourceTiles(tiles);
        setInput(restored);
        setRevealedSlots(Array(p.targetWord.length).fill(false));
      } else {
        const restored: Record<string, string> = prog ? JSON.parse(prog.progressState) : {};
        setCipherMap(restored);
        setRevealedCipherKeys([]);
      }

      setLoading(false);
    }).catch(() => setLoading(false));

    return () => { cancelled = true; };
  }, [date, stopTimer]);

  // ─── Save progress ────────────────────────────────────────────────────────
  const saveProgress = useCallback((state: string) => {
    dbInstance.savePuzzleProgress({
      date,
      progressState: state,
      hintsUsed,
      startedAt: startRef.current ?? Date.now(),
    });
  }, [date, hintsUsed]);

  // ─── Win handler ──────────────────────────────────────────────────────────
  const handleWin = useCallback(async (hints: number, time: number, p: PuzzleData) => {
    stopTimer();
    const score = calculateScore(p.baseScore, time, hints, p.difficulty);
    setFinalScore(score);
    setStatus(GameStatus.WON);

    const diffMap = { Easy: 1, Medium: 2, Hard: 3 };
    const activity: DailyActivity = {
      date, solved: true, score, timeTaken: time,
      difficulty: diffMap[p.difficulty], synced: false, puzzleType: p.puzzleType,
    };
    await dbInstance.saveDailyActivity(activity);

    const session = await dbInstance.getSession();
    if (session) {
      const proof = await generateProof(session.userId, date, score);
      await dbInstance.addToSyncQueue({
        userId: session.userId, date, score, timeTaken: time,
        difficulty: diffMap[p.difficulty], puzzleType: p.puzzleType, proof,
      });
    }

    // Achievements
    const now = Date.now();
    if (p.difficulty === 'Hard')  await dbInstance.saveAchievement({ id: 'hard_cracker', unlockedAt: now });
    if (hints === 0)              await dbInstance.saveAchievement({ id: 'no_hints',     unlockedAt: now });
    if (time < 60)                await dbInstance.saveAchievement({ id: 'speed_run',    unlockedAt: now });

    window.dispatchEvent(new CustomEvent('puzzle-completed', { detail: { score } }));
  }, [date, stopTimer]);

  // ─── Shake feedback ───────────────────────────────────────────────────────
  const triggerShake = useCallback(() => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  }, []);

  // ─── Hint ─────────────────────────────────────────────────────────────────
  const useHint = useCallback(() => {
    if (!puzzle || hintsUsed >= 3) return;
    const newCount = hintsUsed + 1;
    setHintsUsed(newCount);

    if (puzzle.puzzleType === 'word_master') {
      const target = puzzle.targetWord;
      setInput(prev => {
        const next = [...prev];
        for (let i = 0; i < target.length; i++) {
          if (next[i] !== target[i] && !revealedSlots[i]) {
            const letter = target[i];
            // Remove from source tiles
            setSourceTiles(tiles => {
              const t = [...tiles];
              const ti = t.indexOf(letter);
              if (ti !== -1) t[ti] = '';
              return t;
            });
            next[i] = letter;
            setRevealedSlots(r => { const rr = [...r]; rr[i] = true; return rr; });
            break;
          }
        }
        return next;
      });
    } else if (puzzle.cipher) {
      // Reveal one unmapped encoded letter
      const encoded   = puzzle.quote || '';
      const uniqueEnc = [...new Set(encoded.replace(/ /g, '').split(''))];
      const unmapped  = uniqueEnc.filter(c => !cipherMap[c] && !revealedCipherKeys.includes(c));
      if (!unmapped.length) return;
      const pick = unmapped[Math.floor(Math.random() * unmapped.length)];
      // Find what plain letter this encoded char corresponds to
      const plain = Object.entries(puzzle.cipher).find(([, enc]) => enc === pick)?.[0];
      if (plain) {
        setCipherMap(prev => ({ ...prev, [pick]: plain }));
        setRevealedCipherKeys(prev => [...prev, pick]);
      }
    }
  }, [puzzle, hintsUsed, revealedSlots, cipherMap, revealedCipherKeys]);

  // ─── Main dispatch ────────────────────────────────────────────────────────
  const updatePuzzleState = useCallback((action: PuzzleAction) => {
    if (!puzzle) return;
    if (status === GameStatus.WON || status === GameStatus.LOST) return;

    // Start timer on first interaction
    if (status === GameStatus.IDLE) {
      setStatus(GameStatus.PLAYING);
      startTimer();
    }

    // ── WORD MASTER ──────────────────────────────────────────────────────
    if (puzzle.puzzleType === 'word_master') {
      if (action.type === 'SELECT_TILE') {
        setSelectedTileIdx(prev => prev === action.idx ? null : action.idx);
        return;
      }

      if (action.type === 'PLACE_TILE') {
        if (selectedTileIdx === null) {
          // Unplace slot letter
          setInput(prev => {
            const next = [...prev];
            const letter = next[action.slotIdx];
            if (!letter || revealedSlots[action.slotIdx]) return prev;
            next[action.slotIdx] = '';
            setSourceTiles(tiles => {
              const t = [...tiles]; const ei = t.indexOf('');
              if (ei !== -1) t[ei] = letter; return t;
            });
            return next;
          });
          return;
        }
        const letter = sourceTiles[selectedTileIdx];
        if (!letter) { setSelectedTileIdx(null); return; }

        setSourceTiles(tiles => {
          const t = [...tiles];
          // If slot occupied, return its letter back
          const displaced = input[action.slotIdx];
          if (displaced && !revealedSlots[action.slotIdx]) t[selectedTileIdx!] = displaced;
          else t[selectedTileIdx!] = '';
          return t;
        });
        setInput(prev => {
          const next = [...prev];
          next[action.slotIdx] = letter;
          return next;
        });
        setSelectedTileIdx(null);
        saveProgress(JSON.stringify(input.map((v, i) => i === action.slotIdx ? letter : v)));
        return;
      }

      if (action.type === 'CLEAR_SLOT') {
        if (revealedSlots[action.slotIdx]) return;
        const letter = input[action.slotIdx];
        if (!letter) return;
        setInput(prev => { const n = [...prev]; n[action.slotIdx] = ''; return n; });
        setSourceTiles(tiles => { const t = [...tiles]; const ei = t.indexOf(''); if (ei !== -1) t[ei] = letter; return t; });
        return;
      }

      if (action.type === 'KEY_PRESS') {
        const key = action.key;
        if (key === 'Backspace') {
          // Clear last filled slot
          setInput(prev => {
            const n = [...prev];
            for (let i = n.length - 1; i >= 0; i--) {
              if (n[i] && !revealedSlots[i]) {
                const l = n[i];
                n[i] = '';
                setSourceTiles(t => { const tt = [...t]; const ei = tt.indexOf(''); if (ei !== -1) tt[ei] = l; return tt; });
                break;
              }
            }
            return n;
          });
          return;
        }
        if (!/^[A-Za-z]$/.test(key)) return;
        const upper = key.toUpperCase();
        const tileIdx = sourceTiles.indexOf(upper);
        if (tileIdx === -1) return;
        const slotIdx = input.indexOf('');
        if (slotIdx === -1) return;
        setSourceTiles(t => { const tt = [...t]; tt[tileIdx] = ''; return tt; });
        setInput(prev => { const n = [...prev]; n[slotIdx] = upper; return n; });
        return;
      }

      if (action.type === 'SUBMIT_WORD') {
        const word = input.join('');
        if (word.length < puzzle.targetWord.length) { triggerShake(); return; }
        if (word === puzzle.targetWord) {
          handleWin(hintsUsed, timeTaken, puzzle);
        } else {
          triggerShake();
        }
        return;
      }

      if (action.type === 'RESET') {
        setSourceTiles([...puzzle.scrambledLetters]);
        setInput(Array(puzzle.targetWord.length).fill(''));
        setRevealedSlots(Array(puzzle.targetWord.length).fill(false));
        setSelectedTileIdx(null);
        setHintsUsed(0);
        return;
      }
    }

    // ── CRYPTOGRAM ───────────────────────────────────────────────────────
    if (puzzle.puzzleType === 'cryptogram') {
      if (action.type === 'SELECT_CIPHER') {
        setSelectedCipher(prev => prev === action.char ? null : action.char);
        return;
      }

      if (action.type === 'INPUT_CIPHER') {
        if (!selectedCipher) return;
        const upper = action.plain.toUpperCase();
        if (!/^[A-Z]$/.test(upper)) return;
        const enc = selectedCipher;
        setCipherMap(prev => {
          const next = { ...prev };
          next[enc] = upper;
          saveProgress(JSON.stringify(next));
          return next;
        });
        // Auto-advance to next unfilled encoded char
        const uniqueEnc = [...new Set((puzzle.quote || '').replace(/ /g, '').split(''))];
        const idx = uniqueEnc.indexOf(enc);
        for (let i = idx + 1; i < uniqueEnc.length; i++) {
          if (!cipherMap[uniqueEnc[i]] && !revealedCipherKeys.includes(uniqueEnc[i])) {
            setSelectedCipher(uniqueEnc[i]);
            return;
          }
        }
        setSelectedCipher(null);
        return;
      }

      if (action.type === 'CLEAR_CIPHER') {
        if (revealedCipherKeys.includes(action.char)) return;
        setCipherMap(prev => { const n = { ...prev }; delete n[action.char]; return n; });
        return;
      }

      if (action.type === 'SUBMIT_CRYPTO') {
        const encoded   = puzzle.quote || '';
        const uniqueEnc = [...new Set(encoded.replace(/ /g, '').split(''))];
        const allFilled = uniqueEnc.every(c => cipherMap[c] || revealedCipherKeys.includes(c));
        if (!allFilled) { triggerShake(); return; }

        // Decode using user's map + revealed keys
        const decoded = encoded.split('').map(c => {
          if (c === ' ') return ' ';
          if (revealedCipherKeys.includes(c)) {
            return Object.entries(puzzle.cipher || {}).find(([, v]) => v === c)?.[0] || c;
          }
          return cipherMap[c] || '?';
        }).join('');

        if (decoded === puzzle.targetWord) {
          handleWin(hintsUsed, timeTaken, puzzle);
        } else {
          triggerShake();
        }
        return;
      }

      if (action.type === 'RESET') {
        setCipherMap({});
        setRevealedCipherKeys([]);
        setSelectedCipher(null);
        setHintsUsed(0);
        return;
      }
    }
  }, [puzzle, status, sourceTiles, input, selectedTileIdx, revealedSlots,
      cipherMap, selectedCipher, revealedCipherKeys,
      hintsUsed, timeTaken, startTimer, handleWin, triggerShake, saveProgress]);

  return {
    puzzle, status, isLocked, lockReason, loading,
    hintsUsed, timeTaken, finalScore,
    input, sourceTiles, selectedTileIdx, revealedSlots, shaking,
    cipherMap, selectedCipher, revealedCipherKeys,
    updatePuzzleState, useHint,
  };
}
