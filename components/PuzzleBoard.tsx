import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, RotateCcw, CheckCircle2, Clock, Sparkles, Share2 } from 'lucide-react';
import { PuzzleData, GameStatus } from '../types';
import { PuzzleState, PuzzleAction } from '../hooks/usePuzzle';

interface Props {
  puzzle:      PuzzleData;
  status:      GameStatus;
  input:       string[];
  hintsUsed:   number;
  timeTaken:   number;
  finalScore:  number;
  onUpdate:    (a: PuzzleAction) => void;
  onUseHint:   () => void;
}

const fmt = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

const diffStyle: Record<string, string> = {
  Easy:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50   text-amber-700   border-amber-200',
  Hard:   'bg-red-50     text-red-700     border-red-200',
};

export default function PuzzleBoard({ puzzle, status, input, hintsUsed, timeTaken, finalScore, onUpdate, onUseHint }: Props) {
  // Need full engine state — access via window event but we get it from props
  // sourceTiles + revealedSlots + selectedTileIdx + shaking come from hook
  // We re-export them via a ref trick — instead we take them all as props
  // (App.tsx passes engine directly, so we'll accept the full engine shape)
  return null; // placeholder — see PuzzleBoardFull below
}

// The real component — App.tsx will import this directly
export function PuzzleBoardFull({ puzzle, engine }: { puzzle: PuzzleData; engine: PuzzleState }) {
  const { status, input, sourceTiles, selectedTileIdx, revealedSlots, shaking,
          hintsUsed, timeTaken, finalScore, updatePuzzleState, useHint } = engine;

  // Keyboard handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      if (status === GameStatus.WON) return;
      if (e.key === 'Enter')     { updatePuzzleState({ type: 'SUBMIT_WORD' }); return; }
      if (e.key === 'Backspace') { updatePuzzleState({ type: 'KEY_PRESS', key: 'Backspace' }); return; }
      if (/^[A-Za-z]$/.test(e.key)) updatePuzzleState({ type: 'KEY_PRESS', key: e.key });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [status, updatePuzzleState]);

  const allPlaced = input.every(l => l !== '');

  const share = () => {
    const text = `🧠 Bluestock · Word Master\n📅 ${puzzle.date}\n⭐ Score: ${finalScore}\n⏱ Time: ${fmt(timeTaken)}\n💡 Hints: ${hintsUsed}/3\nbluestock.in`;
    if (navigator.share) navigator.share({ title: 'Bluestock', text });
    else navigator.clipboard.writeText(text);
  };

  return (
    <div className="glass-panel rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${diffStyle[puzzle.difficulty]}`}>
            {puzzle.difficulty}
          </span>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
            Word Master
          </span>
          <span className="text-[10px] text-brand-deep/50 font-semibold">{puzzle.theme}</span>
        </div>
        <div className="flex items-center gap-1.5 text-brand-deep/50">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-mono text-sm tabular-nums font-bold">{fmt(timeTaken)}</span>
        </div>
      </div>

      {/* Win state */}
      <AnimatePresence>
        {status === GameStatus.WON && (
          <motion.div initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
            className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <div>
              <p className="font-black text-xl text-emerald-700 tracking-tight">Solved!</p>
              <p className="text-emerald-600 font-bold text-sm mt-1">The word was <span className="font-mono bg-white px-1.5 py-0.5 rounded">{puzzle.targetWord}</span></p>
            </div>
            <div className="flex justify-center gap-8 text-sm">
              {[['Score', finalScore.toLocaleString(), 'text-brand-primary'],
                ['Time',  fmt(timeTaken),              'text-brand-deep'],
                ['Hints', `${hintsUsed}/3`,            'text-brand-deep']].map(([l,v,c])=>(
                <div key={l} className="text-center">
                  <div className={`font-mono font-black text-xl ${c}`}>{v}</div>
                  <div className="text-brand-deep/40 text-xs font-semibold">{l}</div>
                </div>
              ))}
            </div>
            <motion.button whileTap={{scale:0.95}} onClick={share}
              className="mx-auto flex items-center gap-2 border border-brand-soft bg-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-brand-deep hover:border-brand-primary/40 transition-colors">
              <Share2 className="w-3.5 h-3.5"/> Share Result
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {status !== GameStatus.WON && (
        <>
          {/* Clues */}
          <div className="space-y-2.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40">Clues</p>
            {puzzle.clues.map((clue, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black flex items-center justify-center mt-0.5">{i+1}</span>
                <p className="text-brand-deep/70 text-sm leading-snug">{clue}</p>
              </div>
            ))}
          </div>

          {/* Answer slots */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 mb-3">Your Answer</p>
            <motion.div animate={shaking ? { x:[-6,6,-4,4,-2,2,0] } : {}} transition={{ duration:0.4 }}
              className="flex gap-2 flex-wrap justify-center">
              {input.map((letter, i) => (
                <motion.button key={i} whileTap={{scale:0.9}}
                  onClick={() => updatePuzzleState({ type: 'PLACE_TILE', slotIdx: i })}
                  className={`answer-slot relative ${letter ? (revealedSlots[i] ? 'answer-slot-hint' : 'answer-slot-filled') : ''}`}>
                  <span className="font-mono font-black text-lg">{letter || <span className="text-brand-deep/20 text-xs font-bold">{i+1}</span>}</span>
                  {revealedSlots[i] && <Sparkles className="absolute -top-1.5 -right-1.5 w-3 h-3 text-amber-500"/>}
                </motion.button>
              ))}
            </motion.div>
          </div>

          {/* Source tiles */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 mb-3">Available Letters — tap to select, tap slot to place</p>
            <div className="flex gap-2 flex-wrap justify-center">
              {sourceTiles.map((letter, i) => (
                <motion.button key={i} whileTap={{scale:0.85}}
                  onClick={() => letter && updatePuzzleState({ type: 'SELECT_TILE', idx: i })}
                  className={`letter-tile ${!letter ? 'opacity-0 pointer-events-none' : selectedTileIdx===i ? 'letter-tile-selected' : ''}`}>
                  {letter}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button whileTap={{scale:0.95}} onClick={useHint} disabled={hintsUsed>=3}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-brand-soft bg-white text-brand-deep/70 text-xs font-black uppercase tracking-widest hover:border-brand-primary/40 transition-colors disabled:opacity-40 shadow-premium">
              <Lightbulb className="w-4 h-4 text-amber-500"/>
              Hint <span className="text-brand-deep/30">({3-hintsUsed})</span>
            </motion.button>
            <motion.button whileTap={{scale:0.95}} onClick={() => updatePuzzleState({ type:'RESET' })}
              className="px-4 py-3 rounded-xl border border-brand-soft bg-white text-brand-deep/60 hover:border-brand-primary/40 transition-colors shadow-premium">
              <RotateCcw className="w-4 h-4"/>
            </motion.button>
            <motion.button whileTap={{scale:0.95}} onClick={() => updatePuzzleState({ type:'SUBMIT_WORD' })} disabled={!allPlaced}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-primary text-white text-xs font-black uppercase tracking-widest shadow-glass disabled:opacity-40">
              Submit <CheckCircle2 className="w-4 h-4"/>
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}
