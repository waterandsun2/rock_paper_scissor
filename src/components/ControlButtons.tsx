import React from 'react';
import { Choice, CHOICES } from '../types/game';
import { Swords, ChevronDown, ChevronUp } from 'lucide-react';

interface ControlButtonsProps {
  onSelect: (choice: Choice) => void;
  disabled: boolean;
  selectedChoice: Choice | null;
  matchMode: 'single' | 'bo3';
  onToggleMatchMode: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
  onSelect,
  disabled,
  selectedChoice,
  matchMode,
  onToggleMatchMode,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const choicesList: Choice[] = ['rock', 'scissors', 'paper'];

  return (
    <div className="w-full mx-auto mt-2 transition-all duration-300">
      {/* Control Dock Header Bar */}
      <div className="flex items-center justify-between px-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-xs font-bold tracking-wider text-purple-200 font-tech">
            {disabled ? '⚡ 對決判定中 · 請稍候...' : '🎮 點擊出招 (或按鍵盤 1、2、3)'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Match Mode Switch */}
          <button
            onClick={onToggleMatchMode}
            disabled={disabled}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-tech font-bold flex items-center gap-1.5 transition-all border ${
              matchMode === 'bo3'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-indigo-950/80 border-purple-500/40 text-purple-200 hover:text-white'
            }`}
            title="切換賽制模式"
          >
            <Swords className="w-3 h-3 text-amber-300" />
            <span>{matchMode === 'bo3' ? 'BO3 賽制' : '單局對決'}</span>
          </button>

          {/* Optional Collapse Dock toggle */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 rounded-lg bg-indigo-950/80 border border-purple-500/40 text-purple-300 hover:text-white transition-all"
              title={isCollapsed ? '展開出招按鈕' : '收起出招按鈕'}
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {!isCollapsed && (
        /* 3 Compact, Youth-Vibrant Buttons (Smaller size to fit screen perfectly) */
        <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
          {choicesList.map((key) => {
            const item = CHOICES[key];
            const isSelected = selectedChoice === key;

            let buttonBg = '';
            let shadowStyle = '';
            let borderStyle = '';
            let glowRing = '';
            let keyBadgeBg = '';

            if (key === 'rock') {
              // Vibrant Coral Sunset Flame
              buttonBg =
                'from-amber-400 via-orange-500 to-rose-500 hover:from-amber-300 hover:via-orange-400 hover:to-rose-400 text-slate-950';
              shadowStyle =
                'shadow-[0_4px_0_#9a3412,0_8px_20px_rgba(249,115,22,0.35)] active:shadow-[0_1px_0_#9a3412]';
              borderStyle = 'border-t-2 border-amber-200/90 border-b-2 border-orange-950/70';
              glowRing = 'focus-visible:ring-amber-300 hover:ring-2 hover:ring-amber-300/70';
              keyBadgeBg = 'bg-black/40 text-amber-200 border-amber-300/50';
            } else if (key === 'scissors') {
              // Vibrant Electric Hyper Cyan
              buttonBg =
                'from-cyan-300 via-sky-400 to-indigo-600 hover:from-cyan-200 hover:via-sky-300 hover:to-indigo-500 text-slate-950';
              shadowStyle =
                'shadow-[0_4px_0_#075985,0_8px_20px_rgba(6,182,212,0.35)] active:shadow-[0_1px_0_#075985]';
              borderStyle = 'border-t-2 border-cyan-200/90 border-b-2 border-blue-950/70';
              glowRing = 'focus-visible:ring-cyan-300 hover:ring-2 hover:ring-cyan-300/70';
              keyBadgeBg = 'bg-black/40 text-cyan-200 border-cyan-300/50';
            } else {
              // Vibrant Neon Emerald Lime
              buttonBg =
                'from-emerald-300 via-teal-400 to-cyan-600 hover:from-emerald-200 hover:via-teal-300 hover:to-cyan-500 text-slate-950';
              shadowStyle =
                'shadow-[0_4px_0_#064e3b,0_8px_20px_rgba(16,185,129,0.35)] active:shadow-[0_1px_0_#064e3b]';
              borderStyle = 'border-t-2 border-emerald-200/90 border-b-2 border-teal-950/70';
              glowRing = 'focus-visible:ring-emerald-300 hover:ring-2 hover:ring-emerald-300/70';
              keyBadgeBg = 'bg-black/40 text-emerald-200 border-emerald-300/50';
            }

            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                disabled={disabled}
                type="button"
                className={`
                  group relative select-none cursor-pointer rounded-xl sm:rounded-2xl py-2 px-2 sm:py-3 sm:px-3
                  bg-gradient-to-b ${buttonBg} ${borderStyle} ${shadowStyle} ${glowRing}
                  transform transition-all duration-100 ease-out
                  ${
                    disabled
                      ? 'opacity-60 cursor-not-allowed filter grayscale-[25%]'
                      : 'hover:-translate-y-0.5 active:translate-y-1'
                  }
                  ${isSelected ? 'ring-3 ring-white' : ''}
                `}
                aria-label={`選擇 ${item.name} (${item.enName})`}
              >
                {/* Keyboard Shortcut Pill */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-arcade border ${keyBadgeBg} shadow-sm backdrop-blur-sm`}
                  >
                    {item.shortcut}
                  </span>
                </div>

                {/* Inner Bright Sheen */}
                <div className="absolute inset-x-2 top-1 h-1/3 bg-gradient-to-b from-white/35 to-transparent rounded-t-lg pointer-events-none" />

                <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 relative z-10">
                  {/* Scaled Hand Emoji */}
                  <span className="text-3xl sm:text-4xl drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)] transform transition-transform duration-200 group-hover:scale-110">
                    {item.emoji}
                  </span>

                  <div className="flex flex-col items-center sm:items-start leading-tight">
                    {/* Main Label */}
                    <span className="text-base sm:text-lg font-black text-slate-950 tracking-wider font-tech drop-shadow-[0_1px_2px_rgba(255,255,255,0.6)]">
                      {item.name}
                    </span>

                    {/* English subtitle */}
                    <span className="text-[9px] font-arcade text-slate-800 tracking-wider">
                      {item.enName}
                    </span>
                  </div>
                </div>

                {/* Compact subtext description */}
                <div className="mt-1 hidden sm:block text-[10px] font-bold text-slate-900 bg-white/30 rounded-md py-0.5 px-1.5 text-center">
                  {item.description}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
