import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Square, 
  Minimize2, 
  Sparkles, 
  Volume2, 
  Repeat, 
  Radio, 
  AlertCircle,
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import { AppSettings, VoiceIdentity, VoiceMessage, VoiceSession } from '../types';
import { PERSONALITIES, VOICE_IDENTITIES } from '../constants/personalities';
import { detectVoiceSwitchIntent } from '../utils/intentDetector';
import { playHapticSound, speakText, stopSpeaking } from '../utils/audio';
import { saveVoiceSession, getVoiceSessions } from '../utils/storage';
import { checkMicrophonePermission } from '../utils/permission';
import { MicrophonePermissionModal } from './MicrophonePermissionModal';
import { generateIntelligentAnswer } from '../utils/aiEngine';

interface VoiceViewProps {
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onMinimize: () => void;
  currentSession: VoiceSession | null;
  setCurrentSession: React.Dispatch<React.SetStateAction<VoiceSession | null>>;
}

export const VoiceView: React.FC<VoiceViewProps> = ({
  settings,
  onUpdateSettings,
  onMinimize,
  currentSession,
  setCurrentSession
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('Tap microphone to start voice session');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isContinuousRef = useRef(settings.continuousListening);
  const activeIdentityRef = useRef(settings.activeIdentity);
  const sessionRef = useRef(currentSession);
  const isCancelledRef = useRef(false);

  // Sync refs with latest props
  useEffect(() => {
    isContinuousRef.current = settings.continuousListening;
  }, [settings.continuousListening]);

  useEffect(() => {
    activeIdentityRef.current = settings.activeIdentity;
  }, [settings.activeIdentity]);

  useEffect(() => {
    sessionRef.current = currentSession;
  }, [currentSession]);

  const currentIdentityConfig = VOICE_IDENTITIES[settings.activeIdentity];
  const currentPersonality = PERSONALITIES[settings.activePersonality] || PERSONALITIES.Normal;

  // Initialize or retrieve voice session
  const getOrCreateVoiceSession = (): VoiceSession => {
    if (sessionRef.current) return sessionRef.current;

    const newSession: VoiceSession = {
      id: `voice-session-${Date.now()}`,
      conversation_type: 'voice',
      title: `Voice Session: ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      startTime: Date.now(),
      voiceIdentity: settings.activeIdentity,
      personality: settings.activePersonality,
      messages: []
    };

    sessionRef.current = newSession;
    setCurrentSession(newSession);
    saveVoiceSession(newSession);
    return newSession;
  };

  // Add voice message strictly to voice session
  const appendVoiceMessage = (msg: Omit<VoiceMessage, 'id' | 'conversation_type' | 'sessionId'>) => {
    const session = getOrCreateVoiceSession();
    const fullMsg: VoiceMessage = {
      ...msg,
      id: `vox-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      conversation_type: 'voice',
      sessionId: session.id
    };

    const updatedSession: VoiceSession = {
      ...session,
      messages: [...session.messages, fullMsg],
      endTime: Date.now()
    };

    sessionRef.current = updatedSession;
    setCurrentSession(updatedSession);
    saveVoiceSession(updatedSession);
  };

  // Start Speech Recognition
  const startListening = () => {
    setErrorNotice(null);
    isCancelledRef.current = false;
    stopSpeaking();

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setErrorNotice('Speech Recognition not supported in this browser. Please use Chrome/Edge or modern Android WebView.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }

      const recognition = new SpeechRecognitionClass();
      recognitionRef.current = recognition;

      recognition.continuous = false; // We manage continuous turns ourselves
      recognition.interimResults = true;

      // Select language based on settings
      if (settings.recognitionLanguage === 'bn-BD') {
        recognition.lang = 'bn-BD';
      } else if (settings.recognitionLanguage === 'en-US') {
        recognition.lang = 'en-US';
      } else {
        // Auto / bilingual default
        recognition.lang = 'en-US';
      }

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage(`Listening to your voice...`);
        playHapticSound('listen_start');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setShowPermissionModal(true);
          setErrorNotice('Android microphone permission is required for voice conversation.');
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setErrorNotice(`Microphone error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (isCancelledRef.current) return;

        // Process final captured transcript
        if (transcript.trim().length > 0) {
          handleUserVoiceInput(transcript.trim());
          setTranscript('');
        } else if (isContinuousRef.current && !isSpeaking && !isProcessing) {
          // If no speech captured but continuous listening is active, restart gracefully
          setStatusMessage('Ready for next command...');
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setErrorNotice(err.message || 'Microphone activation failed');
    }
  };

  // Check microphone permission before initiating speech recognition
  const ensurePermissionAndStart = async () => {
    try {
      const perm = await checkMicrophonePermission();
      if (perm.state !== 'granted') {
        setShowPermissionModal(true);
        return;
      }
      startListening();
    } catch {
      startListening();
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
    playHapticSound('listen_stop');
  };

  // Cancel action: stops everything immediately
  const handleCancel = () => {
    isCancelledRef.current = true;
    stopListening();
    stopSpeaking();
    setIsSpeaking(false);
    setIsProcessing(false);
    setStatusMessage('Voice interaction cancelled.');
    playHapticSound('listen_stop');
  };

  // Speak with active or switched identity
  const speakZuzuResponse = (
    responseText: string,
    targetIdentity: VoiceIdentity,
    onFinishCallback?: () => void
  ) => {
    setIsSpeaking(true);
    setStatusMessage(`Speaking as ${VOICE_IDENTITIES[targetIdentity].name}...`);

    const voiceId =
      targetIdentity === 'female'
        ? settings.elevenLabsFemaleVoiceId
        : settings.elevenLabsMaleVoiceId;

    speakText({
      text: responseText,
      voiceIdentity: targetIdentity,
      customVoiceId: voiceId,
      customApiKey: settings.customElevenLabsApiKey,
      stability: settings.stability,
      similarityBoost: settings.similarityBoost,
      speechRate: settings.speechRate,
      onStart: () => {
        setIsSpeaking(true);
      },
      onEnd: () => {
        setIsSpeaking(false);
        setStatusMessage('Listening finished.');
        onFinishCallback?.();

        // Continuous listening: restart listening after speaking finishes
        if (isContinuousRef.current && !isCancelledRef.current) {
          setTimeout(() => {
            if (!isCancelledRef.current) {
              startListening();
            }
          }, 400);
        }
      },
      onError: (err) => {
        console.warn('Speech playback error:', err);
        setIsSpeaking(false);
        if (isContinuousRef.current && !isCancelledRef.current) {
          setTimeout(() => startListening(), 400);
        }
      }
    });
  };

  // Core Voice Input Processing & Identity Switching Logic
  const handleUserVoiceInput = async (spokenText: string) => {
    if (!spokenText.trim()) return;

    setIsProcessing(true);
    setStatusMessage('Processing speech intent...');

    const currentId = activeIdentityRef.current;

    // 1. Check for Voice Switch Command in English or Bengali
    const switchIntent = detectVoiceSwitchIntent(spokenText, currentId);

    // Case A: Unambiguous Switch Command Detected
    if (switchIntent.isSwitchCommand && switchIntent.targetIdentity) {
      const newIdentity = switchIntent.targetIdentity;
      playHapticSound('switch');

      // Update active identity preference in state and storage
      onUpdateSettings({ activeIdentity: newIdentity });
      activeIdentityRef.current = newIdentity;

      // Save user switch command to Voice History
      appendVoiceMessage({
        sender: 'user',
        text: spokenText,
        timestamp: Date.now(),
        voiceIdentity: currentId,
        isSwitchCommand: true
      });

      // Confirmation response to be spoken by NEW identity
      const confirmationText = switchIntent.confirmationSpoken;

      // Save assistant confirmation to Voice History
      appendVoiceMessage({
        sender: 'assistant',
        text: confirmationText,
        timestamp: Date.now() + 100,
        voiceIdentity: newIdentity,
        audioDuration: 3
      });

      setIsProcessing(false);

      // Speak using the NEW identity's ElevenLabs voice!
      speakZuzuResponse(confirmationText, newIdentity);
      return;
    }

    // Case B: Ambiguous command detected (ask confirmation)
    if (switchIntent.isAmbiguous && switchIntent.ambiguousQuestion) {
      const clarifyText = switchIntent.ambiguousQuestion;

      appendVoiceMessage({
        sender: 'user',
        text: spokenText,
        timestamp: Date.now(),
        voiceIdentity: currentId
      });

      appendVoiceMessage({
        sender: 'assistant',
        text: clarifyText,
        timestamp: Date.now() + 100,
        voiceIdentity: currentId
      });

      setIsProcessing(false);
      speakZuzuResponse(clarifyText, currentId);
      return;
    }

    // Case C: Standard Voice Query / Conversation
    // Save user voice query strictly to Voice History
    appendVoiceMessage({
      sender: 'user',
      text: spokenText,
      timestamp: Date.now(),
      voiceIdentity: currentId
    });

    try {
      const session = sessionRef.current;
      const historyContext = (session?.messages || []).map(m => ({
        sender: m.sender,
        text: m.text
      }));

      // Call Gemini AI backend
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...historyContext, { sender: 'user', text: spokenText }],
          personality: settings.activePersonality,
          voiceIdentity: currentId,
          customPersonalityPrompt: settings.customPersonalityPrompt,
          customGeminiKey: settings.customGeminiApiKey,
          isVoiceMode: true // Spoken response optimization
        })
      });

      const data = await res.json();
      let aiReply = data.reply;

      if (!aiReply || aiReply.trim().length === 0) {
        aiReply = generateIntelligentAnswer({
          userQuestion: spokenText,
          conversationHistory: historyContext,
          personality: settings.activePersonality,
          voiceIdentity: currentId,
          customPersonalityPrompt: settings.customPersonalityPrompt,
          isVoiceMode: true
        });
      }

      // Save AI voice response to Voice History
      appendVoiceMessage({
        sender: 'assistant',
        text: aiReply,
        timestamp: Date.now() + 100,
        voiceIdentity: currentId
      });

      setIsProcessing(false);

      // Speak the response using the active identity's voice
      speakZuzuResponse(aiReply, currentId);
    } catch (err: any) {
      console.warn('Voice Assistant Query Network Fallback:', err);
      setIsProcessing(false);
      const fallbackReply = generateIntelligentAnswer({
        userQuestion: spokenText,
        conversationHistory: (sessionRef.current?.messages || []).map(m => ({ sender: m.sender, text: m.text })),
        personality: settings.activePersonality,
        voiceIdentity: currentId,
        customPersonalityPrompt: settings.customPersonalityPrompt,
        isVoiceMode: true
      });

      appendVoiceMessage({
        sender: 'assistant',
        text: fallbackReply,
        timestamp: Date.now() + 100,
        voiceIdentity: currentId
      });
      speakZuzuResponse(fallbackReply, currentId);
    }
  };

  // Toggle Continuous Listening
  const handleToggleContinuous = () => {
    const updated = !settings.continuousListening;
    onUpdateSettings({ continuousListening: updated });
    playHapticSound('message_sent');
  };

  // Manual Identity Switch Button
  const handleManualSwitch = () => {
    const target: VoiceIdentity = settings.activeIdentity === 'male' ? 'female' : 'male';
    playHapticSound('switch');
    onUpdateSettings({ activeIdentity: target });
    setStatusMessage(`Switched to ${VOICE_IDENTITIES[target].name}.`);
  };

  // Dynamic visualizer bars
  const visualizerActive = isListening || isSpeaking || isProcessing;

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-[#090d16] via-[#07090e] to-[#04060a] relative overflow-hidden select-none">
      {/* Top Controls bar within Voice View */}
      <div className="px-4 py-3 flex items-center justify-between z-20">
        {/* Identity Selector Pill */}
        <button
          onClick={handleManualSwitch}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
            settings.activeIdentity === 'female'
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-500/20'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-cyan-500/20'
          }`}
          title="Tap to switch identity"
        >
          <span>{settings.activeIdentity === 'female' ? '♀ Female Zuzu' : '♂ Male Zuzu'}</span>
          <Repeat className="w-3 h-3 ml-0.5 opacity-70" />
        </button>

        <div className="flex items-center gap-2">
          {/* Continuous Listening Toggle */}
          <button
            onClick={handleToggleContinuous}
            className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold border flex items-center gap-1 transition-all ${
              settings.continuousListening
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                : 'bg-white/5 text-slate-400 border-white/10'
            }`}
            title="Toggle Continuous Listening"
          >
            <Radio className={`w-3 h-3 ${settings.continuousListening ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>Continuous: {settings.continuousListening ? 'ON' : 'OFF'}</span>
          </button>

          {/* Minimize Button */}
          <button
            onClick={onMinimize}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
            title="Minimize to Floating Assistant"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Center Stage: Pulsating Holographic Neural Orb */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        {/* Background Radial Glow */}
        <div
          className={`absolute w-72 h-72 rounded-full blur-3xl opacity-35 transition-all duration-700 pointer-events-none ${
            settings.activeIdentity === 'female'
              ? 'bg-gradient-to-tr from-rose-500 via-fuchsia-600 to-purple-600'
              : 'bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600'
          } ${visualizerActive ? 'scale-125 opacity-55 animate-pulse' : 'scale-90'}`}
        ></div>

        {/* Neural Orb Core */}
        <div className="relative cursor-pointer" onClick={isListening ? stopListening : ensurePermissionAndStart}>
          {/* Outer Ripple Rings */}
          {visualizerActive && (
            <>
              <div
                className={`absolute -inset-4 rounded-full border border-white/20 animate-ping opacity-40`}
                style={{ animationDuration: '2.5s' }}
              ></div>
              <div
                className={`absolute -inset-8 rounded-full border ${
                  settings.activeIdentity === 'female' ? 'border-rose-400/30' : 'border-cyan-400/30'
                } animate-pulse`}
              ></div>
            </>
          )}

          {/* Orb Sphere */}
          <div
            className={`w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr ${
              currentIdentityConfig.avatarGradient
            } p-1 shadow-2xl ${currentIdentityConfig.shadowColor} flex items-center justify-center transition-all duration-500 ${
              isListening ? 'scale-105 ring-4 ring-emerald-400/50' : isSpeaking ? 'scale-110 ring-4 ring-white/50' : 'hover:scale-102'
            }`}
          >
            <div className="w-full h-full bg-[#0a0d17]/85 backdrop-blur-md rounded-full flex flex-col items-center justify-center relative overflow-hidden">
              {/* Inner Swirl */}
              <div
                className={`absolute inset-0 opacity-40 mix-blend-screen bg-gradient-to-br ${
                  settings.activeIdentity === 'female' ? 'from-rose-400 to-transparent' : 'from-cyan-400 to-transparent'
                } animate-spin`}
                style={{ animationDuration: visualizerActive ? '6s' : '18s' }}
              ></div>

              {/* Center Icon */}
              <div className="relative z-10 flex flex-col items-center">
                {isListening ? (
                  <Mic className="w-12 h-12 text-emerald-400 animate-bounce" />
                ) : isSpeaking ? (
                  <Volume2 className="w-12 h-12 text-white animate-pulse" />
                ) : isProcessing ? (
                  <Sparkles className="w-12 h-12 text-amber-400 animate-spin" />
                ) : (
                  <Mic className={`w-12 h-12 ${settings.activeIdentity === 'female' ? 'text-rose-400' : 'text-cyan-400'}`} />
                )}
                <span className="text-[11px] font-bold text-white/90 uppercase tracking-widest mt-1">
                  {currentIdentityConfig.name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Waveform Spectrum Bars */}
        <div className="flex items-center justify-center gap-1.5 h-10 mt-6 select-none">
          {[40, 75, 25, 90, 50, 100, 60, 85, 30, 95, 45, 80, 35].map((height, idx) => {
            const dynamicHeight = visualizerActive
              ? Math.max(12, Math.sin((idx + Date.now() / 200) * 0.7) * height)
              : 8;

            return (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-150 ${
                  settings.activeIdentity === 'female'
                    ? 'bg-gradient-to-t from-rose-500 to-fuchsia-400'
                    : 'bg-gradient-to-t from-cyan-500 to-blue-400'
                }`}
                style={{ height: `${dynamicHeight}px` }}
              ></div>
            );
          })}
        </div>

        {/* Status Message */}
        <div className="mt-3 text-center">
          <p className="text-xs font-semibold text-slate-200 tracking-wide">
            {statusMessage}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Personality: <strong className="text-slate-300">{currentPersonality.name}</strong> • ElevenLabs ID: <code className="text-cyan-300 font-mono text-[9px]">{settings.activeIdentity === 'female' ? settings.elevenLabsFemaleVoiceId.slice(0, 8) : settings.elevenLabsMaleVoiceId.slice(0, 8)}...</code>
          </p>
        </div>

        {/* Live Transcript Box */}
        {(transcript || sessionRef.current?.messages.slice(-1)[0]) && (
          <div className="w-full max-w-sm mt-4 p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 text-xs shadow-lg animate-fade-in">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
              <span>Live Transcript</span>
              <span className="text-emerald-400 font-mono text-[9px]">VOICE MODE ONLY</span>
            </div>
            <p className="text-slate-200 italic line-clamp-3">
              "{transcript || sessionRef.current?.messages.slice(-1)[0]?.text || ''}"
            </p>
          </div>
        )}

        {/* Error notification if mic blocked */}
        {errorNotice && (
          <div className="mt-3 p-2.5 bg-red-950/70 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2 max-w-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorNotice}</span>
          </div>
        )}
      </div>

      {/* Bottom Voice Controls Bar */}
      <div className="px-6 py-4 bg-[#0a0d16]/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-around z-20">
        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
          title="Cancel current speech and reset"
        >
          <Square className="w-3.5 h-3.5 text-red-400 fill-red-400" />
          <span>Cancel</span>
        </button>

        {/* Primary Mic Toggle */}
        <button
          onClick={isListening ? stopListening : ensurePermissionAndStart}
          className={`px-7 py-3 rounded-full font-black text-sm text-white shadow-xl flex items-center gap-2 transition-all transform active:scale-95 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 shadow-red-600/40 animate-pulse'
              : settings.activeIdentity === 'female'
              ? 'bg-gradient-to-r from-rose-500 to-purple-600 shadow-rose-600/30 hover:opacity-95'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-600/30 hover:opacity-95'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              <span>Stop Mic</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>Tap to Speak</span>
            </>
          )}
        </button>

        {/* Switch Identity Voice Command Helper hint */}
        <button
          onClick={handleManualSwitch}
          className="px-4 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
          title={`Switch to ${settings.activeIdentity === 'male' ? 'Female' : 'Male'} Zuzu`}
        >
          <Repeat className="w-3.5 h-3.5 text-cyan-400" />
          <span>Switch</span>
        </button>
      </div>

      {/* Android Microphone Permission Modal */}
      <MicrophonePermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onPermissionGranted={() => {
          setShowPermissionModal(false);
          startListening();
        }}
      />
    </div>
  );
};
