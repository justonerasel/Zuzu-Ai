import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Maximize2, Sparkles } from 'lucide-react';
import { VoiceIdentity } from '../types';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeIdentity: VoiceIdentity;
  viewMode: 'android_frame' | 'fullscreen';
  onToggleViewMode: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  activeIdentity,
  viewMode,
  onToggleViewMode
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const identityBorder =
    activeIdentity === 'female'
      ? 'border-rose-500/25 shadow-rose-950/40'
      : 'border-cyan-500/25 shadow-cyan-950/40';

  if (viewMode === 'fullscreen') {
    return (
      <div className="w-full h-screen bg-[#07090e] text-slate-100 flex flex-col overflow-hidden relative font-sans">
        {/* Android Native Status Bar */}
        <div className="h-8 bg-[#07090e]/95 backdrop-blur-md px-5 flex items-center justify-between text-xs text-slate-400 select-none border-b border-white/5 z-40">
          <div className="font-semibold text-slate-300 tracking-tight flex items-center gap-1.5">
            <span>{currentTime || '12:00'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono tracking-wider text-slate-400 font-bold">5G</span>
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-slate-300">96%</span>
              <Battery className="w-4 h-4 text-emerald-400" />
            </div>
            <button
              onClick={onToggleViewMode}
              title="Switch to Android Phone Bezel Mode"
              className="ml-2 p-1 rounded hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden relative">{children}</div>

        {/* Android Gesture Bar */}
        <div className="h-5 bg-[#07090e] flex items-center justify-center select-none z-40">
          <div className="w-32 h-1 bg-slate-600/60 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-[#040609] flex items-center justify-center p-2 sm:p-4 overflow-hidden font-sans">
      {/* Outer Phone Shell */}
      <div
        className={`w-full max-w-[440px] h-[98vh] max-h-[920px] bg-[#07090e] rounded-[48px] border-[5px] ${identityBorder} shadow-2xl flex flex-col relative overflow-hidden ring-1 ring-white/10 transition-all duration-300`}
      >
        {/* Punch-hole camera & speaker pill */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 pointer-events-none">
          <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/10 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-900 ring-1 ring-cyan-500/30"></div>
          </div>
        </div>

        {/* Android Native Status Bar */}
        <div className="h-9 bg-[#07090e]/95 backdrop-blur-md px-6 flex items-center justify-between text-xs text-slate-400 select-none z-40 pt-1 border-b border-white/5">
          <div className="font-semibold text-slate-200 tracking-tight flex items-center gap-1.5">
            <span>{currentTime || '12:00'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold tracking-wider text-slate-400 bg-white/5 px-1 rounded">
              5G
            </span>
            <Wifi className="w-3 h-3 text-slate-300" />
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono text-slate-300">96%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <button
              onClick={onToggleViewMode}
              title="Expand to Fullscreen View"
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Inner Content Screen */}
        <div className="flex-1 flex flex-col overflow-hidden relative">{children}</div>

        {/* Android Gesture Bar */}
        <div className="h-6 bg-[#07090e] flex items-center justify-center select-none pb-1 z-40">
          <div className="w-32 h-1 bg-slate-500/70 rounded-full hover:bg-white/90 transition-all cursor-pointer"></div>
        </div>
      </div>
    </div>
  );
};
