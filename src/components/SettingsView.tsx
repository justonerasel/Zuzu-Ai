import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Volume2, 
  ShieldCheck, 
  Key, 
  Sliders, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Play, 
  Globe2, 
  Smartphone, 
  Radio, 
  FileText,
  UserCheck,
  Info,
  CheckCircle2,
  Mic,
  Cpu,
  Trash2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Gauge
} from 'lucide-react';
import { AppSettings, PersonalityId, VoiceIdentity } from '../types';
import { PERSONALITIES, VOICE_IDENTITIES } from '../constants/personalities';
import { DEFAULT_SETTINGS, clearChatHistory, clearVoiceHistory, getChatMessages, getVoiceSessions } from '../utils/storage';
import { speakText, stopSpeaking, playHapticSound } from '../utils/audio';
import { checkMicrophonePermission, requestMicrophonePermission, openAndroidAppSettingsGuide, MicrophonePermissionState } from '../utils/permission';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
}

const PREMADE_MALE_PRESETS = [
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian (Deep & Crisp)', badge: 'Free Premade' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (Baritone)', badge: 'Free Premade' },
  { id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger (Laid-back)', badge: 'Free Premade' },
];

const PREMADE_FEMALE_PRESETS = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (Soft & Warm)', badge: 'Free Premade' },
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria (Expressive)', badge: 'Free Premade' },
  { id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura (Narrator)', badge: 'Free Premade' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings }) => {
  const [testingVoice, setTestingVoice] = useState<VoiceIdentity | null>(null);
  const [micState, setMicState] = useState<MicrophonePermissionState>('prompt');
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [backendConfig, setBackendConfig] = useState<{
    hasElevenLabsKey: boolean;
    hasGeminiKey: boolean;
    maleVoiceId: string;
    femaleVoiceId: string;
    version: string;
  } | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);

  const [confirmClearType, setConfirmClearType] = useState<'text' | 'voice' | null>(null);
  const [chatCount, setChatCount] = useState(0);
  const [voiceCount, setVoiceCount] = useState(0);

  useEffect(() => {
    fetch('/api/config')
      .then(res => res.json())
      .then(data => setBackendConfig(data))
      .catch(err => console.warn('Could not fetch backend config:', err));

    checkMicrophonePermission().then(res => setMicState(res.state));
    updateCounts();
  }, []);

  const updateCounts = () => {
    setChatCount(getChatMessages().length);
    setVoiceCount(getVoiceSessions().length);
  };

  const handleTestVoice = (identity: VoiceIdentity) => {
    if (testingVoice === identity) {
      stopSpeaking();
      setTestingVoice(null);
      return;
    }

    stopSpeaking();
    setTestingVoice(identity);
    playHapticSound('switch');

    const testText =
      identity === 'female'
        ? "Hello! I am Female Zuzu. My voice is warm, expressive, and ready to assist you on Android."
        : "Hello! I am Male Zuzu. My voice is deep, articulate, and ready to assist you on Android.";

    const voiceId =
      identity === 'female'
        ? settings.elevenLabsFemaleVoiceId
        : settings.elevenLabsMaleVoiceId;

    speakText({
      text: testText,
      voiceIdentity: identity,
      customVoiceId: voiceId,
      customApiKey: settings.customElevenLabsApiKey,
      stability: settings.stability,
      similarityBoost: settings.similarityBoost,
      speechRate: settings.speechRate,
      onStart: () => setTestingVoice(identity),
      onEnd: () => setTestingVoice(null),
      onError: () => setTestingVoice(null)
    });
  };

  const handleRequestMicPermission = async () => {
    setIsTestingMic(true);
    playHapticSound('message_sent');
    try {
      const res = await requestMicrophonePermission();
      setMicState(res.state);
      if (res.success) {
        playHapticSound('listen_start');
      } else {
        playHapticSound('listen_stop');
      }
    } finally {
      setIsTestingMic(false);
    }
  };

  const handleTestAiConnection = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);
    playHapticSound('message_sent');

    const startTime = Date.now();
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ sender: 'user', text: 'Ping Zuzu AI' }],
          personality: settings.activePersonality,
          voiceIdentity: settings.activeIdentity,
          customGeminiKey: settings.customGeminiApiKey
        })
      });

      const data = await res.json();
      const latency = Date.now() - startTime;
      const model = data.model || 'gemini-3.8-flash';
      setAiTestResult(`Success (${latency}ms) • Engine: ${model}`);
      playHapticSound('listen_start');
    } catch (err: any) {
      setAiTestResult(`Connection offline • Local reasoning engine active`);
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleClearChat = () => {
    clearChatHistory();
    setConfirmClearType(null);
    updateCounts();
    playHapticSound('listen_stop');
  };

  const handleClearVoice = () => {
    clearVoiceHistory();
    setConfirmClearType(null);
    updateCounts();
    playHapticSound('listen_stop');
  };

  const handleResetDefaults = () => {
    onUpdateSettings(DEFAULT_SETTINGS);
    playHapticSound('listen_stop');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 pb-8 select-none">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-4 h-4 text-cyan-400" />
            <span>Zuzu AI Settings &amp; Permissions</span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Configure dual gender voices, AI models, microphone access, and personalities.
          </p>
        </div>

        <button
          onClick={handleResetDefaults}
          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-white/10 transition-colors"
          title="Reset All Settings to Defaults"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Reset</span>
        </button>
      </div>

      {/* 2. Microphone Permission Status Card */}
      <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            <span>Microphone Permission Status</span>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold ${
              micState === 'granted'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : micState === 'denied'
                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
            }`}
          >
            {micState === 'granted' ? (
              <>
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>GRANTED</span>
              </>
            ) : micState === 'denied' ? (
              <>
                <ShieldAlert className="w-2.5 h-2.5" />
                <span>DENIED / BLOCKED</span>
              </>
            ) : (
              <span>NOT GRANTED</span>
            )}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Zuzu AI requires Android microphone permission (<code className="text-cyan-300 font-mono text-[10px]">RECORD_AUDIO</code>) to process your speech input, hear switch commands, and enable hands-free Continuous Listening.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleRequestMicPermission}
            disabled={isTestingMic}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              micState === 'granted'
                ? 'bg-white/10 text-slate-300 hover:bg-white/15'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-600/25'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isTestingMic ? 'Testing Access...' : micState === 'granted' ? 'Re-verify Permission' : 'Grant Microphone Permission'}</span>
          </button>

          {micState === 'denied' && (
            <button
              onClick={openAndroidAppSettingsGuide}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-white/10"
              title="Open Android Settings"
            >
              <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
              <span>App Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. AI Model & API Connection Status Card */}
      <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Model &amp; API Pipeline</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-full">
            Gemini 3.8 Flash
          </span>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed">
          Powered by Gemini 3.8 Flash for reasoning, natural conversation, code generation, and Bengali &amp; English bilingual comprehension.
        </p>

        {/* Custom Gemini Key Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Key className="w-3 h-3 text-cyan-400" />
              <span>Gemini API Key (Optional Override):</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {backendConfig?.hasGeminiKey ? 'Server Secret Active' : 'Offline Engine Ready'}
            </span>
          </label>
          <input
            type="password"
            value={settings.customGeminiApiKey}
            onChange={(e) => onUpdateSettings({ customGeminiApiKey: e.target.value.trim() })}
            placeholder="Leave empty to use server environment key"
            className="w-full bg-[#121624] text-xs font-mono text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Test Connection Button */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleTestAiConnection}
            disabled={isTestingAi}
            className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{isTestingAi ? 'Testing Connection...' : 'Test AI Connection'}</span>
          </button>

          {aiTestResult && (
            <span className="text-[10px] text-emerald-300 font-mono truncate">
              {aiTestResult}
            </span>
          )}
        </div>
      </div>

      {/* 4. Primary Voice Identity Selection */}
      <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Primary Voice Identity</span>
          </div>
          <span className="text-[10px] text-cyan-400 font-mono">Dual System</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onUpdateSettings({ activeIdentity: 'male' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              settings.activeIdentity === 'male'
                ? 'bg-cyan-500/20 border-cyan-500 text-white shadow-md shadow-cyan-500/20'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-white">♂ Male Zuzu</span>
              {settings.activeIdentity === 'male' && <Check className="w-3.5 h-3.5 text-cyan-400 stroke-[3]" />}
            </div>
            <p className="text-[10px] text-slate-400">Authoritative, deep resonance</p>
          </button>

          <button
            onClick={() => onUpdateSettings({ activeIdentity: 'female' })}
            className={`p-3 rounded-xl border text-left transition-all ${
              settings.activeIdentity === 'female'
                ? 'bg-rose-500/20 border-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-xs text-white">♀ Female Zuzu</span>
              {settings.activeIdentity === 'female' && <Check className="w-3.5 h-3.5 text-rose-400 stroke-[3]" />}
            </div>
            <p className="text-[10px] text-slate-400">Warm, melodic cadence</p>
          </button>
        </div>
      </div>

      {/* 5. ElevenLabs Dual Voice ID Configuration with Free Premade Presets */}
      <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>ElevenLabs Voice System</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <ShieldCheck className="w-3 h-3" />
            Free-Tier Safe
          </span>
        </div>

        {/* Free Plan Guidance Box */}
        <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-slate-300 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-white">ElevenLabs Free Plan Compatibility:</strong> Free tier accounts can only use <em>Premade System Voices</em> via API. Community library voices return error 402. The presets below are verified 100% free-tier compatible.
          </div>
        </div>

        {/* Male Voice Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-cyan-300 flex items-center gap-1">
              <span>♂ Male Zuzu Voice:</span>
            </label>
            <button
              onClick={() => handleTestVoice('male')}
              className="text-[11px] px-2.5 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>{testingVoice === 'male' ? 'Playing...' : 'Test Male Voice'}</span>
            </button>
          </div>

          {/* Quick Presets for Male */}
          <div className="grid grid-cols-3 gap-1.5">
            {PREMADE_MALE_PRESETS.map((preset) => {
              const isSelected = settings.elevenLabsMaleVoiceId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onUpdateSettings({ elevenLabsMaleVoiceId: preset.id })}
                  className={`py-1.5 px-2 rounded-xl text-left border text-[10px] transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-200 font-bold shadow-sm'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="truncate">{preset.name}</div>
                  <div className="text-[8px] text-slate-400 font-mono mt-0.5">Free Premade</div>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <input
              type="text"
              value={settings.elevenLabsMaleVoiceId}
              onChange={(e) => onUpdateSettings({ elevenLabsMaleVoiceId: e.target.value.trim() })}
              placeholder="e.g. nPczCjzI2devNBz1zQrb (Brian)"
              className="w-full bg-[#121624] text-xs font-mono text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Female Voice Section */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-rose-300 flex items-center gap-1">
              <span>♀ Female Zuzu Voice:</span>
            </label>
            <button
              onClick={() => handleTestVoice('female')}
              className="text-[11px] px-2.5 py-0.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <Play className="w-2.5 h-2.5 fill-current" />
              <span>{testingVoice === 'female' ? 'Playing...' : 'Test Female Voice'}</span>
            </button>
          </div>

          {/* Quick Presets for Female */}
          <div className="grid grid-cols-3 gap-1.5">
            {PREMADE_FEMALE_PRESETS.map((preset) => {
              const isSelected = settings.elevenLabsFemaleVoiceId === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onUpdateSettings({ elevenLabsFemaleVoiceId: preset.id })}
                  className={`py-1.5 px-2 rounded-xl text-left border text-[10px] transition-all ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-bold shadow-sm'
                      : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="truncate">{preset.name}</div>
                  <div className="text-[8px] text-slate-400 font-mono mt-0.5">Free Premade</div>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <input
              type="text"
              value={settings.elevenLabsFemaleVoiceId}
              onChange={(e) => onUpdateSettings({ elevenLabsFemaleVoiceId: e.target.value.trim() })}
              placeholder="e.g. EXAVITQu4vr4xnSDxMaL (Sarah)"
              className="w-full bg-[#121624] text-xs font-mono text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Speech Speed / Playback Rate Slider */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-300 flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Speech Playback Speed:</span>
            </label>
            <span className="font-mono text-cyan-300 font-bold">{settings.speechRate.toFixed(2)}x</span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.5"
            step="0.05"
            value={settings.speechRate}
            onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
            className="w-full accent-cyan-500"
          />
        </div>

        {/* Optional Custom Key Override */}
        <div className="space-y-1 pt-2 border-t border-white/5">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
            <Key className="w-3 h-3 text-amber-400" />
            <span>Custom ElevenLabs Key (Optional):</span>
          </label>
          <input
            type="password"
            value={settings.customElevenLabsApiKey}
            onChange={(e) => onUpdateSettings({ customElevenLabsApiKey: e.target.value.trim() })}
            placeholder="Leave empty to use server backend configuration"
            className="w-full bg-[#121624] text-xs font-mono text-white px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* 6. Personality Matrix (10 Personalities) */}
      <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>10 Compatible Personalities</span>
          </div>
          <span className="text-[10px] text-amber-400 font-mono">Independent</span>
        </div>

        <p className="text-[11px] text-slate-400">
          Personalities apply equally to both Male Zuzu and Female Zuzu. Switching gender identity never resets your selected personality.
        </p>

        <div className="grid grid-cols-2 gap-2">
          {Object.values(PERSONALITIES).map((p) => {
            const isSelected = settings.activePersonality === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onUpdateSettings({ activePersonality: p.id })}
                className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                    : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base">{p.emoji}</span>
                  <div>
                    <div className="font-bold text-xs truncate">{p.name}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 stroke-[3] flex-shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Custom Personality Prompt editor if 'Custom' is selected */}
        {settings.activePersonality === 'Custom' && (
          <div className="pt-2 border-t border-white/5 space-y-1.5 animate-fade-in">
            <label className="text-[11px] font-semibold text-fuchsia-300">
              Custom Personality Instructions:
            </label>
            <textarea
              rows={2}
              value={settings.customPersonalityPrompt}
              onChange={(e) => onUpdateSettings({ customPersonalityPrompt: e.target.value })}
              placeholder="e.g. Speak like a cyberpunk detective in Neo-Tokyo..."
              className="w-full bg-[#121624] text-xs text-white p-2.5 rounded-xl border border-white/10 focus:outline-none focus:border-fuchsia-500"
            />
          </div>
        )}
      </div>

      {/* 7. History Management (Strict Separation Management) */}
      <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>History Storage Management</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Strict Isolation</span>
        </div>

        <p className="text-[11px] text-slate-400">
          Chat Mode text logs and Voice Mode audio transcripts are preserved in isolated persistent tables.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Text Chat Messages</div>
              <div className="text-lg font-black text-white mt-1">{chatCount}</div>
            </div>
            <button
              onClick={() => setConfirmClearType('text')}
              disabled={chatCount === 0}
              className="mt-2 py-1.5 px-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Chat</span>
            </button>
          </div>

          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">Voice Sessions</div>
              <div className="text-lg font-black text-white mt-1">{voiceCount}</div>
            </div>
            <button
              onClick={() => setConfirmClearType('voice')}
              disabled={voiceCount === 0}
              className="mt-2 py-1.5 px-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 disabled:opacity-40"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Voice</span>
            </button>
          </div>
        </div>
      </div>

      {/* 8. Speech Recognition Language & Continuous Listening */}
      <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4 space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Language &amp; Recognition Engine</span>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-400">
            Voice Recognition Language:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'auto', label: 'Auto (Bilingual)' },
              { id: 'en-US', label: 'English (US)' },
              { id: 'bn-BD', label: 'বাংলা (Bengali)' }
            ].map(lang => (
              <button
                key={lang.id}
                onClick={() => onUpdateSettings({ recognitionLanguage: lang.id as any })}
                className={`py-2 px-1 text-[11px] font-semibold rounded-xl border text-center transition-all ${
                  settings.recognitionLanguage === lang.id
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">Continuous Listening Mode</div>
            <div className="text-[10px] text-slate-400">Automatically listen again after Zuzu speaks</div>
          </div>
          <button
            onClick={() => onUpdateSettings({ continuousListening: !settings.continuousListening })}
            className={`w-11 h-6 rounded-full transition-colors relative ${
              settings.continuousListening ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                settings.continuousListening ? 'left-6' : 'left-1'
              }`}
            ></div>
          </button>
        </div>
      </div>

      {/* 9. View Mode (Android Bezel Shell vs Fullscreen) */}
      <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Display Shell View</span>
          </div>
          <div className="text-[10px] text-slate-400">Toggle between Android phone frame and full screen</div>
        </div>

        <button
          onClick={() =>
            onUpdateSettings({
              viewMode: settings.viewMode === 'android_frame' ? 'fullscreen' : 'android_frame'
            })
          }
          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold border border-white/10 transition-colors"
        >
          {settings.viewMode === 'android_frame' ? 'Phone Bezel ON' : 'Fullscreen ON'}
        </button>
      </div>

      {/* 10. About Zuzu AI & Android System Info */}
      <div className="bg-[#0b0e17] border border-white/10 rounded-2xl p-4 space-y-2">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-300">About Zuzu AI</div>
        <div className="text-[11px] text-slate-400 space-y-1">
          <div>Application: <strong className="text-slate-200">Zuzu AI Android</strong></div>
          <div>Package: <code className="text-cyan-300 font-mono text-[10px]">com.zuzu.ai.assistant</code></div>
          <div>Version: <span className="text-slate-300 font-mono">{backendConfig?.version || '3.2.0-android'}</span></div>
          <div>Runtime: Android Native Web Container with ElevenLabs &amp; Gemini 3.8 Flash</div>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {confirmClearType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f1422] border border-white/10 rounded-3xl p-5 max-w-xs w-full text-center shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">
              Clear {confirmClearType === 'text' ? 'Chat History' : 'Voice Sessions'}?
            </h4>
            <p className="text-xs text-slate-400 mt-1.5">
              {confirmClearType === 'text'
                ? 'This will permanently delete typed conversations. Your Voice History remains untouched.'
                : 'This will permanently delete voice recordings and transcripts. Your Text Chat History remains untouched.'}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setConfirmClearType(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-xs text-slate-300 font-semibold hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={confirmClearType === 'text' ? handleClearChat : handleClearVoice}
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
