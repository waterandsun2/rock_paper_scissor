import React from 'react';
import { HelpCircle } from 'lucide-react';

export const RulesBar: React.FC = () => {
  return (
    <footer className="w-full mx-auto mt-2 mb-2">
      <div className="rounded-2xl bg-indigo-950/60 border border-purple-500/30 p-3 text-xs text-purple-200 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div className="flex items-center gap-2 text-white font-tech font-bold">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>猜拳克制規則 (RULES)</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-slate-300 font-tech">
            <div className="flex items-center gap-1.5">
              <span>✊ 石頭</span>
              <span className="text-emerald-400 font-bold">勝</span>
              <span>✌️ 剪刀</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5">
              <span>✌️ 剪刀</span>
              <span className="text-emerald-400 font-bold">勝</span>
              <span>✋ 布</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">·</span>
            <div className="flex items-center gap-1.5">
              <span>✋ 布</span>
              <span className="text-emerald-400 font-bold">勝</span>
              <span>✊ 石頭</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-arcade">
            INSERT COIN TO CONTINUE
          </div>
        </div>
      </div>
    </footer>
  );
};
