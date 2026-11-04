import React from 'react';
import { 
  Mic, 
  MessageSquareText, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Radio, 
  Volume2, 
  Shield, 
  Zap,
  Globe2,
  Settings2
} from 'lucide-react';
import { ActiveTab, AppSettings, PersonalityId, VoiceIdentity } from '../types';
import { PERSONALITIES, VOICE_IDENTITIES } from '../constants/personalities';
import { playHapticSound } from '../utils/audio';

interface DashboardViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  textMessageCount: number;
  voiceSessionCount: number;
  isBackendConnected: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  settings,
  onUpdateSettings,
  onNavigateTab,
  textMessageCount,
  voiceSessionCount,
  isBackendConnected
}) => {
  const currentIdentity = VOICE_IDENTITIES[settings.activeIdentity];
  const activePersonality = PERSONALITIES[settings.activePersonality] || PERSONALITIES.Normal;

  const handleSelectIdentity = (id: VoiceIdentity) => {
    if (id !== settings.activeIdentity) {
      playHapticSound('switch');
      onUpdateSettings({ activeIdentity: id });
    }
  };

  const handleSelectPersonality = (pId: PersonalityId) => {
    playHapticSound('message_sent');
    onUpdateSettings({ activePersonality: pId });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-6">
      {/* 1. Hero Active Identity Banner */}
      <div
        className={`relative overflow-hidden rounded-3xl p-5 border ${currentIdentity.borderColor} bg-gradient-to-br from-[#101424] to-[#0c0e18] shadow-xl`}
      >
        <div
          className={`absolute -right-8 -top-8 w-40 h-40 rounded-full blur-3xl opacity-30 ${
            settings.activeIdentity === 'female' ? 'bg-rose-500' : 'bg-cyan-500'
          }`}
        ></div>

        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-slate-300 mb-2 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Active Voice System
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              {currentIdentity.name}
              <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-slate-300 font-mono font-medium">
                {currentIdentity.genderBadge}
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-[270px]">
              {currentIdentity.tagline}
            </p>
          </div>

          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${currentIdentity.avatarGradient} p-1 shadow-lg ${currentIdentity.shadowColor} flex items-center justify-center`}
          >
            <div className="w-full h-full bg-[#0a0d16] rounded-xl flex items-center justify-center">
              <Sparkles
                className={`w-7 h-7 ${
                  settings.activeIdentity === 'female' ? 'text-rose-400' : 'text-cyan-400'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Action Button: Launch Voice Assistant */}
        <div className="mt-5 flex items-center gap-2.5">
          <button
            onClick={() => onNavigateTab('voice')}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-sm text-white bg-gradient-to-r ${
              settings.activeIdentity === 'female'
                ? 'from-rose-500 to-purple-600 shadow-rose-600/30'
                : 'from-cyan-500 to-blue-600 shadow-cyan-600/30'
            } shadow-lg flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all`}
          >
            <Mic className="w-4 h-4" />
            <span>Launch Voice Mode</span>
          </button>

          <button
            onClick={() => onNavigateTab('chat')}
            className="py-3 px-4 rounded-2xl font-semibold text-sm text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            title="Open Text Chat"
          >
            <MessageSquareText className="w-4 h-4" />
            <span>Chat</span>
          </button>
        </div>
      </div>

      {/* 2. Dual Voice Identity Selectors (Male vs Female) */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>Selectable Voice Identities</span>
          </h2>
          <span className="text-[10px] text-slate-400">ElevenLabs TTS</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Male Zuzu Card */}
          <div
            onClick={() => handleSelectIdentity('male')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              settings.activeIdentity === 'male'
                ? 'bg-gradient-to-b from-[#121c2e] to-[#0e1422] border-cyan-500 shadow-md shadow-cyan-500/20'
                : 'bg-[#0c101a] border-white/5 hover:border-white/20 opacity-80'
            }`}
          >
            {settings.activeIdentity === 'male' && (
              <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center text-white text-xs font-black mb-2 shadow-sm">
              ♂
            </div>
            <h3 className="font-bold text-sm text-white">Male Zuzu</h3>
            <p className="text-[10px] text-cyan-300 font-mono mt-0.5 truncate">
              ID: {settings.elevenLabsMaleVoiceId.slice(0, 8)}...
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight line-clamp-2">
              Deep, crisp articulation & commanding tone.
            </p>
          </div>

          {/* Female Zuzu Card */}
          <div
            onClick={() => handleSelectIdentity('female')}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
              settings.activeIdentity === 'female'
                ? 'bg-gradient-to-b from-[#241324] to-[#160c18] border-rose-500 shadow-md shadow-rose-500/20'
                : 'bg-[#0c101a] border-white/5 hover:border-white/20 opacity-80'
            }`}
          >
            {settings.activeIdentity === 'female' && (
              <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-rose-500 text-slate-950 flex items-center justify-center text-xs font-bold">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            )}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-purple-700 flex items-center justify-center text-white text-xs font-black mb-2 shadow-sm">
              ♀
            </div>
            <h3 className="font-bold text-sm text-white">Female Zuzu</h3>
            <p className="text-[10px] text-rose-300 font-mono mt-0.5 truncate">
              ID: {settings.elevenLabsFemaleVoiceId.slice(0, 8)}...
            </p>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight line-clamp-2">
              Warm, luminous, melodic & empathetic cadence.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Strict History Separation Architecture Status */}
      <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict History Separation</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
            ENFORCED
          </span>
        </div>

        <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
          Chat Mode and Voice Mode are isolated into separate persistent data channels.
          Conversations never cross-contaminate.
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => onNavigateTab('chat')}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-left flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Text Chat Only</div>
              <div className="font-bold text-slate-200 text-sm mt-0.5">
                {textMessageCount} <span className="text-[11px] font-normal text-slate-400">msgs</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={() => onNavigateTab('history')}
            className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-left flex items-center justify-between group transition-colors"
          >
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Voice Mode Only</div>
              <div className="font-bold text-slate-200 text-sm mt-0.5">
                {voiceSessionCount} <span className="text-[11px] font-normal text-slate-400">sessions</span>
              </div>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>

      {/* 4. Natural Voice Identity Commands Guide (Bengali & English) */}
      <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Voice Switch Commands (EN & BN)</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">Bilingual</span>
        </div>

        <p className="text-[11px] text-slate-400 mb-2.5">
          Speak naturally anytime during Voice Mode to switch identities without terminating continuous listening:
        </p>

        <div className="space-y-2 text-xs">
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
            <div className="text-[10px] text-rose-400 font-bold uppercase mb-1">
              Switch to Female Zuzu:
            </div>
            <div className="font-mono text-slate-200 text-[11px] space-y-0.5">
              <div>• "Switch to Female Zuzu"</div>
              <div>• "Male Zuzu, convert to Female Zuzu"</div>
              <div className="font-bengali text-amber-200">• "আমি চাই তুমি Female Zuzu হয়ে যাও।"</div>
            </div>
          </div>

          <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
            <div className="text-[10px] text-cyan-400 font-bold uppercase mb-1">
              Switch to Male Zuzu:
            </div>
            <div className="font-mono text-slate-200 text-[11px] space-y-0.5">
              <div>• "Switch to Male Zuzu"</div>
              <div>• "Female Zuzu, convert to Male Zuzu"</div>
              <div className="font-bengali text-amber-200">• "আমি চাই তুমি Male Zuzu হয়ে যাও।"</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. 10 Personalities Selection Bar */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Personality ({Object.keys(PERSONALITIES).length} Available)</span>
          </h2>
          <span className="text-[10px] text-slate-400">Independent of Voice</span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {Object.values(PERSONALITIES).map((p) => {
            const isSelected = settings.activePersonality === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPersonality(p.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500/50 text-amber-300 shadow-md shadow-amber-500/10'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10'
                }`}
              >
                <span>{p.emoji}</span>
                <span>{p.name}</span>
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
              </button>
            );
          })}
        </div>

        <div className="mt-1 px-1 text-[11px] text-slate-400 italic">
          "{activePersonality.name}": {activePersonality.description}
        </div>
      </div>
    </div>
  );
};
