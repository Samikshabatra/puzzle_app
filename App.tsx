import React, { useState, useEffect, useMemo, Suspense, lazy, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layout, BarChart3, RefreshCcw, Calendar as CalendarIcon,
  User, CheckCircle2, Clock, ShieldAlert, Flame, Trophy
} from 'lucide-react';
import { usePuzzle } from './hooks/usePuzzle';
import { dbInstance } from './db/idb';
import { processSyncQueue } from './services/syncService';
import { calculateStreak } from './services/streakService';
import { DailyActivity, UserScore, StreakInfo, LockReason, UserSession, GameStatus } from './types';

// ─── Logo ─────────────────────────────────────────────────────────────────────
const BluestockLogo: React.FC<{ className?: string; showText?: boolean }> = ({ className = 'w-10 h-10', showText = false }) => (
  <div className={`flex items-center ${showText ? 'gap-3' : ''}`}>
    <svg viewBox="0 0 400 320" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="200" width="45" height="100" rx="15" fill="#5E35B1" transform="skewX(-10)" />
      <rect x="85" y="140" width="55" height="160" rx="20" fill="#673AB7" transform="skewX(-10)" />
      <rect x="160" y="80" width="65" height="220" rx="25" fill="#7E57C2" transform="skewX(-10)" />
      <path d="M40 280 Q 200 240 320 80" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <circle cx="320" cy="80" r="15" fill="#F05537" />
      <circle cx="320" cy="80" r="25" fill="#F05537" fillOpacity="0.2" />
    </svg>
    {showText && (
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black tracking-tighter text-brand-deep">BLUESTOCK</span>
        <span className="text-sm font-bold text-brand-deep opacity-60">.in</span>
      </div>
    )}
  </div>
);

const getLocalTodayStr = () => new Date().toLocaleDateString('en-CA');

// ─── Lazy imports ─────────────────────────────────────────────────────────────
const Heatmap      = lazy(() => import('./components/Heatmap'));
const ProfileView  = lazy(() => import('./components/ProfileView'));
const LoginScreen  = lazy(() => import('./components/LoginScreen'));
const Leaderboard  = lazy(() => import('./components/Leaderboard'));

// PuzzleBoard and SequenceBoard are imported directly (not default export)
import { PuzzleBoardFull } from './components/PuzzleBoard';
import SequenceBoard       from './components/SequenceBoard';

