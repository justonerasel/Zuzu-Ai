import React from 'react';
import { Mic, Volume2, Sparkles, X, Maximize2 } from 'lucide-react';
import { VoiceIdentity } from '../types';
import { VOICE_IDENTITIES } from '../constants/personalities';

interface MinimizedVoiceOverlayProps {
  activeIdentity: VoiceIdentity;
  onMaximize: () => void;
  onClose: () => void;
}

export const MinimizedVoiceOverlay: React.FC<MinimizedVoiceOverlayProps> = ({
  activeIdentity,
  onMaximize,
  onClose
}) => {
  const currentIdentity = VOICE_IDENTITIES[activeIdentity];

  return (
    <div className="absolute bottom-20 right-4 z-50 flex items-center gap-2 select-none animate-bounce-short">
      <div
        onClick={onMaximize}
        className={`px-3.5 py-2.5 rounded-2xl bg-[#0c101a]/95 backdrop-blur-xl border ${
          activeIdentity === 'female' ? 'border-rose-500/50 shadow-rose-950/50' : 'border-cyan-500/50 shadow-cyan-950/50'
        } shadow-2xl flex items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all`}
      >
        {/* Pulsating Icon */}
        <div
          className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${currentIdentity.avatarGradient} p-0.5 flex items-center justify-center`}
        >
          <div className="w-full h-full bg-[#0a0d16] rounded-[10px] flex items-center justify-center">
            <Mic
              className={`w-3.5 h-3.5 ${
                activeIdentity === 'female' ? 'text-rose-400' : 'text-cyan-400'
              } animate-pulse`}
            />
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold text-white flex items-center gap-1">
            <span>{currentIdentity.name}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
          </div>
          <div className="text-[9px] text-slate-400 font-mono">Tap to expand session</div>
        </div>

        <Maximize2 className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </div>

      {/* Quick Close Button */}
      <button
        onClick={onClose}
        className="w-7 h-7 rounded-full bg-black/70 hover:bg-black border border-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors shadow-lg"
        title="Stop and Close Voice Assistant"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
