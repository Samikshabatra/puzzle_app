export interface PuzzleData {
  id: string;
  date: string;
  theme: string;
  clues: string[];
  targetWord: string;
  scrambledLetters: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  baseScore: number;
  puzzleType: 'word_master' | 'cryptogram';
  author?: string;
  quote?: string;
  cipher?: Record<string, string>;
}

export interface DailyActivity {
  date: string;
  solved: boolean;
  score: number;
  timeTaken: number;
  difficulty: number; // 1=Easy 2=Medium 3=Hard
  synced: boolean;
  proof?: string;
  puzzleType?: string;
}

export interface UserScore {
  date: string;
  score: number;
  timeTaken: number;
  synced: boolean;
  attempts: number;
  difficulty: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
}

export interface PuzzleProgress {
  date: string;
  progressState: string;
  hintsUsed: number;
  startedAt: number;
}

export interface Achievement {
  id: string;
  unlockedAt: number;
}

export interface SyncQueueEntry {
  id?: number;
  userId: string;
  date: string;
  score: number;
  timeTaken: number;
  difficulty?: number;
  puzzleType?: string;
  proof?: string;
}

export interface UserSession {
  userId: string;
  displayName: string;
  email: string;
  isGuest: boolean;
  avatarColor: string;
}

export enum GameStatus {
  IDLE    = 'idle',
  PLAYING = 'playing',
  WON     = 'won',
  LOST    = 'lost',
}

export enum LockReason {
  NONE   = 'none',
  PAST   = 'past',
  FUTURE = 'future',
}