const Spinner = () => (
  <div className="min-h-screen bg-brand-bg flex items-center justify-center">
    <div className="relative">
      <div className="w-12 h-12 border-2 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin" />
      <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-b-brand-secondary/20 rounded-full animate-reverse-spin" />
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
const App: React.FC = () => {
  const todayStr     = useMemo(() => getLocalTodayStr(), []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const engine       = usePuzzle(selectedDate);

  const [session,        setSession]        = useState<UserSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [history,        setHistory]        = useState<DailyActivity[]>([]);
  const [view,           setView]           = useState<'daily'|'archives'|'profile'|'leaderboard'>('daily');
  const [justCompleted,  setJustCompleted]  = useState(false);
  const [isOnline,       setIsOnline]       = useState(navigator.onLine);
  const [syncing,        setSyncing]        = useState(false);
  const [achievements,   setAchievements]   = useState<any[]>([]);
  const [showSyncToast,  setShowSyncToast]  = useState(false);
  const [showStreakToast, setShowStreakToast]= useState(false);

  // Session load
  useEffect(() => {
    dbInstance.getSession().then(s => {
      setSession(s);
      setSessionLoading(false);
    }).catch(() => setSessionLoading(false));
  }, []);

  const handleLogin = useCallback(async (s: UserSession) => {
    await dbInstance.saveSession(s);
    setSession(s);
  }, []);

  const handleLogout = useCallback(async () => {
    await dbInstance.clearSession();
    setSession(null);
    setView('daily');
  }, []);

  const loadInitialData = useCallback(async () => {
    const [activities, unlocked] = await Promise.all([
      dbInstance.getAllDailyActivity(),
      dbInstance.getAchievements(),
    ]);
    setHistory([...activities]);
    setAchievements([...unlocked]);
  }, []);

  const handleSync = useCallback(async () => {
    if (!navigator.onLine || syncing) return;
    setSyncing(true);
    try { await processSyncQueue(); }
    finally { setSyncing(false); }
  }, [syncing]);

  useEffect(() => {
    const onOnline  = () => { setIsOnline(true);  };
    const onOffline = () => setIsOnline(false);
    const onView    = (e: any) => setView(e.detail);
    const onComplete = () => {
      setTimeout(loadInitialData, 100);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 4000);
      setShowStreakToast(true);
      setTimeout(() => setShowStreakToast(false), 3500);
      // Immediately sync score to leaderboard after puzzle completion
      if (navigator.onLine) {
        setTimeout(() => processSyncQueue(), 300);
      }
    };
    const onSync = () => {
      loadInitialData();
      setShowSyncToast(true);
      setTimeout(() => setShowSyncToast(false), 3000);
    };

    window.addEventListener('online',                  onOnline);
    window.addEventListener('offline',                 onOffline);
    window.addEventListener('switch-view',             onView);
    window.addEventListener('puzzle-completed',        onComplete);
    window.addEventListener('bluestock-sync-complete', onSync);

    loadInitialData();
    if (navigator.onLine) processSyncQueue();

    return () => {
      window.removeEventListener('online',                  onOnline);
      window.removeEventListener('offline',                 onOffline);
      window.removeEventListener('switch-view',             onView);
      window.removeEventListener('puzzle-completed',        onComplete);
      window.removeEventListener('bluestock-sync-complete', onSync);
    };
  }, [loadInitialData]);

  // Derived
  const heatmapData: UserScore[] = useMemo(() =>
    history.map(h => ({ date:h.date, score:h.score, timeTaken:h.timeTaken, synced:h.synced, attempts:1, difficulty:h.difficulty })),
  [history]);

  const streakInfo: StreakInfo = useMemo(() => calculateStreak(history), [history]);

  const stats = useMemo(() => ({
    avgScore:    history.length ? Math.round(history.reduce((a,b)=>a+b.score,0)/history.length) : 0,
    solvedCount: history.filter(h=>h.solved).length,
    ...streakInfo,
  }), [history, streakInfo]);

  const handleDateSelect = useCallback((date: string) => { setSelectedDate(date); setView('daily'); }, []);
  const resetToToday     = useCallback(() => { setSelectedDate(todayStr); setView('daily'); }, [todayStr]);

  // ─── Gates ────────────────────────────────────────────────────────────────
  if (sessionLoading) return <Spinner />;

  if (!session) {
    return (
      <Suspense fallback={<Spinner />}>
        <LoginScreen onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center pb-32 sm:pb-40 text-brand-deep selection:bg-brand-primary/20 bg-brand-bg font-sans relative">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] md:w-[60%] h-[60%] bg-brand-primary/8 blur-[140px] rounded-full animate-float" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-brand-secondary/8 blur-[100px] rounded-full animate-float" style={{ animationDelay:'3s' }} />
      </div>

      {/* Sync toast */}
      <AnimatePresence>
        {showSyncToast && (
          <motion.div
            initial={{ opacity:0, y:-20, x:'-50%' }} animate={{ opacity:1, y:0, x:'-50%' }} exit={{ opacity:0, y:-20, x:'-50%' }}
            className="fixed top-24 left-1/2 z-[100] bg-white/90 backdrop-blur-xl border border-brand-primary/30 px-6 py-3 rounded-full flex items-center gap-3 shadow-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-deep">Bluestock Synced</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak toast */}
      <AnimatePresence>
        {showStreakToast && streakInfo.currentStreak > 0 && (
          <motion.div
            initial={{ opacity:0, y:-20, x:'-50%', scale:0.8 }} animate={{ opacity:1, y:0, x:'-50%', scale:1 }} exit={{ opacity:0, y:-20, x:'-50%', scale:0.8 }}
            className="fixed top-24 left-1/2 z-[100] bg-white/90 backdrop-blur-xl border border-yellow-400/40 px-6 py-3 rounded-full flex items-center gap-3 shadow-xl">
            <Flame className="w-4 h-4 text-yellow-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-deep">
              🔥 {streakInfo.currentStreak} Day Streak!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="w-full sticky top-0 z-50 bg-white/60 backdrop-blur-2xl border-b border-brand-soft shadow-sm">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <motion.div whileHover={{ scale:1.05 }} className="flex items-center gap-3 cursor-pointer" onClick={resetToToday}>
            <BluestockLogo className="h-7 sm:h-8 md:h-10" showText />
          </motion.div>
          <div className="flex items-center gap-2 sm:gap-3">
            {streakInfo.currentStreak > 0 && (
              <motion.div initial={{scale:0}} animate={{scale:1}}
                className="hidden sm:flex items-center gap-1.5 bg-yellow-50 border border-yellow-400/30 px-3 py-1.5 rounded-full">
                <Flame className="w-3.5 h-3.5 text-yellow-500"/>
                <span className="text-[10px] font-black text-yellow-700 uppercase tracking-widest">{streakInfo.currentStreak}d</span>
              </motion.div>
            )}
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
              isOnline ? 'bg-emerald-50 border-emerald-300/40 text-emerald-700' : 'bg-red-50 border-red-300/40 text-red-600'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}/>
              {isOnline ? 'Online' : 'Offline'}
            </div>
            <motion.button whileTap={{ rotate:180 }} onClick={handleSync} disabled={syncing||!isOnline}
              className={`p-2 sm:p-2.5 bg-white/80 rounded-xl border border-brand-soft hover:border-brand-primary/50 transition-colors shadow-sm ${syncing?'animate-spin':''}`}>
              <RefreshCcw className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary"/>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="w-full max-w-2xl px-4 sm:px-6 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {engine.loading ? (
            <motion.div key="loader" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              className="flex flex-col items-center justify-center py-48 space-y-8">
              <div className="relative">
                <div className="w-16 h-16 border-2 border-brand-primary/10 border-t-brand-primary rounded-full animate-spin"/>
                <div className="absolute inset-0 w-16 h-16 border-2 border-transparent border-b-brand-secondary/20 rounded-full animate-reverse-spin"/>
              </div>
              <p className="text-brand-primary text-[10px] font-black uppercase tracking-[0.5em] animate-pulse text-center">
                Calibrating Synaptic Feed
              </p>
            </motion.div>

          ) : view === 'daily' ? (
            <motion.div key="game" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} className="space-y-8 sm:space-y-12">
              {/* Date + theme header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-8">
                <div className="space-y-3">
                  <motion.div initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} className="flex items-center gap-3">
                    <BluestockLogo className="w-5 h-5"/>
                    <p className="text-brand-primary font-black text-[10px] tracking-[0.4em] uppercase">
                      {selectedDate === todayStr ? 'Active Matrix' : 'Neural Archive Stream'}
                      {engine.puzzle?.puzzleType === 'cryptogram' ? ' · Cryptogram Mode' : ' · Word Master Mode'}
                    </p>
                  </motion.div>
                  <motion.h2 key={selectedDate} initial={{opacity:0,filter:'blur(10px)'}} animate={{opacity:1,filter:'blur(0px)'}}
                    className="text-4xl sm:text-5xl md:text-7xl font-black text-brand-deep tracking-tighter">
                    {engine.puzzle?.theme || 'Calibration'}
                  </motion.h2>
                </div>
                <motion.div whileHover={{scale:1.02}}
                  className="bg-white/70 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-brand-soft shadow-sm flex items-center gap-3 backdrop-blur-md self-start sm:self-auto">
                  <CalendarIcon className="w-4 h-4 text-brand-primary"/>
                  <span className="text-brand-deep font-bold text-xs sm:text-sm tracking-tight">
                    {new Date(selectedDate.replace(/-/g,'/')).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}
                  </span>
                </motion.div>
              </div>

              {/* Locked */}
              {engine.isLocked ? (
                <div className="glass-panel border-brand-soft rounded-[2rem] sm:rounded-[3rem] p-10 sm:p-16 text-center space-y-8">
                  {engine.lockReason === LockReason.PAST ? (
                    <>
                      <Clock className="w-12 h-12 text-brand-accent mx-auto drop-shadow-md"/>
                      <div className="space-y-3">
                        <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-deep">Temporal Decay</h3>
                        <p className="text-brand-deep/60 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed font-medium">
                          This neural sector has fallen into entropy. Puzzles must be calibrated on the day of their manifestation.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-12 h-12 text-brand-primary mx-auto drop-shadow-md"/>
                      <div className="space-y-3">
                        <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-brand-deep">Access Restricted</h3>
                        <p className="text-brand-deep/60 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed font-medium">
                          Future synaptic sequences are not yet authorized. Return when the timeline aligns.
                        </p>
                      </div>
                    </>
                  )}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={resetToToday}
                      className="w-full sm:w-auto bg-brand-primary text-white px-8 sm:px-10 py-3.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-glass">
                      Return to Active Matrix
                    </motion.button>
                    <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => setView('archives')}
                      className="w-full sm:w-auto bg-white/70 border border-brand-soft text-brand-deep px-8 sm:px-10 py-3.5 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-white">
                      Browse Archives
                    </motion.button>
                  </div>
                </div>

              ) : engine.puzzle ? (
                // ── Puzzle boards ────────────────────────────────────────────
                engine.puzzle.puzzleType === 'cryptogram' ? (
                  <SequenceBoard puzzle={engine.puzzle} engine={engine} />
                ) : (
                  <PuzzleBoardFull puzzle={engine.puzzle} engine={engine} />
                )

              ) : (
                <div className="glass-panel border-brand-soft rounded-[2rem] sm:rounded-[3rem] p-12 text-center space-y-6">
                  <RefreshCcw className="w-10 h-10 text-brand-accent mx-auto animate-spin"/>
                  <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-brand-deep">Neural Sync Timeout</h3>
                  <p className="text-brand-deep/60 text-xs sm:text-sm max-w-sm mx-auto">Unable to generate puzzle. Please refresh.</p>
                </div>
              )}
            </motion.div>

          ) : view === 'archives' ? (
            <motion.div key="archives" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
              <Suspense fallback={<div className="h-64 bg-white/20 animate-pulse rounded-[2.5rem]"/>}>
                <Heatmap scores={heatmapData} streakInfo={streakInfo} onDateSelect={handleDateSelect} justCompleted={justCompleted}/>
              </Suspense>
            </motion.div>

          ) : view === 'leaderboard' ? (
            <motion.div key="leaderboard" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
              <Suspense fallback={<div className="h-96 bg-white/20 animate-pulse rounded-3xl"/>}>
                <Leaderboard currentUserId={session?.userId||''} isOnline={isOnline}/>
              </Suspense>
            </motion.div>

          ) : (
            <motion.div key="profile" initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}}>
              <Suspense fallback={<div className="h-96 bg-white/20 animate-pulse rounded-3xl"/>}>
                <ProfileView session={session} achievements={achievements} stats={stats} isOnline={isOnline} onLogout={handleLogout}/>
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-3xl border border-white/60 rounded-full p-1 sm:p-1.5 flex gap-1 shadow-glass z-50">
        {[
          { key:'daily',       icon:<Layout  className="w-4 h-4 sm:w-5 sm:h-5"/>, label:'Active',   onClick:resetToToday,              active:view==='daily'&&selectedDate===todayStr, semi:view==='daily'&&selectedDate!==todayStr },
          { key:'archives',    icon:<BarChart3 className="w-4 h-4 sm:w-5 sm:h-5"/>, label:'Archives', onClick:()=>setView('archives'),   active:view==='archives' },
          { key:'leaderboard', icon:<Trophy   className="w-4 h-4 sm:w-5 sm:h-5"/>, label:'Ranks',    onClick:()=>setView('leaderboard'),active:view==='leaderboard' },
          { key:'profile',     icon:<User     className="w-4 h-4 sm:w-5 sm:h-5"/>, label:'Profile',  onClick:()=>setView('profile'),    active:view==='profile' },
        ].map(tab => (
          <button key={tab.key} onClick={tab.onClick}
            className={`px-3.5 sm:px-7 py-3 sm:py-3.5 rounded-full flex items-center gap-2 transition-all duration-300 ${
              tab.active
                ? 'bg-brand-primary text-white shadow-md'
                : (tab as any).semi
                  ? 'bg-brand-secondary/40 text-white'
                  : 'text-brand-deep/40 hover:text-brand-deep hover:bg-white/50'
            }`}>
            {tab.icon}
            <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
