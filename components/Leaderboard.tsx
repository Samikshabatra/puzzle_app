import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RefreshCw, WifiOff, Crown, Medal, Clock, Zap, ChevronUp } from 'lucide-react';

type Tab = 'today' | 'week' | 'alltime';

interface Entry {
  rank: number; userId: string; displayName: string; isGuest: boolean;
  avatarColor: string; score: number; timeTaken: number;
  difficulty: number; puzzleType: string; gamesPlayed: number;
}

interface Props { currentUserId: string; isOnline: boolean; }

// In production on Vercel, VITE_BACKEND_URL is empty → relative URLs hit the same-domain API
const BACKEND = ((import.meta as any).env?.VITE_BACKEND_URL || '').replace(/\/$/, '');
const DIFF    = ['','Easy','Medium','Hard'];
const DCOL    = ['','text-emerald-600 bg-emerald-50 border-emerald-200','text-amber-600 bg-amber-50 border-amber-200','text-red-600 bg-red-50 border-red-200'];
const fmt     = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

function RankBadge({ rank }: { rank: number }) {
  if (rank===1) return <Crown className="w-4 h-4 text-yellow-500"/>;
  if (rank===2) return <Medal className="w-4 h-4 text-slate-400"/>;
  if (rank===3) return <Medal className="w-4 h-4 text-amber-600"/>;
  return <span className="text-xs font-mono font-bold text-brand-deep/30 w-4 text-center">{rank}</span>;
}

