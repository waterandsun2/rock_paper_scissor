import React from 'react';
import { Trophy, Flame, RotateCcw, Volume2, VolumeX, ShieldAlert, Award, Swords, History, Trash2 } from 'lucide-react';
import { ScoreboardStats, RoundRecord, CHOICES } from '../types/game';

interface ScoreboardProps {
  stats: ScoreboardStats;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetStats: () => void;
  matchMode: 'single' | 'bo3';
  onToggleMatchMode: () => void;
  history?: RoundRecord[];
  onClearHistory?: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  stats,
  isMuted,
  onToggleMute,
  onResetStats,
  matchMode,
  onToggleMatchMode,
  history = [],
  onClearHistory,
}) => {
  const winRate =
    stats.totalRounds > 0
      ? Math.round((stats.wins / stats.totalRounds) * 100)
      : 0;

  return (
    <aside className="w-full flex flex-col gap-3">
      {/* 1. Header Card: Brand & Quick Settings */}
      <div className="relative rounded-2xl bg-gradient-to-br from-indigo-950/95 via-purple-950/95 to-slate-950/98 border border-purple-500/40 shadow-[0_8px_30px_rgba(139,92,246,0.25)] p-3.5 backdrop-blur-md overflow-hidden">
        {/* Top Trim Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-rose-500 to-cyan-400" />

        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 flex items-center justify-center text-lg shadow-md select-none">
              ✌️
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wider text-white font-tech leading-tight">
                3D 猜拳大對決
              </h1>
              <span className="text-[10px] font-arcade px-1.5 py-0.2 rounded bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold">
                CARTOON 3D
              </span>
            </div>
          </div>

          {/* Quick Mute & Reset */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleMute}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                isMuted
                  ? 'bg-indigo-950 text-purple-300 hover:text-white border border-purple-500/30'
                  : 'bg-cyan-500 text-slate-950 font-bold border border-cyan-300 shadow-sm'
              }`}
              title={isMuted ? '開啟音效' : '靜音'}
              aria-label={isMuted ? '開啟音效' : '靜音'}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onResetStats}
              className="p-1.5 rounded-lg text-xs bg-indigo-950 hover:bg-rose-950 text-purple-200 hover:text-rose-200 border border-purple-500/30 transition-all"
              title="重置統計戰績"
              aria-label="重置統計戰績"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mode Toggle Button */}
        <button
          onClick={onToggleMatchMode}
          className="w-full py-1.5 px-2.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/80 border border-purple-500/40 text-xs font-tech font-bold flex items-center justify-between text-purple-200 hover:text-white transition-all shadow-sm"
        >
          <span className="flex items-center gap-1.5">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>對決賽制:</span>
          </span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${matchMode === 'bo3' ? 'bg-amber-400 text-slate-950' : 'bg-purple-600 text-white'}`}>
            {matchMode === 'bo3' ? '三戰兩勝 (BO3)' : '單局即時制'}
          </span>
        </button>
      </div>

      {/* 2. Main Marks (Wins, Loss, Draws) */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-950/90 via-purple-950/90 to-slate-950/95 border border-purple-500/30 p-3.5 shadow-md">
        <span className="text-xs font-bold text-purple-300 font-tech tracking-wider block mb-2">
          📊 戰績計分標記 (SCORE MARKS)
        </span>

        {/* 3 Large Stacked Mark Cards */}
        <div className="grid grid-cols-3 gap-2">
          {/* WINS */}
          <div className="bg-emerald-950/50 rounded-xl p-2 border border-emerald-500/50 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-emerald-400" /> 勝
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-300 font-tech tabular-nums mt-0.5 arcade-glow-emerald">
              {stats.wins}
            </span>
          </div>

          {/* LOSSES */}
          <div className="bg-rose-950/50 rounded-xl p-2 border border-rose-500/50 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-semibold text-rose-300 flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-rose-400" /> 負
            </span>
            <span className="text-2xl sm:text-3xl font-black text-rose-300 font-tech tabular-nums mt-0.5 arcade-glow-red">
              {stats.losses}
            </span>
          </div>

          {/* DRAWS */}
          <div className="bg-amber-950/50 rounded-xl p-2 border border-amber-500/50 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
              🤝 平
            </span>
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-tech tabular-nums mt-0.5 arcade-glow-amber">
              {stats.draws}
            </span>
          </div>
        </div>

        {/* Win Rate Progress Bar */}
        <div className="mt-3 pt-2.5 border-t border-purple-500/20">
          <div className="flex items-center justify-between text-xs font-tech mb-1">
            <span className="text-purple-300 font-medium">勝率 (WIN RATE)</span>
            <span className="text-cyan-300 font-bold tabular-nums">{winRate}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 border border-purple-500/30 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
              style={{ width: `${winRate}%` }}
            />
          </div>
        </div>

        {/* Streak Stats */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-purple-500/20">
          <div className="flex items-center justify-between bg-indigo-950/60 p-2 rounded-lg border border-purple-500/20">
            <span className="text-[11px] text-orange-300 font-tech flex items-center gap-1">
              <Flame className={`w-3 h-3 ${stats.currentStreak > 0 ? 'text-orange-400 animate-bounce' : 'text-slate-500'}`} />
              連勝
            </span>
            <span className="text-base font-black text-orange-300 font-tech tabular-nums">
              {stats.currentStreak}
            </span>
          </div>

          <div className="flex items-center justify-between bg-indigo-950/60 p-2 rounded-lg border border-purple-500/20">
            <span className="text-[11px] text-purple-300 font-tech flex items-center gap-1">
              <Award className="w-3 h-3 text-purple-400" />
              最高
            </span>
            <span className="text-base font-black text-purple-300 font-tech tabular-nums">
              {stats.maxStreak}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Left-side Mini Match History Feed */}
      {history.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/80 via-purple-950/80 to-slate-950/90 border border-purple-500/30 p-3 shadow-md">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5 mb-2">
            <span className="text-xs font-bold text-purple-300 font-tech flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span>近期對決記錄</span>
            </span>
            {onClearHistory && (
              <button
                onClick={onClearHistory}
                className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
                title="清空歷史記錄"
              >
                <Trash2 className="w-3 h-3" />
                <span>清空</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            {history.slice(0, 8).map((record) => {
              const player = CHOICES[record.playerChoice];
              const cpu = CHOICES[record.cpuChoice];

              let badgeBg = 'bg-amber-950/60 text-amber-300 border-amber-500/40';
              let badgeText = '平';
              if (record.result === 'win') {
                badgeBg = 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50';
                badgeText = '勝';
              } else if (record.result === 'lose') {
                badgeBg = 'bg-rose-950/70 text-rose-300 border-rose-500/50';
                badgeText = '負';
              }

              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between px-2 py-1 rounded-lg bg-indigo-950/60 border border-purple-500/20 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-medium text-slate-200">
                    <span className="text-sm">{player.emoji}</span>
                    <span className="text-[10px] text-purple-400 font-tech">VS</span>
                    <span className="text-sm">{cpu.emoji}</span>
                  </div>

                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border font-tech ${badgeBg}`}>
                    {badgeText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
};
