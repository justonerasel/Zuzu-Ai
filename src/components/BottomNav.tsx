import React from 'react';
import { LayoutDashboard, MessageSquareText, Mic, History, Settings } from 'lucide-react';
import { ActiveTab, VoiceIdentity } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  activeIdentity: VoiceIdentity;
  isVoiceActive?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  activeIdentity,
  isVoiceActive = false
}) => {
  const primaryGlow =
    activeIdentity === 'female'
      ? 'from-rose-500 to-purple-600 shadow-rose-500/40'
      : 'from-cyan-500 to-blue-600 shadow-cyan-500/40';

  const activeColor =
    activeIdentity === 'female' ? 'text-rose-400' : 'text-cyan-400';

  return (
    <nav className="h-16 bg-[#0b0e17]/95 backdrop-blur-xl border-t border-white/10 px-3 flex items-center justify-around z-30 select-none relative">
      {/* 1. Dashboard */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          activeTab === 'dashboard' ? activeColor : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium tracking-tight">Dashboard</span>
      </button>

      {/* 2. Chat (Text Only) */}
      <button
        onClick={() => onSelectTab('chat')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          activeTab === 'chat' ? activeColor : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <MessageSquareText className="w-5 h-5 mb-0.5" />
          <span className="absolute -top-1 -right-2 text-[8px] bg-blue-500 text-white font-bold px-1 rounded-full">
            TXT
          </span>
        </div>
        <span className="text-[10px] font-medium tracking-tight">Chat</span>
      </button>

      {/* 3. Center Elevated Voice FAB */}
      <div className="flex-1 flex justify-center -mt-5">
        <button
          onClick={() => onSelectTab('voice')}
          className={`w-13 h-13 rounded-full bg-gradient-to-tr ${primaryGlow} shadow-lg flex items-center justify-center text-white border-2 border-[#0b0e17] transform active:scale-95 transition-all duration-200 ${
            isVoiceActive ? 'animate-pulse ring-4 ring-cyan-400/30' : ''
          }`}
          title="Open Voice Assistant"
        >
          <Mic className="w-6 h-6" />
        </button>
      </div>

      {/* 4. History (Voice Only) */}
      <button
        onClick={() => onSelectTab('history')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          activeTab === 'history' ? activeColor : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <History className="w-5 h-5 mb-0.5" />
          <span className="absolute -top-1 -right-2 text-[8px] bg-purple-500 text-white font-bold px-1 rounded-full">
            VOX
          </span>
        </div>
        <span className="text-[10px] font-medium tracking-tight">History</span>
      </button>

      {/* 5. Settings */}
      <button
        onClick={() => onSelectTab('settings')}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
          activeTab === 'settings' ? activeColor : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Settings className="w-5 h-5 mb-0.5" />
        <span className="text-[10px] font-medium tracking-tight">Settings</span>
      </button>
    </nav>
  );
};
