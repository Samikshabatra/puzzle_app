import { DailyActivity, StreakInfo } from '../types';

export function calculateStreak(activities: DailyActivity[]): StreakInfo {
  if (!activities.length) return { currentStreak: 0, longestStreak: 0 };

  const solved = activities
    .filter(a => a.solved)
    .map(a => a.date)
    .sort();

  if (!solved.length) return { currentStreak: 0, longestStreak: 0 };

  const daysBetween = (a: string, b: string) =>
    Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);

  const today = new Date().toLocaleDateString('en-CA');

  // Current streak — walk backward from most recent solved
  let currentStreak = 0;
  const last = solved[solved.length - 1];
  const gap  = daysBetween(last, today);

  if (gap <= 1) {
    currentStreak = 1;
    for (let i = solved.length - 2; i >= 0; i--) {
      if (daysBetween(solved[i], solved[i + 1]) === 1) {
        currentStreak++;
      } else break;
    }
  }

  // Longest streak
  let longest = 1;
  let run     = 1;
  for (let i = 1; i < solved.length; i++) {
    if (daysBetween(solved[i - 1], solved[i]) === 1) {
      run++;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }
  longest = Math.max(longest, currentStreak);

  return { currentStreak, longestStreak: longest };
}
