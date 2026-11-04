import React from 'react';
import { Sparkles, Bot, Volume2, ShieldCheck, ChevronRight } from 'lucide-react';
import { VoiceIdentity, PersonalityId } from '../types';
import { PERSONALITIES, VOICE_IDENTITIES } from '../constants/personalities';
import { playHapticSound } from '../utils/audio';

interface TopBarProps {
  activeIdentity: VoiceIdentity;
  activePersonality: PersonalityId;
  onSelectIdentity: (id: VoiceIdentity) => void;
  onOpenSettings: () => void;
  onOpenPersonalityModal?: () => void;
  isBackendConnected?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeIdentity,
  activePersonality,
  onSelectIdentity,
  onOpenSettings,
  isBackendConnected = true
}) => {
  const currentIdentity = VOICE_IDENTITIES[activeIdentity];
  const personality = PERSONALITIES[activePersonality] || PERSONALITIES.Normal;

  const handleIdentitySwitch = (target: VoiceIdentity) => {
    if (target !== activeIdentity) {
      playHapticSound('switch');
      onSelectIdentity(target);
    }
  };

  return (
    <header className="px-4 py-2.5 bg-[#0b0e17]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between z-30 select-none">
      {/* Brand & Identity Badge */}
      <div className="flex items-center gap-2.5">
        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${currentIdentity.avatarGradient} p-0.5 shadow-lg ${currentIdentity.shadowColor} flex items-center justify-center transition-all duration-300`}
        >
          <div className="w-full h-full bg-[#090d16] rounded-[10px] flex items-center justify-center">
            <Sparkles
              className={`w-4 h-4 ${
                activeIdentity === 'female' ? 'text-rose-400' : 'text-cyan-400'
              } transition-colors`}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-white">
              Zuzu <span className={activeIdentity === 'female' ? 'text-rose-400' : 'text-cyan-400'}>AI</span>
            </span>
            <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-white/10 text-slate-300 border border-white/10">
              Android
            </span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <span>{personality.emoji} {personality.name}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-0.5">
              <ShieldCheck className="w-2.5 h-2.5" />
              Ready
            </span>
          </div>
        </div>
      </div>

      {/* Dual Identity Switcher Pill */}
      <div className="flex items-center gap-1.5">
        <div className="p-0.5 bg-black/50 border border-white/10 rounded-full flex items-center shadow-inner">
          <button
            onClick={() => handleIdentitySwitch('male')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all duration-200 ${
              activeIdentity === 'male'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Switch to Male Zuzu"
          >
            <span>♂</span>
            <span>Male</span>
          </button>

          <button
            onClick={() => handleIdentitySwitch('female')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all duration-200 ${
              activeIdentity === 'female'
                ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-500/25 scale-[1.02]'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Switch to Female Zuzu"
          >
            <span>♀</span>
            <span>Female</span>
          </button>
        </div>
      </div>
    </header>
  );
};
