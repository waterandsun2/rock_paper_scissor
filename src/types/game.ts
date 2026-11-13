export type Choice = 'rock' | 'scissors' | 'paper';

export type GameResult = 'win' | 'lose' | 'draw';

export interface ChoiceDetail {
  id: Choice;
  name: string;
  enName: string;
  emoji: string;
  colorName: string;
  accentBg: string;
  accentBorder: string;
  accentGlow: string;
  accentText: string;
  description: string;
  shortcut: string;
  beats: Choice;
  defeatedBy: Choice;
}

export interface RoundRecord {
  id: string;
  roundNumber: number;
  playerChoice: Choice;
  cpuChoice: Choice;
  result: GameResult;
  timestamp: number;
  streakAtTime: number;
}

export interface ScoreboardStats {
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  maxStreak: number;
  totalRounds: number;
}

export const CHOICES: Record<Choice, ChoiceDetail> = {
  rock: {
    id: 'rock',
    name: '石頭',
    enName: 'ROCK',
    emoji: '✊',
    colorName: 'amber',
    accentBg: 'from-amber-500 to-orange-600',
    accentBorder: 'border-amber-400',
    accentGlow: 'shadow-[0_8px_0_#9a3412,0_0_25px_rgba(245,158,11,0.5)]',
    accentText: 'text-amber-400',
    description: '堅不可摧 · 克制剪刀',
    shortcut: '1',
    beats: 'scissors',
    defeatedBy: 'paper',
  },
  scissors: {
    id: 'scissors',
    name: '剪刀',
    enName: 'SCISSORS',
    emoji: '✌️',
    colorName: 'cyan',
    accentBg: 'from-cyan-500 to-blue-600',
    accentBorder: 'border-cyan-400',
    accentGlow: 'shadow-[0_8px_0_#0369a1,0_0_25px_rgba(6,182,212,0.5)]',
    accentText: 'text-cyan-400',
    description: '鋒利無匹 · 克制布',
    shortcut: '2',
    beats: 'paper',
    defeatedBy: 'rock',
  },
  paper: {
    id: 'paper',
    name: '布',
    enName: 'PAPER',
    emoji: '✋',
    colorName: 'emerald',
    accentBg: 'from-emerald-500 to-teal-600',
    accentBorder: 'border-emerald-400',
    accentGlow: 'shadow-[0_8px_0_#065f46,0_0_25px_rgba(16,185,129,0.5)]',
    accentText: 'text-emerald-400',
    description: '包羅萬象 · 克制石頭',
    shortcut: '3',
    beats: 'rock',
    defeatedBy: 'scissors',
  },
};

export const OUTCOME_MESSAGES: Record<string, string> = {
  'rock-scissors': '石頭砸碎剪刀！玩家勝出！',
  'scissors-paper': '剪刀剪開布匹！玩家勝出！',
  'paper-rock': '布匹包覆石頭！玩家勝出！',
  'scissors-rock': '石頭砸碎剪刀！電腦獲勝！',
  'paper-scissors': '剪刀剪開布匹！電腦獲勝！',
  'rock-paper': '布匹包覆石頭！電腦獲勝！',
  'rock-rock': '雙方皆出石頭，勢均力敵！',
  'scissors-scissors': '雙方皆出剪刀，勢均力敵！',
  'paper-paper': '雙方皆出布，勢均力敵！',
};
