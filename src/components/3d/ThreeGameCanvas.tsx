import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { ArenaScene, CameraView } from './ArenaScene';
import { HandTheme } from './HandModel';
import { Choice, GameResult } from '../../types/game';
import { Eye, Shield, Sparkles, Video, Orbit } from 'lucide-react';

interface ThreeGameCanvasProps {
  gameState: 'IDLE' | 'SHUFFLING' | 'REVEALED';
  countdownStep: number;
  playerChoice: Choice | null;
  cpuChoice: Choice | null;
  shufflingCpuChoice: Choice;
  gameResult: GameResult | null;
  handTheme: HandTheme;
  cameraView: CameraView;
  onThemeChange: (theme: HandTheme) => void;
  onCameraChange: (view: CameraView) => void;
}

export const ThreeGameCanvas: React.FC<ThreeGameCanvasProps> = ({
  gameState,
  countdownStep,
  playerChoice,
  cpuChoice,
  shufflingCpuChoice,
  gameResult,
  handTheme,
  cameraView,
  onThemeChange,
  onCameraChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ArenaScene | null>(null);
  const [isSoftware, setIsSoftware] = useState(false);

  // Drag interaction state for interactive 3D rotation
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Detect software WebGL from GPU renderer string
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    setIsSoftware(isSoftwareGl);

    const arena = new ArenaScene(mountRef.current, isSoftwareGl);
    sceneRef.current = arena;
    arena.setHandTheme(handTheme);
    arena.setCameraView(cameraView);

    // Resize handler
    const handleResize = () => {
      if (!mountRef.current || !arena) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight || 420;
      arena.handleResize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop with software GL pacing
    let frameId = 0;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      if (!arena) return;
      const gl = arena.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const delta = Math.min(clock.getDelta(), 0.1);
      arena.update(delta);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    // Start loop
    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (isSoftwareGl) {
        clearTimeout(frameId);
      } else {
        cancelAnimationFrame(frameId);
      }
      arena.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Update theme when changed
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setHandTheme(handTheme);
    }
  }, [handTheme]);

  // Update camera view when changed
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.setCameraView(cameraView);
    }
  }, [cameraView]);

  // Sync game state changes with 3D scene kinematics
  useEffect(() => {
    const arena = sceneRef.current;
    if (!arena) return;

    if (gameState === 'IDLE') {
      arena.resetToIdle();
    } else if (gameState === 'SHUFFLING') {
      if (playerChoice) {
        arena.animateCountdownStep(countdownStep, playerChoice, shufflingCpuChoice);
      }
    } else if (gameState === 'REVEALED') {
      if (playerChoice && cpuChoice && gameResult) {
        arena.animateReveal(playerChoice, cpuChoice, gameResult);
      }
    }
  }, [gameState, countdownStep, playerChoice, cpuChoice, shufflingCpuChoice, gameResult]);

  // Mouse drag handlers for interactive 3D rotation
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingRef.current || !sceneRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    // Gentle camera orbit offset
    const arena = sceneRef.current;
    arena.camera.position.x += deltaX * 0.008;
    arena.camera.position.y -= deltaY * 0.008;
    arena.camera.position.y = Math.max(0.4, Math.min(6.0, arena.camera.position.y));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return (
    <div className="relative w-full h-[390px] sm:h-[450px] lg:h-[480px] rounded-2xl overflow-hidden bg-[#1a1235] select-none border border-purple-500/30 shadow-[0_0_35px_rgba(139,92,246,0.2)]">
      {/* 3D WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating 3D Corner Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-2 pointer-events-none">
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-purple-500/40 text-[11px] font-tech text-cyan-300 backdrop-blur-md shadow-sm">
          <Orbit className="w-3.5 h-3.5 text-cyan-400" />
          <span>3D CARTOON ARENA</span>
        </span>
      </div>

      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 sm:gap-2">
        {/* Camera Views Quick Switcher */}
        <div className="flex items-center p-0.5 rounded-xl bg-indigo-950/85 border border-purple-500/40 backdrop-blur-md text-xs font-tech">
          <button
            onClick={() => onCameraChange('duel')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
              cameraView === 'duel'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="正面對決鏡頭"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">對決</span>
          </button>
          <button
            onClick={() => onCameraChange('action')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
              cameraView === 'action'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="低角度特寫鏡頭"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">特寫</span>
          </button>
          <button
            onClick={() => onCameraChange('top')}
            className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 ${
              cameraView === 'top'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="俯瞰戰術全景鏡頭"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">俯瞰</span>
          </button>
        </div>

        {/* Cartoon Hand Sleeve Theme Selector */}
        <div className="flex items-center p-0.5 rounded-xl bg-indigo-950/85 border border-purple-500/40 backdrop-blur-md text-xs font-tech">
          <button
            onClick={() => onThemeChange('classic')}
            className={`px-2 py-1 rounded-lg transition-all ${
              handTheme === 'classic'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="商務藍袖口（經典款）"
          >
            天藍
          </button>
          <button
            onClick={() => onThemeChange('pastel')}
            className={`px-2 py-1 rounded-lg transition-all ${
              handTheme === 'pastel'
                ? 'bg-rose-500 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="珊瑚粉袖口"
          >
            珊瑚
          </button>
          <button
            onClick={() => onThemeChange('dark')}
            className={`px-2 py-1 rounded-lg transition-all ${
              handTheme === 'dark'
                ? 'bg-purple-600 text-white font-bold shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
            title="紳士曜黑袖口"
          >
            曜黑
          </button>
        </div>
      </div>

      {/* 3D Navigation Tip (Bottom Left) */}
      <div className="absolute bottom-2.5 left-2.5 z-10 pointer-events-none">
        <span className="text-[11px] font-tech text-purple-200 bg-indigo-950/85 px-2 py-0.5 rounded-lg border border-purple-500/30">
          💡 可拖曳 3D 視角 · 全向對決
        </span>
      </div>

      {/* SPECIAL DEFEAT FX OVERLAY (When player loses) */}
      {gameState === 'REVEALED' && gameResult === 'lose' && (
        <>
          {/* Pulsing red defeat vignette */}
          <div className="absolute inset-0 pointer-events-none z-15 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(225,29,72,0.45)_100%)] animate-pulse" />

          {/* Cartoon Dizzy Badge over Player Hand */}
          <div className="absolute top-[28%] left-4 sm:left-12 z-20 pointer-events-none animate-bounce">
            <div className="px-3 py-1.5 rounded-2xl bg-black/85 border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.7)] backdrop-blur-md flex items-center gap-2">
              <span className="text-xl sm:text-2xl animate-spin">💫</span>
              <div>
                <div className="text-[10px] font-black text-rose-300 font-tech tracking-wider">
                  KNOCKOUT!
                </div>
                <div className="text-xs sm:text-sm font-black text-white font-tech">
                  暈厥倒地 · DIZZY!
                </div>
              </div>
            </div>
          </div>

          {/* Triumph Badge over CPU Hand */}
          <div className="absolute top-[28%] right-4 sm:right-12 z-20 pointer-events-none">
            <div className="px-3 py-1.5 rounded-2xl bg-black/85 border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)] backdrop-blur-md flex items-center gap-2">
              <span className="text-xl sm:text-2xl">👑</span>
              <div>
                <div className="text-[10px] font-black text-cyan-300 font-tech tracking-wider">
                  CPU VICTORY!
                </div>
                <div className="text-xs sm:text-sm font-black text-white font-tech">
                  電腦完勝 · WIN!
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 3D Fighter Labels */}
      <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-orange-950/80 border border-orange-400/60 text-orange-300 text-[11px] font-tech font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          <span>YOU (左)</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 text-[11px] font-tech font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          <span>CPU (右)</span>
        </div>
      </div>
    </div>
  );
};
