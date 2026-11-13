import React from 'react';
import { RoundRecord, CHOICES } from '../types/game';
import { History, Trash2 } from 'lucide-react';

interface RecentHistoryProps {
  history: RoundRecord[];
  onClearHistory: () => void;
}

export const RecentHistory: React.FC<RecentHistoryProps> = ({
  history,
  onClearHistory,
}) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-4 bg-gradient-to-r from-indigo-950/60 via-purple-950/60 to-slate-950/70 rounded-2xl border border-purple-500/30 p-3 sm:p-4 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-between border-b border-purple-500/20 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs sm:text-sm font-bold tracking-wider text-purple-200 font-tech">
            近期對決記錄 (MATCH HISTORY)
          </h3>
          <span className="text-[11px] text-slate-500 font-tech">
            最新 {history.length} 局
          </span>
        </div>
        <button
          onClick={onClearHistory}
          className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors px-2 py-1 rounded hover:bg-slate-800"
          title="清空歷史記錄"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>清空記錄</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
        {history.map((record) => {
          const player = CHOICES[record.playerChoice];
          const cpu = CHOICES[record.cpuChoice];

          let resultBg = 'bg-amber-950/40 border-amber-800/60 text-amber-300';
          let resultText = '平局';
          if (record.result === 'win') {
            resultBg = 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300';
            resultText = '獲勝';
          } else if (record.result === 'lose') {
            resultBg = 'bg-rose-950/50 border-rose-800/60 text-rose-300';
            resultText = '落敗';
          }

          return (
            <div
              key={record.id}
              className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
            >
              {/* Round & Match Details */}
              <div className="flex items-center gap-2">
                <span className="font-arcade text-[10px] text-slate-500">
                  #{record.roundNumber}
                </span>
                <div className="flex items-center gap-1.5 font-medium text-slate-300">
                  <span title={`玩家: ${player.name}`}>{player.emoji}</span>
                  <span className="text-[10px] text-slate-500 font-tech">VS</span>
                  <span title={`電腦: ${cpu.name}`}>{cpu.emoji}</span>
                </div>
              </div>

              {/* Result Badge */}
              <div className="flex items-center gap-2">
                {record.streakAtTime >= 3 && record.result === 'win' && (
                  <span className="text-[10px] text-orange-400 font-tech font-bold">
                    🔥{record.streakAtTime}連勝
                  </span>
                )}
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border font-tech ${resultBg}`}
                >
                  {resultText}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
