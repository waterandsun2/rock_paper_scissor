/**
 * 3D 猜拳大對決 - 經典卡通風格石頭剪刀布
 * 3D Cartoon Rock Paper Scissors Game
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Scoreboard } from './components/Scoreboard';
import { Arena } from './components/Arena';
import { ControlButtons } from './components/ControlButtons';
import { RulesBar } from './components/RulesBar';
import { Choice, GameResult, RoundRecord, ScoreboardStats, CHOICES } from './types/game';
import { arcadeAudio } from './utils/audio';
import { HandTheme } from './components/3d/HandModel';
import { CameraView } from './components/3d/ArenaScene';

const STORAGE_KEY_STATS = 'rps_arcade_stats_v2';
const STORAGE_KEY_HISTORY = 'rps_arcade_history_v2';
const STORAGE_KEY_THEME = 'rps_3d_theme_v2';

export default function App() {
  // Scoreboard Stats
  const [stats, setStats] = useState<ScoreboardStats>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STATS);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      wins: 0,
      losses: 0,
      draws: 0,
      currentStreak: 0,
      maxStreak: 0,
      totalRounds: 0,
    };
  });

  // Match History
  const [history, setHistory] = useState<RoundRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [];
  });

  // Audio mute state
  const [isMuted, setIsMuted] = useState(false);

  // 3D Cartoon Hand Theme & Camera
  const [handTheme, setHandTheme] = useState<HandTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME) as HandTheme;
      if (saved && ['classic', 'pastel', 'dark'].includes(saved)) return saved;
    } catch {
      // Fallback
    }
    return 'classic'; // Default classic cyan suit with white shirt collar like in photo
  });
  const [cameraView, setCameraView] = useState<CameraView>('duel');
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);

  // Match Mode: Single match vs Best of 3 Tournament
  const [matchMode, setMatchMode] = useState<'single' | 'bo3'>('single');
  const [bo3Score, setBo3Score] = useState({ player: 0, cpu: 0 });

  // Game state
  const [gameState, setGameState] = useState<'IDLE' | 'SHUFFLING' | 'REVEALED'>('IDLE');
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [cpuChoice, setCpuChoice] = useState<Choice | null>(null);
  const [shufflingCpuChoice, setShufflingCpuChoice] = useState<Choice>('rock');
  const [countdownStep, setCountdownStep] = useState(0);
  const [countdownText, setCountdownText] = useState('剪刀...');
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  // Timers refs
  const shuffleIntervalRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  // Save stats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch {
      // Ignore
    }
  }, [stats]);

  // Save history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {
      // Ignore
    }
  }, [history]);

  // Save theme to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, handTheme);
    } catch {
      // Ignore
    }
  }, [handTheme]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, []);

  // Trigger celebration confetti
  const triggerCelebration = useCallback((streak: number) => {
    if (typeof window === 'undefined') return;

    if (streak >= 3) {
      confetti({
        particleCount: 110,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#06b6d4', '#ec4899', '#eab308'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 65,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 65,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } else {
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#10b981', '#34d399', '#6ee7b7', '#fef08a'],
      });
    }
  }, []);

  // Computer random choice generator
  const getRandomCpuChoice = (): Choice => {
    const choices: Choice[] = ['rock', 'scissors', 'paper'];
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
  };

  // Determine game result
  const evaluateWinner = (player: Choice, cpu: Choice): GameResult => {
    if (player === cpu) return 'draw';
    if (CHOICES[player].beats === cpu) return 'win';
    return 'lose';
  };

  // Handle Player Selection
  const handleSelectChoice = useCallback(
    (choice: Choice) => {
      if (gameState === 'SHUFFLING') return;

      arcadeAudio.playClick();

      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      if (shuffleIntervalRef.current) clearInterval(shuffleIntervalRef.current);

      setPlayerChoice(choice);
      setGameState('SHUFFLING');
      setGameResult(null);
      setCpuChoice(null);

      // Rapidly cycle CPU hand during suspense countdown
      const choicesList: Choice[] = ['rock', 'scissors', 'paper'];
      let cycleIdx = 0;
      shuffleIntervalRef.current = window.setInterval(() => {
        cycleIdx = (cycleIdx + 1) % choicesList.length;
        setShufflingCpuChoice(choicesList[cycleIdx]);
      }, 70);

      // Countdown step 1: "剪刀..."
      setCountdownStep(1);
      setCountdownText('剪刀 · SCISSORS...');
      arcadeAudio.playCountdown(0.85);
      arcadeAudio.playMechServo();

      // Step 2: "石頭..."
      const t1 = window.setTimeout(() => {
        setCountdownStep(2);
        setCountdownText('石頭 · ROCK...');
        arcadeAudio.playCountdown(1.0);
        arcadeAudio.playMechServo();
      }, 300);
      timeoutsRef.current.push(t1);

      // Step 3: "布！"
      const t2 = window.setTimeout(() => {
        setCountdownStep(3);
        setCountdownText('布！ · SHOOT!');
        arcadeAudio.playCountdown(1.25);
        arcadeAudio.playMechServo();
      }, 600);
      timeoutsRef.current.push(t2);

      // Step 4: REVEAL WINNER
      const t3 = window.setTimeout(() => {
        if (shuffleIntervalRef.current) {
          clearInterval(shuffleIntervalRef.current);
          shuffleIntervalRef.current = null;
        }

        const cpuSelected = getRandomCpuChoice();
        const outcome = evaluateWinner(choice, cpuSelected);

        setCpuChoice(cpuSelected);
        setGameResult(outcome);
        setGameState('REVEALED');

        arcadeAudio.playImpact();

        // Handle Best of 3 mode tracking
        if (matchMode === 'bo3') {
          setBo3Score((prev) => {
            let nextPlayer = prev.player;
            let nextCpu = prev.cpu;
            if (outcome === 'win') nextPlayer += 1;
            else if (outcome === 'lose') nextCpu += 1;

            if (nextPlayer >= 2 || nextCpu >= 2) {
              setTimeout(() => {
                setBo3Score({ player: 0, cpu: 0 });
              }, 4000);
            }
            return { player: nextPlayer, cpu: nextCpu };
          });
        }

        setStats((prev) => {
          let newWins = prev.wins;
          let newLosses = prev.losses;
          let newDraws = prev.draws;
          let newStreak = prev.currentStreak;
          let newMax = prev.maxStreak;

          if (outcome === 'win') {
            newWins += 1;
            newStreak += 1;
            if (newStreak > newMax) {
              newMax = newStreak;
            }
            if (newStreak >= 3) {
              arcadeAudio.playStreakFanfare();
            } else {
              arcadeAudio.playVictory();
            }
            triggerCelebration(newStreak);
          } else if (outcome === 'lose') {
            newLosses += 1;
            newStreak = 0;
            arcadeAudio.playDefeat();
          } else {
            newDraws += 1;
            arcadeAudio.playDraw();
          }

          const newStats: ScoreboardStats = {
            wins: newWins,
            losses: newLosses,
            draws: newDraws,
            currentStreak: newStreak,
            maxStreak: newMax,
            totalRounds: prev.totalRounds + 1,
          };

          // Add to history
          const record: RoundRecord = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            roundNumber: newStats.totalRounds,
            playerChoice: choice,
            cpuChoice: cpuSelected,
            result: outcome,
            timestamp: Date.now(),
            streakAtTime: newStreak,
          };

          setHistory((hist) => [record, ...hist.slice(0, 29)]);

          return newStats;
        });
      }, 880);
      timeoutsRef.current.push(t3);
    },
    [gameState, matchMode, triggerCelebration]
  );

  // Play again / rematch
  const handlePlayAgain = () => {
    arcadeAudio.playClick();
    setGameState('IDLE');
    setPlayerChoice(null);
    setCpuChoice(null);
    setGameResult(null);
  };

  // Reset Stats
  const handleResetStats = () => {
    if (window.confirm('確定要重置目前的勝負平局統計與連勝紀錄嗎？')) {
      arcadeAudio.playCoin();
      setStats({
        wins: 0,
        losses: 0,
        draws: 0,
        currentStreak: 0,
        maxStreak: 0,
        totalRounds: 0,
      });
      setBo3Score({ player: 0, cpu: 0 });
      setHistory([]);
      setGameState('IDLE');
      setPlayerChoice(null);
      setCpuChoice(null);
      setGameResult(null);
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = arcadeAudio.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      arcadeAudio.playCoin();
    }
  };

  // Toggle Match Mode
  const handleToggleMatchMode = () => {
    arcadeAudio.playClick();
    setMatchMode((prev) => (prev === 'single' ? 'bo3' : 'single'));
    setBo3Score({ player: 0, cpu: 0 });
  };

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === '1' || e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleSelectChoice('rock');
      } else if (e.key === '2' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSelectChoice('scissors');
      } else if (e.key === '3' || e.key.toLowerCase() === 'p') {
        e.preventDefault();
        handleSelectChoice('paper');
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (gameState === 'REVEALED') {
          e.preventDefault();
          handlePlayAgain();
        }
      } else if (e.key.toLowerCase() === 'm') {
        handleToggleMute();
      } else if (e.key.toLowerCase() === 'c') {
        const views: CameraView[] = ['duel', 'action', 'top'];
        setCameraView((prev) => {
          const idx = views.indexOf(prev);
          return views[(idx + 1) % views.length];
        });
      } else if (e.key.toLowerCase() === 't') {
        const themes: HandTheme[] = ['classic', 'pastel', 'dark'];
        setHandTheme((prev) => {
          const idx = themes.indexOf(prev);
          return themes[(idx + 1) % themes.length];
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectChoice, gameState]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#180f38] via-[#100a26] to-[#0c071e] text-slate-100 flex flex-col justify-between p-2.5 sm:p-4 relative selection:bg-cyan-400 selection:text-black">
      {/* Vibrant Neon Ambient Background Lights */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed top-1/3 right-1/4 w-[450px] h-[450px] bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-0 left-1/3 w-[500px] h-[500px] bg-pink-500/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Main 2-Column Responsive Layout: Left Sidebar for Marks & Center for Bigger Main Stage */}
      <main className="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
        {/* LEFT COLUMN: SCORE MARKS, STATS, & HISTORY */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-3">
          <Scoreboard
            stats={stats}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onResetStats={handleResetStats}
            matchMode={matchMode}
            onToggleMatchMode={handleToggleMatchMode}
            history={history}
            onClearHistory={() => setHistory([])}
          />
        </div>

        {/* RIGHT / MAIN COLUMN: BIGGER MAIN STAGE & ACTIONS */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-3">
          {/* BIGGER 3D ARENA (Interactive WebGL Three.js Viewport) */}
          <Arena
            gameState={gameState}
            countdownStep={countdownStep}
            countdownText={countdownText}
            playerChoice={playerChoice}
            cpuChoice={cpuChoice}
            shufflingCpuChoice={shufflingCpuChoice}
            gameResult={gameResult}
            currentStreak={stats.currentStreak}
            onPlayAgain={handlePlayAgain}
            handTheme={handTheme}
            cameraView={cameraView}
            onThemeChange={setHandTheme}
            onCameraChange={setCameraView}
            matchMode={matchMode}
            bo3Score={bo3Score}
          />

          {/* THREE PROMINENT TACTILE BUTTONS */}
          <ControlButtons
            onSelect={handleSelectChoice}
            disabled={gameState === 'SHUFFLING'}
            selectedChoice={playerChoice}
            matchMode={matchMode}
            onToggleMatchMode={handleToggleMatchMode}
            isCollapsed={isControlsCollapsed}
            onToggleCollapse={() => setIsControlsCollapsed((prev) => !prev)}
          />

          {/* RULES BAR */}
          <RulesBar />
        </div>
      </main>
    </div>
  );
}
