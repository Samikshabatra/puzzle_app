import React from 'react';
import { motion } from 'framer-motion';
import { LogOut, Zap, Clock, Flame, Trophy, Lock, Wifi, WifiOff } from 'lucide-react';
import { UserSession, Achievement, StreakInfo } from '../types';

interface Props {
  session:     UserSession;
  achievements:Achievement[];
  stats:       { avgScore:number; solvedCount:number; currentStreak:number; longestStreak:number };
  isOnline:    boolean;
  onLogout:    () => void;
}

const ALL_ACHIEVEMENTS = [
  { id:'hard_cracker', icon:'💎', label:'Hard Cracker',   desc:'Solved a Hard puzzle'             },
  { id:'no_hints',     icon:'🧠', label:'Pure Intellect', desc:'Solved without using any hints'   },
  { id:'speed_run',    icon:'⚡', label:'Lightning Mind', desc:'Solved in under 60 seconds'       },
];

const fmt = (s: number) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;

export default function ProfileView({ session, achievements, stats, isOnline, onLogout }: Props) {
  const unlockedIds = new Set(achievements.map(a => a.id));

  return (
    <div className="space-y-5">
      {/* Profile card */}
      <div className="glass-panel rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl font-black text-white flex-shrink-0 shadow-glass"
            style={{ background: session.avatarColor }}>
            {session.displayName.slice(0,2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-xl tracking-tight text-brand-deep truncate">{session.displayName}</p>
            {session.email && <p className="text-brand-deep/40 text-xs font-semibold truncate">{session.email}</p>}
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                session.isGuest
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-brand-primary/10 border-brand-primary/20 text-brand-primary'
              }`}>
                {session.isGuest ? 'Guest' : 'Member'}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                {isOnline ? <Wifi className="w-2.5 h-2.5"/> : <WifiOff className="w-2.5 h-2.5"/>}
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          <motion.button whileTap={{scale:0.9}} onClick={onLogout}
            className="p-2.5 rounded-xl border border-brand-soft bg-white hover:border-brand-accent/40 hover:text-brand-accent text-brand-deep/40 transition-colors shadow-premium">
            <LogOut className="w-4 h-4"/>
          </motion.button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon:<Zap className="w-4 h-4 text-brand-primary"/>,  label:'Avg Score',      value: stats.avgScore.toLocaleString() },
          { icon:<Trophy className="w-4 h-4 text-yellow-500"/>,  label:'Puzzles Solved',  value: stats.solvedCount },
          { icon:<Flame className="w-4 h-4 text-orange-500"/>,   label:'Current Streak',  value: `${stats.currentStreak}d` },
          { icon:<Flame className="w-4 h-4 text-orange-300"/>,   label:'Longest Streak',  value: `${stats.longestStreak}d` },
        ].map(({ icon, label, value }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-brand-soft shadow-premium">
            <div className="flex items-center gap-2 mb-2">{icon}<p className="text-[10px] font-bold uppercase tracking-widest text-brand-deep/40">{label}</p></div>
            <p className="font-black text-2xl text-brand-deep tracking-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="glass-panel rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-deep/40 mb-4">Achievements</p>
        <div className="space-y-3">
          {ALL_ACHIEVEMENTS.map(ach => {
            const unlocked = unlockedIds.has(ach.id);
            return (
              <motion.div key={ach.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  unlocked
                    ? 'bg-brand-primary/5 border-brand-primary/20'
                    : 'bg-white/50 border-brand-soft opacity-50'
                }`}>
                <span className={`text-2xl ${!unlocked ? 'grayscale opacity-40' : ''}`}>{ach.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-black ${unlocked?'text-brand-deep':'text-brand-deep/40'}`}>{ach.label}</p>
                  <p className="text-xs text-brand-deep/40 font-medium">{ach.desc}</p>
                </div>
                {!unlocked && <Lock className="w-4 h-4 text-brand-deep/20 flex-shrink-0"/>}
                {unlocked  && <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Unlocked</span>}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
