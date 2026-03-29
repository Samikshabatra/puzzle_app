import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, RotateCcw, CheckCircle2, Clock, Sparkles, Share2, Delete } from 'lucide-react';
import { PuzzleData, GameStatus } from '../types';
import { PuzzleState } from '../hooks/usePuzzle';

interface Props { puzzle: PuzzleData; engine: PuzzleState; }

const fmt = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

const diffStyle: Record<string, string> = {
  Easy:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  Medium: 'bg-amber-50   text-amber-700   border-amber-200',
  Hard:   'bg-red-50     text-red-700     border-red-200',
};

export default function SequenceBoard({ puzzle, engine }: Props) {
  const { status, cipherMap, selectedCipher, revealedCipherKeys, shaking,
          hintsUsed, timeTaken, finalScore, updatePuzzleState, useHint } = engine;

  const encoded    = puzzle.quote || '';
  const words      = encoded.split(' ');
  const uniqueEnc  = [...new Set(encoded.replace(/ /g,'').split(''))].sort();
  const filledCount = uniqueEnc.filter(c => cipherMap[c] || revealedCipherKeys.includes(c)).length;
  const progress    = uniqueEnc.length ? Math.round((filledCount/uniqueEnc.length)*100) : 0;

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (status === GameStatus.WON) return;
      if (!selectedCipher) return;
      if (e.key === 'Enter')    { updatePuzzleState({ type:'SUBMIT_CRYPTO' }); return; }
      if (e.key === 'Backspace'||e.key==='Delete') { updatePuzzleState({ type:'CLEAR_CIPHER', char: selectedCipher }); return; }
      if (/^[A-Za-z]$/.test(e.key)) updatePuzzleState({ type:'INPUT_CIPHER', plain: e.key });
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedCipher, status, updatePuzzleState]);

  const share = () => {
    const text = `🔐 Bluestock · Cryptogram\n📅 ${puzzle.date}\n💬 "${puzzle.targetWord.slice(0,40)}..."\n✍️ ${puzzle.author}\n⭐ Score: ${finalScore}\nbluestock.in`;
    if (navigator.share) navigator.share({ title:'Bluestock', text });
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
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-brand-secondary/10 border border-brand-secondary/20 text-brand-secondary">
            Cryptogram
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-brand-deep/50">
          <Clock className="w-3.5 h-3.5"/>
          <span className="font-mono text-sm tabular-nums font-bold">{fmt(timeTaken)}</span>
        </div>
      </div>

      {/* Win state */}
      <AnimatePresence>
        {status === GameStatus.WON && (
          <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
            className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto"/>
            <p className="font-black text-xl text-emerald-700">Deciphered!</p>
            <p className="text-brand-deep/60 text-sm italic max-w-xs mx-auto">"{puzzle.targetWord}"</p>
            <p className="text-brand-deep/40 text-xs font-bold">— {puzzle.author}</p>
            <div className="flex justify-center gap-8 mt-2">
              {[['Score',finalScore.toLocaleString(),'text-brand-primary'],['Time',fmt(timeTaken),'text-brand-deep'],['Hints',`${hintsUsed}/3`,'text-brand-deep']].map(([l,v,c])=>(
                <div key={l} className="text-center">
                  <div className={`font-mono font-black text-xl ${c}`}>{v}</div>
                  <div className="text-brand-deep/40 text-xs font-semibold">{l}</div>
                </div>
              ))}
            </div>
            <motion.button whileTap={{scale:0.95}} onClick={share}
              className="mx-auto flex items-center gap-2 border border-brand-soft bg-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-brand-deep hover:border-brand-primary/40 transition-colors">
              <Share2 className="w-3.5 h-3.5"/> Share
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {status !== GameStatus.WON && (
        <>
          {/* Author + info */}
          <div className="bg-white/60 rounded-2xl p-4 border border-brand-soft">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 mb-1">Author</p>
            <p className="text-brand-deep font-bold text-sm">{puzzle.author}</p>
            <p className="text-brand-deep/40 text-xs mt-1">{puzzle.clues[2]}</p>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-brand-deep/40">
              <span>DECODING PROGRESS</span>
              <span>{filledCount}/{uniqueEnc.length} letters mapped</span>
            </div>
            <div className="h-1.5 bg-brand-soft rounded-full overflow-hidden">
              <motion.div animate={{ width:`${progress}%` }} transition={{ duration:0.4 }}
                className="h-full bg-brand-primary rounded-full"/>
            </div>
          </div>

          {/* Encoded quote */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 mb-3">Tap an encoded letter to map it</p>
            <motion.div animate={shaking?{x:[-5,5,-3,3,0]}:{}} transition={{duration:0.4}}
              className="flex flex-wrap gap-x-4 gap-y-5">
              {words.map((word, wi) => (
                <div key={wi} className="flex gap-1.5">
                  {word.split('').map((char, ci) => {
                    const guess     = cipherMap[char];
                    const revealed  = revealedCipherKeys.includes(char);
                    const selected  = selectedCipher === char;
                    const plain     = revealed
                      ? Object.entries(puzzle.cipher||{}).find(([,v])=>v===char)?.[0] || char
                      : guess;
                    return (
                      <motion.div key={ci} className="flex flex-col items-center gap-1">
                        <motion.button whileTap={{scale:0.88}}
                          onClick={() => updatePuzzleState({ type:'SELECT_CIPHER', char })}
                          className={`w-8 h-9 sm:w-9 sm:h-10 rounded-lg flex items-center justify-center font-mono font-black text-sm relative border-2 transition-all duration-150 ${
                            selected
                              ? 'border-brand-primary bg-brand-primary/10 text-brand-primary scale-110'
                              : revealed
                                ? 'border-amber-400 bg-amber-50 text-amber-700'
                                : plain
                                  ? 'border-brand-soft bg-white text-brand-deep hover:border-brand-primary/40'
                                  : 'border-dashed border-brand-soft bg-white/50 text-transparent hover:border-brand-primary/30'
                          }`}>
                          {plain || '·'}
                          {revealed && <Sparkles className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 text-amber-500"/>}
                        </motion.button>
                        <span className="text-[9px] font-mono font-bold text-brand-deep/30">{char}</span>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </motion.div>
          </div>

          {/* Letter keyboard */}
          {selectedCipher && (
            <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
              className="bg-brand-primary/5 rounded-2xl p-4 border border-brand-primary/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary/60 mb-3">
                Mapping: <span className="text-brand-primary">{selectedCipher}</span>
                {' → '}
                <span className="text-brand-deep">{cipherMap[selectedCipher] || '?'}</span>
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
                  const inUse = Object.values(cipherMap).includes(letter) && cipherMap[selectedCipher] !== letter;
                  return (
                    <motion.button key={letter} whileTap={{scale:0.85}}
                      onClick={() => updatePuzzleState({ type:'INPUT_CIPHER', plain:letter })}
                      disabled={inUse}
                      className={`w-8 h-8 rounded-lg text-xs font-mono font-bold border transition-all duration-100 ${
                        cipherMap[selectedCipher]===letter
                          ? 'bg-brand-primary text-white border-brand-primary'
                          : inUse
                            ? 'bg-white border-brand-soft text-brand-deep/20 cursor-not-allowed'
                            : 'bg-white border-brand-soft text-brand-deep hover:border-brand-primary/50'
                      }`}>
                      {letter}
                    </motion.button>
                  );
                })}
              </div>
              <button onClick={() => updatePuzzleState({ type:'CLEAR_CIPHER', char:selectedCipher })}
                className="mt-3 flex items-center gap-1.5 text-brand-deep/40 hover:text-brand-accent text-[11px] font-semibold transition-colors">
                <Delete className="w-3 h-3"/> Clear this mapping
              </button>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <motion.button whileTap={{scale:0.95}} onClick={useHint} disabled={hintsUsed>=3}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-brand-soft bg-white text-brand-deep/70 text-xs font-black uppercase tracking-widest hover:border-brand-primary/40 transition-colors disabled:opacity-40 shadow-premium">
              <Lightbulb className="w-4 h-4 text-amber-500"/> Hint <span className="text-brand-deep/30">({3-hintsUsed})</span>
            </motion.button>
            <motion.button whileTap={{scale:0.95}} onClick={() => updatePuzzleState({ type:'RESET' })}
              className="px-4 py-3 rounded-xl border border-brand-soft bg-white text-brand-deep/60 hover:border-brand-primary/40 transition-colors shadow-premium">
              <RotateCcw className="w-4 h-4"/>
            </motion.button>
            <motion.button whileTap={{scale:0.95}} onClick={() => updatePuzzleState({ type:'SUBMIT_CRYPTO' })}
              disabled={filledCount < uniqueEnc.length}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-secondary text-white text-xs font-black uppercase tracking-widest shadow-glass disabled:opacity-40">
              Decode <CheckCircle2 className="w-4 h-4"/>
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
}
