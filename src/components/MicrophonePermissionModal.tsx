import React, { useState } from 'react';
import { 
  Mic, 
  ShieldAlert, 
  ShieldCheck, 
  Settings, 
  ExternalLink, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Lock
} from 'lucide-react';
import { requestMicrophonePermission, openAndroidAppSettingsGuide, MicrophonePermissionState } from '../utils/permission';
import { playHapticSound } from '../utils/audio';

interface MicrophonePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
  initialState?: MicrophonePermissionState;
}

export const MicrophonePermissionModal: React.FC<MicrophonePermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
  initialState = 'prompt'
}) => {
  const [status, setStatus] = useState<MicrophonePermissionState>(initialState);
  const [isRequesting, setIsRequesting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSettingsGuide, setShowSettingsGuide] = useState(false);

  if (!isOpen) return null;

  const handleGrantPermission = async () => {
    setIsRequesting(true);
    setErrorMessage(null);
    playHapticSound('message_sent');

    try {
      const result = await requestMicrophonePermission();

      if (result.success && result.state === 'granted') {
        setStatus('granted');
        playHapticSound('listen_start');
        setTimeout(() => {
          onPermissionGranted();
        }, 500);
      } else {
        setStatus('denied');
        setErrorMessage(
          result.error ||
            'Microphone access was denied. Zuzu AI needs microphone permission to hear your voice commands.'
        );
        playHapticSound('listen_stop');
      }
    } catch (err: any) {
      setStatus('denied');
      setErrorMessage(err?.message || 'Failed to request microphone permission.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOpenSettings = () => {
    openAndroidAppSettingsGuide();
    setShowSettingsGuide(true);
    playHapticSound('message_sent');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none animate-fade-in">
      <div className="bg-gradient-to-b from-[#101424] to-[#0a0d16] border border-cyan-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
        {/* Glow Orb */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-16 h-16 rounded-2xl p-1 mb-4 flex items-center justify-center shadow-lg transition-all ${
              status === 'granted'
                ? 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-emerald-500/30'
                : status === 'denied'
                ? 'bg-gradient-to-br from-red-500 to-rose-700 shadow-red-500/30'
                : 'bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 shadow-cyan-500/30 animate-pulse'
            }`}
          >
            <div className="w-full h-full bg-[#0a0d17] rounded-xl flex items-center justify-center">
              {status === 'granted' ? (
                <ShieldCheck className="w-8 h-8 text-emerald-400" />
              ) : status === 'denied' ? (
                <ShieldAlert className="w-8 h-8 text-red-400" />
              ) : (
                <Mic className="w-8 h-8 text-cyan-400" />
              )}
            </div>
          </div>

          <span className="text-[10px] font-bold tracking-widest text-cyan-400 uppercase bg-cyan-950/70 border border-cyan-800/40 px-2.5 py-0.5 rounded-full mb-1.5 flex items-center gap-1">
            <Lock className="w-2.5 h-2.5" /> Android Runtime Permission
          </span>

          <h3 className="text-lg font-black text-white tracking-tight">
            {status === 'granted'
              ? 'Microphone Permission Granted'
              : status === 'denied'
              ? 'Microphone Access Denied'
              : 'Microphone Permission Required'}
          </h3>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {status === 'granted'
              ? 'Permission verified. You are ready to start voice conversations with Zuzu AI.'
              : status === 'denied'
              ? 'Android microphone permission is blocked. Zuzu AI cannot capture your voice commands until permission is granted.'
              : 'Zuzu AI Voice Assistant requires runtime microphone access to hear your questions, enable continuous listening, and switch between Male & Female identities.'}
          </p>
        </div>

        {/* Permission Feature Highlights */}
        {status !== 'granted' && (
          <div className="mt-4 p-3.5 bg-black/40 border border-white/5 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Real-time voice conversation in English & Bengali</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Voice commands ("Switch to Female Zuzu")</span>
            </div>
            <div className="flex items-center gap-2 text-slate-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Strictly isolated Voice History storage</span>
            </div>
          </div>
        )}

        {/* Error / Denied Warning */}
        {errorMessage && (
          <div className="mt-3 p-2.5 bg-red-950/50 border border-red-800/60 rounded-xl text-red-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-[11px] leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Android Settings Step-by-Step Guide */}
        {showSettingsGuide && (
          <div className="mt-3 p-3 bg-amber-950/40 border border-amber-800/40 rounded-xl text-amber-200 text-xs space-y-1 animate-fade-in">
            <div className="font-bold text-[11px] uppercase tracking-wider text-amber-300">
              How to enable on Android:
            </div>
            <ol className="list-decimal list-inside text-[10px] space-y-0.5 text-amber-100">
              <li>Tap the <strong>Lock / Settings icon</strong> in your browser bar.</li>
              <li>Tap <strong>Permissions</strong> &gt; <strong>Microphone</strong>.</li>
              <li>Select <strong>Allow</strong>, then return here and tap Grant.</li>
            </ol>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 space-y-2">
          {status === 'granted' ? (
            <button
              onClick={onPermissionGranted}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            >
              <Mic className="w-4 h-4" />
              <span>Continue to Voice Mode</span>
            </button>
          ) : (
            <>
              {/* Primary: Grant Microphone Permission button */}
              <button
                onClick={handleGrantPermission}
                disabled={isRequesting}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-xs tracking-wide shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isRequesting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Requesting Android Permission...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Grant Microphone Permission</span>
                  </>
                )}
              </button>

              {/* Secondary if denied: Open App Settings */}
              {status === 'denied' && (
                <button
                  onClick={handleOpenSettings}
                  className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-200 font-semibold text-xs border border-white/10 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                >
                  <Settings className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Open App Settings</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-full py-2 text-slate-400 hover:text-slate-200 text-xs font-medium text-center transition-colors"
              >
                Not Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