export default function Leaderboard({ currentUserId, isOnline }: Props) {
  const [tab,     setTab]     = useState<Tab>('today');
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string|null>(null);

  const load = useCallback(async (t: Tab) => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${BACKEND}/leaderboard?tab=${t}`, { signal: AbortSignal.timeout(12000) });
      const data = await res.json().catch(() => ({}));
      // 500 with leaderboard[] means DB unavailable — show empty, not error
      if (!res.ok && !Array.isArray(data.leaderboard)) {
        throw new Error(`Server error (${res.status})`);
      }
      setEntries(data.leaderboard || []);
    } catch (e: any) {
      // In local dev with no API server running, treat as empty rather than error
      if (e.name === 'TimeoutError' || e.name === 'AbortError') {
        setError('Request timed out. Is the API server running? (npm run dev:api)');
      } else if (e.message?.includes('Failed to fetch') || e.message?.includes('NetworkError') || e.message?.includes('ECONNREFUSED')) {
        setEntries([]);
        setError(null); // No backend locally — just show empty leaderboard
      } else {
        setError(e.message || 'Failed to load leaderboard.');
      }
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOnline) load(tab);
    else { setLoading(false); setError(null); }
  }, [tab, isOnline, load]);

  const myRank = entries.findIndex(e => e.userId === currentUserId) + 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="w-5 h-5 text-yellow-500"/>
          <h2 className="font-black text-xl tracking-tight text-brand-deep">Rankings</h2>
          {myRank > 0 && (
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
              You #{myRank}
            </span>
          )}
        </div>
        <button onClick={() => load(tab)} disabled={loading||!isOnline}
          className="p-2.5 rounded-xl border border-brand-soft bg-white hover:border-brand-primary/40 transition-colors shadow-premium disabled:opacity-40">
          <RefreshCw className={`w-4 h-4 text-brand-primary ${loading?'animate-spin':''}`}/>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white rounded-2xl p-1 border border-brand-soft shadow-premium">
        {(['today','week','alltime'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
              tab===t ? 'bg-brand-primary text-white shadow-sm' : 'text-brand-deep/40 hover:text-brand-deep'
            }`}>
            {t==='today'?'Today':t==='week'?'This Week':'All Time'}
          </button>
        ))}
      </div>

      {/* States */}
      <AnimatePresence mode="wait">
        {!isOnline && (
          <motion.div key="offline" initial={{opacity:0}} animate={{opacity:1}}
            className="glass-panel rounded-3xl p-10 text-center space-y-3">
            <WifiOff className="w-8 h-8 text-brand-deep/20 mx-auto"/>
            <p className="text-brand-deep/50 text-sm font-semibold">You're offline</p>
            <p className="text-brand-deep/30 text-xs">Rankings load when connected</p>
          </motion.div>
        )}

        {isOnline && loading && (
          <motion.div key="loading" initial={{opacity:0}} animate={{opacity:1}} className="space-y-3">
            {[...Array(6)].map((_,i) => (
              <div key={i} className="h-16 bg-white rounded-2xl border border-brand-soft animate-pulse" style={{animationDelay:`${i*80}ms`}}/>
            ))}
          </motion.div>
        )}

        {isOnline && !loading && error && (
          <motion.div key="error" initial={{opacity:0}} animate={{opacity:1}}
            className="glass-panel rounded-3xl p-8 text-center space-y-4 border-brand-accent/20">
            <p className="text-brand-accent text-sm font-mono">{error}</p>
            <button onClick={()=>load(tab)} className="border border-brand-soft bg-white text-brand-deep text-xs font-black uppercase tracking-widest px-5 py-2.5 rounded-xl hover:border-brand-primary/40 transition-colors shadow-premium">
              Retry
            </button>
          </motion.div>
        )}

        {isOnline && !loading && !error && entries.length===0 && (
          <motion.div key="empty" initial={{opacity:0}} animate={{opacity:1}}
            className="glass-panel rounded-3xl p-10 text-center space-y-3">
            <Trophy className="w-8 h-8 text-brand-deep/20 mx-auto"/>
            <p className="text-brand-deep/50 text-sm font-semibold">No scores yet</p>
            <p className="text-brand-deep/30 text-xs">
              {tab==='today'?"Be the first to solve today's puzzle!":'Complete puzzles to appear here'}
            </p>
          </motion.div>
        )}

        {isOnline && !loading && !error && entries.length>0 && (
          <motion.div key="list" initial={{opacity:0}} animate={{opacity:1}} className="space-y-2">
            {entries.map((entry, i) => {
              const isMe = entry.userId === currentUserId;
              return (
                <motion.div key={entry.userId} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                    isMe ? 'bg-brand-primary/5 border-brand-primary/30' : 'bg-white border-brand-soft hover:border-brand-soft/80'
                  } shadow-premium`}>
                  {/* Rank */}
                  <div className="w-5 flex items-center justify-center flex-shrink-0">
                    <RankBadge rank={entry.rank}/>
                  </div>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: entry.avatarColor || '#2563EB' }}>
                    {entry.displayName.slice(0,2).toUpperCase()}
                  </div>
                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-bold truncate ${isMe?'text-brand-primary':'text-brand-deep'}`}>
                        {entry.displayName}
                        {isMe && <span className="text-[10px] text-brand-primary/50 ml-1 font-black">YOU</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] font-black uppercase tracking-wider border rounded px-1.5 py-0.5 ${DCOL[entry.difficulty]||DCOL[1]}`}>
                        {DIFF[entry.difficulty]||'Easy'}
                      </span>
                      <span className="text-[9px] text-brand-deep/30 font-semibold">
                        {entry.puzzleType==='cryptogram'?'Cryptogram':'Word Master'}
                      </span>
                    </div>
                  </div>
                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <Zap className="w-3 h-3 text-brand-primary"/>
                      <span className="font-mono font-black text-sm text-brand-primary">{entry.score.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-brand-deep/30"/>
                      <span className="font-mono text-[10px] text-brand-deep/40">{fmt(entry.timeTaken)}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {entries.length > 10 && (
              <button onClick={()=>window.scrollTo({top:0,behavior:'smooth'})}
                className="w-full py-3 text-brand-deep/30 hover:text-brand-deep/50 text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                <ChevronUp className="w-3 h-3"/> Back to top
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
