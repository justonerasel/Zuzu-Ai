import React, { useState } from 'react';
import { 
  History, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Square, 
  Mic, 
  Volume2, 
  Sparkles, 
  Repeat, 
  Download, 
  Search,
  ShieldCheck,
  Calendar,
  Clock,
  AlertCircle
} from 'lucide-react';
import { VoiceSession, VoiceMessage, VoiceIdentity, AppSettings } from '../types';
import { VOICE_IDENTITIES } from '../constants/personalities';
import { getVoiceSessions, deleteVoiceSession, clearVoiceHistory } from '../utils/storage';
import { speakText, stopSpeaking, playHapticSound } from '../utils/audio';

interface HistoryViewProps {
  settings: AppSettings;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ settings }) => {
  const [sessions, setSessions] = useState<VoiceSession[]>(() => getVoiceSessions());
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(sessions[0]?.id || null);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIdentity, setFilterIdentity] = useState<'all' | 'male' | 'female'>('all');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedSessionId(prev => (prev === id ? null : id));
  };

  const handlePlayAudio = (msg: VoiceMessage) => {
    if (playingMessageId === msg.id) {
      stopSpeaking();
      setPlayingMessageId(null);
      return;
    }

    stopSpeaking();
    setPlayingMessageId(msg.id);

    const voiceId =
      msg.voiceIdentity === 'female'
        ? settings.elevenLabsFemaleVoiceId
        : settings.elevenLabsMaleVoiceId;

    speakText({
      text: msg.text,
      voiceIdentity: msg.voiceIdentity,
      customVoiceId: voiceId,
      customApiKey: settings.customElevenLabsApiKey,
      onStart: () => setPlayingMessageId(msg.id),
      onEnd: () => setPlayingMessageId(null),
      onError: () => setPlayingMessageId(null)
    });
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteVoiceSession(sessionId);
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (expandedSessionId === sessionId) setExpandedSessionId(null);
    playHapticSound('listen_stop');
  };

  const handleClearAll = () => {
    clearVoiceHistory();
    setSessions([]);
    setShowClearConfirm(false);
    playHapticSound('listen_stop');
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    if (filterIdentity !== 'all' && session.voiceIdentity !== filterIdentity) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchesTitle = session.title.toLowerCase().includes(q);
    const matchesContent = session.messages.some(m => m.text.toLowerCase().includes(q));
    return matchesTitle || matchesContent;
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07090e] overflow-hidden select-none">
      {/* Top Header */}
      <div className="px-4 py-2.5 bg-[#0d111c] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide">Voice Sessions History</h2>
            <div className="text-[10px] text-slate-400">Strictly voice mode recordings & transcripts</div>
          </div>
        </div>

        {sessions.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
            title="Clear Voice History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Strict Isolation Notice */}
      <div className="bg-[#0b0f19] px-4 py-1.5 border-b border-white/5 flex items-center justify-between text-[10px] text-slate-400">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <ShieldCheck className="w-3 h-3" />
          Voice transcripts only • Typed chat excluded.
        </span>
        <span className="text-slate-400 font-mono">{sessions.length} sessions</span>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-3 bg-[#0a0d16] border-b border-white/5 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search spoken transcripts..."
            className="w-full bg-[#121624] text-xs text-slate-100 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterIdentity('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              filterIdentity === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Voices
          </button>
          <button
            onClick={() => setFilterIdentity('male')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              filterIdentity === 'male'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            ♂ Male Zuzu
          </button>
          <button
            onClick={() => setFilterIdentity('female')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              filterIdentity === 'female'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            ♀ Female Zuzu
          </button>
        </div>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {filteredSessions.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-purple-400 mb-3">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-200 text-sm">No Voice Sessions Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
              Tap the center Voice button to start speaking. All audio interactions and transcripts will appear here.
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isExpanded = expandedSessionId === session.id;
            const primaryIdConfig = VOICE_IDENTITIES[session.voiceIdentity || 'male'];
            const switchEvents = session.messages.filter(m => m.isSwitchCommand);

            return (
              <div
                key={session.id}
                className="bg-[#0e121e] border border-white/10 rounded-2xl overflow-hidden shadow-md transition-all"
              >
                {/* Session Card Header */}
                <div
                  onClick={() => toggleExpand(session.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${primaryIdConfig.avatarGradient} p-0.5 flex-shrink-0 flex items-center justify-center shadow-sm`}
                    >
                      <div className="w-full h-full bg-[#0a0d17] rounded-[10px] flex items-center justify-center">
                        <Mic
                          className={`w-4 h-4 ${
                            session.voiceIdentity === 'female' ? 'text-rose-400' : 'text-cyan-400'
                          }`}
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-100 text-xs tracking-tight flex items-center gap-1.5">
                        <span>{session.title}</span>
                        {switchEvents.length > 0 && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-0.5">
                            <Repeat className="w-2.5 h-2.5" /> Switched
                          </span>
                        )}
                      </h4>

                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {new Date(session.startTime).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(session.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span>•</span>
                        <span className="text-slate-300 font-semibold">
                          {session.messages.length} turns
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-white/10"
                      title="Delete Session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Session Transcript Messages (Accordion) */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-[#0a0d16] p-3 space-y-2.5">
                    {session.messages.map((msg) => {
                      const isUser = msg.sender === 'user';
                      const msgIdConfig = VOICE_IDENTITIES[msg.voiceIdentity || 'male'];
                      const isPlaying = playingMessageId === msg.id;

                      return (
                        <div
                          key={msg.id}
                          className={`p-2.5 rounded-xl border text-xs leading-relaxed ${
                            isUser
                              ? 'bg-slate-900/80 border-white/5 text-slate-200'
                              : 'bg-[#121829] border-white/10 text-white'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                            <span className="font-semibold flex items-center gap-1">
                              {isUser ? (
                                <>
                                  <Mic className="w-3 h-3 text-emerald-400" />
                                  <span>User (Spoken)</span>
                                </>
                              ) : (
                                <>
                                  <Volume2
                                    className={`w-3 h-3 ${
                                      msg.voiceIdentity === 'female' ? 'text-rose-400' : 'text-cyan-400'
                                    }`}
                                  />
                                  <span>{msgIdConfig.name}</span>
                                </>
                              )}

                              {msg.isSwitchCommand && (
                                <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                                  VOICE SWITCH COMMAND
                                </span>
                              )}
                            </span>

                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[9px]">
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit'
                                })}
                              </span>

                              {!isUser && (
                                <button
                                  onClick={() => handlePlayAudio(msg)}
                                  className={`p-1 rounded-md text-xs font-semibold flex items-center gap-1 transition-all ${
                                    isPlaying
                                      ? 'bg-cyan-500 text-slate-950 font-bold'
                                      : 'bg-white/10 hover:bg-white/20 text-slate-300'
                                  }`}
                                  title="Replay Voice Audio"
                                >
                                  {isPlaying ? (
                                    <>
                                      <Square className="w-2.5 h-2.5 fill-current" />
                                      <span className="text-[9px]">Stop</span>
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-2.5 h-2.5 fill-current" />
                                      <span className="text-[9px]">Replay</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-slate-200 text-xs italic">
                            "{msg.text}"
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation to Clear Voice History */}
      {showClearConfirm && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f1422] border border-white/10 rounded-3xl p-5 max-w-xs w-full text-center shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Clear Voice History?</h4>
            <p className="text-xs text-slate-400 mt-1.5">
              This will permanently delete all voice session transcripts and recordings. Your Text Chat History remains untouched.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-xs text-slate-300 font-semibold hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2 rounded-xl bg-red-600 text-xs text-white font-bold hover:bg-red-700 shadow-lg shadow-red-700/30"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
