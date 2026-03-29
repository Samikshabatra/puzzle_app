import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Flame } from 'lucide-react';
import { UserScore, StreakInfo } from '../types';

interface Props {
  scores:        UserScore[];
  streakInfo:    StreakInfo;
  onDateSelect:  (date: string) => void;
  justCompleted: boolean;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS   = ['S','M','T','W','T','F','S'];

function getIntensity(score: UserScore | undefined): 0|1|2|3|4 {
  if (!score || !score.date) return 0;
  if (score.score >= 1000) return 4;
  if (score.difficulty === 3) return 3;
  if (score.difficulty === 2) return 2;
  return 1;
}

const CELL_COLORS = [
  'bg-brand-soft',                                    // 0 - empty
  'bg-emerald-200 border-emerald-300',                // 1 - easy
  'bg-amber-300  border-amber-400',                  // 2 - medium
  'bg-brand-accent/70 border-brand-accent',           // 3 - hard
  'bg-brand-primary border-brand-primary/80',         // 4 - perfect
];

export default function Heatmap({ scores, streakInfo, onDateSelect, justCompleted }: Props) {
  const [tooltip, setTooltip] = useState<{ date:string; score:UserScore|undefined; x:number; y:number }|null>(null);
  const today = new Date().toLocaleDateString('en-CA');

  const { scoreMap, cells, monthLabels } = useMemo(() => {
    const map: Record<string,UserScore> = {};
    scores.forEach(s => { map[s.date] = s; });

    const end   = new Date();
    const start = new Date(end);
    start.setFullYear(start.getFullYear() - 1);
    start.setDate(start.getDate() - start.getDay()); // align to Sunday

    const cells: { date:string; col:number; row:number }[] = [];
    const monthLabels: { label:string; col:number }[] = [];
    let col = 0; let lastMonth = -1;
    const cur = new Date(start);

    while (cur <= end) {
      const d = cur.toLocaleDateString('en-CA');
      const row = cur.getDay();
      if (row === 0) {
        const m = cur.getMonth();
        if (m !== lastMonth) { monthLabels.push({ label: MONTHS[m], col }); lastMonth = m; }
      }
      cells.push({ date: d, col, row });
      cur.setDate(cur.getDate() + 1);
      if (row === 6) col++;
    }

    return { scoreMap: map, cells, monthLabels };
  }, [scores]);

  const totalCols = cells.length ? cells[cells.length-1].col+1 : 53;

  const share = () => {
    const text = `📊 My Bluestock year:\n🔥 ${streakInfo.currentStreak} day streak\n⭐ ${streakInfo.longestStreak} longest\n✅ ${scores.length} puzzles solved\nbluestock.in`;
    if (navigator.share) navigator.share({ title:'Bluestock', text });
    else navigator.clipboard.writeText(text);
  };

  return (
    <div className="glass-panel rounded-[2rem] sm:rounded-[3rem] p-5 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-black text-xl tracking-tight text-brand-deep">Archives</h2>
          <p className="text-brand-deep/40 text-xs font-semibold mt-0.5">Your puzzle history · tap a day to replay</p>
        </div>
        <div className="flex items-center gap-3">
          {streakInfo.currentStreak > 0 && (
            <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
              <Flame className="w-3.5 h-3.5 text-orange-500"/>
              <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">{streakInfo.currentStreak}d streak</span>
            </div>
          )}
          <button onClick={share}
            className="p-2.5 rounded-xl border border-brand-soft bg-white hover:border-brand-primary/40 transition-colors shadow-premium">
            <Share2 className="w-4 h-4 text-brand-primary"/>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          ['Solved', scores.length],
          ['Best Streak', streakInfo.longestStreak + 'd'],
          ['Current', streakInfo.currentStreak + 'd 🔥'],
        ].map(([l,v]) => (
          <div key={l} className="bg-white rounded-2xl p-3 border border-brand-soft text-center shadow-premium">
            <p className="font-black text-lg text-brand-deep">{v}</p>
            <p className="text-[10px] text-brand-deep/40 font-semibold uppercase tracking-widest">{l}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto -mx-2 px-2">
        <div className="relative" style={{ minWidth: totalCols*14+24 }}>
          {/* Month labels */}
          <div className="flex mb-1" style={{ paddingLeft:24 }}>
            {monthLabels.map(({ label, col }) => (
              <div key={`${label}-${col}`} className="text-[9px] font-bold text-brand-deep/30 uppercase tracking-widest absolute" style={{ left: 24 + col*14 }}>
                {label}
              </div>
            ))}
          </div>

          <div className="flex mt-5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1.5">
              {DAYS.map((d,i) => (
                <div key={i} className="w-3 h-3 flex items-center justify-center text-[8px] font-bold text-brand-deep/20">{i%2===1?d:''}</div>
              ))}
            </div>

            {/* Cells */}
            <div className="flex gap-0.5">
              {Array.from({length:totalCols}).map((_,col) => (
                <div key={col} className="flex flex-col gap-0.5">
                  {Array.from({length:7}).map((_,row) => {
                    const cell = cells.find(c=>c.col===col&&c.row===row);
                    if (!cell) return <div key={row} className="w-3 h-3"/>;
                    const s   = scoreMap[cell.date];
                    const lvl = getIntensity(s);
                    const isTd = cell.date === today;
                    const isFuture = cell.date > today;
                    return (
                      <motion.button
                        key={row}
                        animate={isTd && justCompleted ? { scale:[1,1.4,1], opacity:[1,0.6,1] } : {}}
                        transition={{ duration:0.6, repeat: justCompleted?2:0 }}
                        onClick={() => !isFuture && onDateSelect(cell.date)}
                        onMouseEnter={e => { const r=(e.target as HTMLElement).getBoundingClientRect(); setTooltip({date:cell.date,score:s,x:r.left,y:r.top}); }}
                        onMouseLeave={() => setTooltip(null)}
                        disabled={isFuture}
                        className={`w-3 h-3 rounded-sm border transition-all duration-150 ${
                          isFuture
                            ? 'bg-brand-soft/30 border-transparent cursor-not-allowed'
                            : isTd
                              ? `${CELL_COLORS[lvl]} ring-2 ring-brand-primary ring-offset-1`
                              : `${CELL_COLORS[lvl]} border-transparent hover:scale-125 cursor-pointer`
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 bg-brand-deep text-white text-[11px] font-bold rounded-xl px-3 py-2 pointer-events-none shadow-xl"
          style={{ top: tooltip.y - 56, left: Math.min(tooltip.x, window.innerWidth-160) }}>
          <p>{new Date(tooltip.date.replace(/-/g,'/')).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>
          {tooltip.score
            ? <p className="text-brand-primary/80">Score: {tooltip.score.score} · {['','Easy','Medium','Hard'][tooltip.score.difficulty]||'Easy'}</p>
            : <p className="text-white/40">{tooltip.date > today ? 'Locked' : 'Not played'}</p>}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-3 text-[10px] font-bold text-brand-deep/40">
        <span>Less</span>
        {CELL_COLORS.map((c,i) => (
          <div key={i} className={`w-3 h-3 rounded-sm border ${c} border-transparent`}/>
        ))}
        <span>More</span>
        <span className="ml-2">·</span>
        <div className="w-3 h-3 rounded-sm bg-brand-primary ring-2 ring-brand-primary ring-offset-1"/>
        <span>Today</span>
      </div>
    </div>
  );
}
