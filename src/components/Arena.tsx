import React from 'react';
import { Choice, CHOICES, GameResult, OUTCOME_MESSAGES } from '../types/game';
import { Zap, Sparkles, RefreshCw, Cpu, User, Trophy, Swords, Flame } from 'lucide-react';
import { ThreeGameCanvas } from './3d/ThreeGameCanvas';
import { HandTheme } from './3d/HandModel';
import { CameraView } from './3d/ArenaScene';

interface ArenaProps {
  gameState: 'IDLE' | 'SHUFFLING' | 'REVEALED';
  countdownStep: number;
  countdownText: string;
  playerChoice: Choice | null;
  cpuChoice: Choice | null;
  shufflingCpuChoice: Choice;
  gameResult: GameResult | null;
  currentStreak: number;
  onPlayAgain: () => void;
  // 3D Engine props
  handTheme: HandTheme;
  cameraView: CameraView;
  onThemeChange: (theme: HandTheme) => void;
  onCameraChange: (view: CameraView) => void;
  // Match series
  matchMode: 'single' | 'bo3';
  bo3Score: { player: number; cpu: number };
}

export const Arena: React.FC<ArenaProps> = ({
  gameState,
  countdownStep,
  countdownText,
  playerChoice,
  cpuChoice,
  shufflingCpuChoice,
  gameResult,
  currentStreak,
  onPlayAgain,
  handTheme,
  cameraView,
  onThemeChange,
  onCameraChange,
  matchMode,
  bo3Score,
}) => {
  const playerDetail = playerChoice ? CHOICES[playerChoice] : null;
  const cpuDetail =
    gameState === 'SHUFFLING'
      ? CHOICES[shufflingCpuChoice]
      : cpuChoice
      ? CHOICES[cpuChoice]
      : null;

  const matchKey = playerChoice && cpuChoice ? `${playerChoice}-${cpuChoice}` : '';
  const outcomeExplanation = OUTCOME_MESSAGES[matchKey] || '';

  return (
    <div className="w-full">
      {/* Stadium Frame with Vibrant Cosmic Neon Styling */}
      <div
        className={`relative rounded-3xl bg-gradient-to-b from-[#251b4e]/95 via-[#1b123a]/95 to-[#120c29]/98 transition-all duration-300 overflow-hidden flex flex-col p-3 sm:p-4.5 crt-overlay ${
          gameState === 'REVEALED' && gameResult === 'lose'
            ? 'border-2 border-rose-500/80 shadow-[0_15px_45px_rgba(244,63,94,0.4)] ring-2 ring-rose-500/40'
            : 'border-2 border-purple-500/50 shadow-[0_15px_45px_rgba(139,92,246,0.3)]'
        }`}
      >
        {/* Neon Ambient Grid Glow */}
        <div className="absolute inset-0 bg-radial from-purple-600/15 via-transparent to-transparent pointer-events-none" />

        {/* Top Arena Header: Stage & Match Status */}
        <div className="relative z-10 flex flex-wrap items-center justify-between border-b border-purple-500/25 pb-2.5 mb-2.5 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-arcade tracking-wider text-cyan-300">
              3D CARTOON ARENA · 經典卡通對決台
            </span>
          </div>

          {/* Best of 3 Indicator if in BO3 mode */}
          {matchMode === 'bo3' && (
            <div className="flex items-center gap-2.5 px-2.5 py-0.5 rounded-xl bg-indigo-950/80 border border-purple-500/40 text-xs font-tech">
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <Swords className="w-3.5 h-3.5" /> BO3:
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-slate-300">YOU</span>
                <span className={`w-2.5 h-2.5 rounded-full ${bo3Score.player >= 1 ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-700'}`} />
                <span className={`w-2.5 h-2.5 rounded-full ${bo3Score.player >= 2 ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-700'}`} />
              </div>
              <span className="text-purple-400 font-bold">VS</span>
              <div className="flex items-center gap-1">
                <span className={`w-2.5 h-2.5 rounded-full ${bo3Score.cpu >= 1 ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' : 'bg-slate-700'}`} />
                <span className={`w-2.5 h-2.5 rounded-full ${bo3Score.cpu >= 2 ? 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]' : 'bg-slate-700'}`} />
                <span className="text-[10px] text-slate-300">CPU</span>
              </div>
            </div>
          )}

          <div className="text-xs font-tech font-bold text-amber-300 tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            {gameState === 'IDLE' && 'READY TO CLASH'}
            {gameState === 'SHUFFLING' && 'DECIDING 3D MOVES...'}
            {gameState === 'REVEALED' && 'ROUND COMPLETED'}
          </div>
        </div>

        {/* 3D Battle Arena Viewport */}
        <div className="relative z-10 w-full overflow-hidden rounded-2xl shadow-xl">
          <ThreeGameCanvas
            gameState={gameState}
            countdownStep={countdownStep}
            playerChoice={playerChoice}
            cpuChoice={cpuChoice}
            shufflingCpuChoice={shufflingCpuChoice}
            gameResult={gameResult}
            handTheme={handTheme}
            cameraView={cameraView}
            onThemeChange={onThemeChange}
            onCameraChange={onCameraChange}
          />

          {/* OVERLAY: SHUFFLING COUNTDOWN */}
          {gameState === 'SHUFFLING' && (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none z-20">
              <div className="px-6 py-2.5 rounded-2xl bg-black/80 border-2 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.6)] backdrop-blur-md flex flex-col items-center animate-bounce">
                <span className="text-2xl sm:text-4xl font-black text-amber-300 font-tech tracking-widest arcade-glow-amber">
                  {countdownText}
                </span>
                <span className="text-[10px] font-arcade text-cyan-300 mt-0.5 tracking-widest">
                  3D KINEMATICS ACTIVE...
                </span>
              </div>
            </div>
          )}

          {/* OVERLAY: IDLE HINT */}
          {gameState === 'IDLE' && (
            <div className="absolute inset-x-0 bottom-8 flex justify-center pointer-events-none z-20">
              <div className="px-3.5 py-1.5 rounded-xl bg-indigo-950/85 border border-purple-500/40 backdrop-blur-md text-center shadow-lg">
                <span className="text-xs sm:text-sm font-bold text-white font-tech flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  點選下方出招按鈕 或 按鍵盤 1 (石頭)、2 (剪刀)、3 (布)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* REVEALED RESULT SECTION: COMPACT CARDS & ANNOUNCEMENT */}
        {gameState === 'REVEALED' && playerDetail && cpuDetail && (
          <div className="relative z-20 mt-3 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-200">
            {/* Compact Outcome Badges */}
            <div className="w-full max-w-xl grid grid-cols-2 gap-2 sm:gap-4 items-center mb-2">
              {/* Player Side Card */}
              <div
                className={`rounded-xl p-2 sm:p-2.5 flex items-center justify-between border ${
                  gameResult === 'win'
                    ? 'bg-emerald-950/70 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                    : 'bg-indigo-950/70 border-purple-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-3xl sm:text-4xl drop-shadow">{playerDetail.emoji}</span>
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-amber-300">
                      <User className="w-3 h-3 text-amber-400" />
                      <span>你 (YOU)</span>
                    </div>
                    <span className="text-base sm:text-lg font-black text-white font-tech">
                      {playerDetail.name}
                    </span>
                  </div>
                </div>
                {gameResult === 'win' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-tech font-black text-[10px] tracking-wider shadow">
                    👑 獲勝
                  </span>
                )}
              </div>

              {/* CPU Side Card */}
              <div
                className={`rounded-xl p-2 sm:p-2.5 flex items-center justify-between border ${
                  gameResult === 'lose'
                    ? 'bg-rose-950/70 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.4)]'
                    : 'bg-indigo-950/70 border-purple-500/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-3xl sm:text-4xl drop-shadow">{cpuDetail.emoji}</span>
                  <div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-300">
                      <Cpu className="w-3 h-3 text-cyan-400" />
                      <span>電腦 (CPU)</span>
                    </div>
                    <span className="text-base sm:text-lg font-black text-white font-tech">
                      {cpuDetail.name}
                    </span>
                  </div>
                </div>
                {gameResult === 'lose' && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-400 text-slate-950 font-tech font-black text-[10px] tracking-wider shadow">
                    👑 獲勝
                  </span>
                )}
              </div>
            </div>

            {/* Winner Announcement Banner */}
            <div className="w-full max-w-xl flex flex-col items-center text-center">
              {gameResult === 'win' && (
                <div className="w-full p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-emerald-950/90 via-teal-900/90 to-emerald-950/90 border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                  <div className="flex items-center justify-center gap-2 text-lg sm:text-xl font-black text-emerald-300 font-tech tracking-wider">
                    <Trophy className="w-5 h-5 text-amber-300" />
                    <span>玩家勝出！YOU WIN!</span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-200 mt-0.5">
                    {outcomeExplanation}
                  </p>
                  {currentStreak >= 2 && (
                    <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-tech font-bold">
                      <Flame className="w-3 h-3 text-orange-400" />
                      <span>{currentStreak} 連勝！機甲氣勢如虹！</span>
                    </div>
                  )}
                </div>
              )}

              {gameResult === 'lose' && (
                <div className="w-full p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-rose-950/95 via-pink-900/90 to-rose-950/95 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.45)]">
                  <div className="flex items-center justify-center gap-2 text-lg sm:text-xl font-black text-rose-300 font-tech tracking-wider">
                    <span className="text-xl animate-pulse">💫</span>
                    <span>遭遇擊倒！KO！再接再厲！</span>
                    <span className="text-xl animate-pulse">💔</span>
                  </div>
                  <p className="text-xs font-semibold text-rose-200 mt-0.5">
                    {outcomeExplanation}
                  </p>
                  <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] font-tech text-rose-300 font-bold">
                    <span>💫 3D 眩暈小星星已在手部上方盤旋！</span>
                  </div>
                </div>
              )}

              {gameResult === 'draw' && (
                <div className="w-full p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-amber-950/90 via-orange-900/90 to-amber-950/90 border border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)]">
                  <div className="flex items-center justify-center gap-2 text-lg sm:text-xl font-black text-amber-300 font-tech tracking-wider">
                    <span>🤝 雙方平手！勢均力敵！</span>
                  </div>
                  <p className="text-xs font-semibold text-amber-200 mt-0.5">
                    {outcomeExplanation}
                  </p>
                </div>
              )}

              {/* Quick Rematch Button */}
              <button
                onClick={onPlayAgain}
                className={`mt-2.5 px-6 py-2 rounded-xl text-white font-bold font-tech text-xs sm:text-sm tracking-wider flex items-center gap-2 transition-all active:scale-95 shadow-md ${
                  gameResult === 'lose'
                    ? 'bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-500/40 animate-pulse'
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-500/30'
                }`}
              >
                <RefreshCw className="w-4 h-4 text-cyan-300" />
                <span>{gameResult === 'lose' ? '🔥 不服氣！再戰一局 (REMATCH)' : '再戰一局 (PLAY AGAIN)'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Arena Footer Indicator */}
        <div className="relative z-10 pt-2.5 mt-2.5 border-t border-purple-500/20 flex items-center justify-between text-[10px] text-purple-300/80 font-tech">
          <span>COIN: FREE PLAY</span>
          <span>MODE: REAL-TIME 3D</span>
          <span>SYSTEM: READY</span>
        </div>
      </div>
    </div>
  );
};
