import { VoiceIdentity } from '../types';

let currentAudio: HTMLAudioElement | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;

// Audio context for sound effects and analysis
let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Android assistant sound effects
export function playHapticSound(type: 'switch' | 'listen_start' | 'listen_stop' | 'message_sent'): void {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'switch') {
      // Pleasant futuristic dual-tone chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'listen_start') {
      // Android Assistant activation chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'listen_stop') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'message_sent') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    }

    // Android vibration API
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (type === 'switch') navigator.vibrate([30, 50, 40]);
      else navigator.vibrate(25);
    }
  } catch (err) {
    // Non-fatal if audio context not permitted
  }
}

export interface SpeakOptions {
  text: string;
  voiceIdentity: VoiceIdentity;
  customVoiceId?: string;
  customApiKey?: string;
  stability?: number;
  similarityBoost?: number;
  speechRate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

export function stopSpeaking(): void {
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    } catch {}
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      currentUtterance = null;
    } catch {}
  }
}

// Speak via ElevenLabs backend TTS or high-fidelity Web Speech fallback
export async function speakText(options: SpeakOptions): Promise<void> {
  const {
    text,
    voiceIdentity,
    customVoiceId,
    customApiKey,
    stability = 0.5,
    similarityBoost = 0.75,
    speechRate = 1.0,
    onStart,
    onEnd,
    onError
  } = options;

  stopSpeaking();

  try {
    // Step 1: Attempt ElevenLabs TTS via secure backend proxy
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        voiceIdentity,
        customVoiceId,
        customApiKey,
        stability,
        similarityBoost
      })
    });

    const contentType = response.headers.get('content-type') || '';

    // If binary audio returned from ElevenLabs
    if (contentType.includes('audio/mpeg') || contentType.includes('audio/')) {
      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      currentAudio = audio;

      audio.playbackRate = speechRate;
      audio.onplay = () => onStart?.();
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        onEnd?.();
      };
      audio.onerror = (e) => {
        console.warn('ElevenLabs audio playback failed, falling back to browser speech:', e);
        URL.revokeObjectURL(audioUrl);
        currentAudio = null;
        speakWithBrowserSpeech({ text, voiceIdentity, speechRate, onStart, onEnd, onError });
      };

      await audio.play();
      return;
    }

    // If fallback JSON returned (e.g., no ElevenLabs key configured)
    const json = await response.json();
    console.log('[Zuzu Audio] TTS server response:', json.message || json);
    speakWithBrowserSpeech({ text, voiceIdentity, speechRate, onStart, onEnd, onError });
  } catch (err) {
    console.warn('[Zuzu Audio] Network or TTS fetch error. Using browser speech synthesis:', err);
    speakWithBrowserSpeech({ text, voiceIdentity, speechRate, onStart, onEnd, onError });
  }
}

// High-fidelity Browser Speech Synthesis calibrated for Male & Female Zuzu
function speakWithBrowserSpeech({
  text,
  voiceIdentity,
  speechRate = 1.0,
  onStart,
  onEnd,
  onError
}: {
  text: string;
  voiceIdentity: VoiceIdentity;
  speechRate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onError?.(new Error('SpeechSynthesis not supported on this device.'));
    return;
  }

  window.speechSynthesis.cancel();

  // Strip excessive markdown formatting before speaking
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_#~]/g, '')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  currentUtterance = utterance;

  const isBengali = /[\u0980-\u09FF]/.test(cleanText);
  const voices = window.speechSynthesis.getVoices();

  // Male Zuzu parameters
  if (voiceIdentity === 'male') {
    utterance.pitch = 0.85; // Deeper, authoritative resonance
    utterance.rate = speechRate * 0.98;

    if (isBengali) {
      const bnVoice = voices.find(v => v.lang.startsWith('bn') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Natural')));
      if (bnVoice) utterance.voice = bnVoice;
      utterance.lang = 'bn-BD';
    } else {
      const maleVoice = voices.find(v => 
        (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Guy') || v.name.includes('George') || v.name.includes('Daniel') || v.name.includes('Natural')) &&
        (v.lang.startsWith('en'))
      ) || voices.find(v => v.lang.startsWith('en'));
      if (maleVoice) utterance.voice = maleVoice;
    }
  } 
  // Female Zuzu parameters
  else {
    utterance.pitch = 1.22; // Luminous, warm, melodic tone
    utterance.rate = speechRate * 1.02;

    if (isBengali) {
      const bnVoice = voices.find(v => v.lang.startsWith('bn') && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Natural')));
      if (bnVoice) utterance.voice = bnVoice;
      utterance.lang = 'bn-BD';
    } else {
      const femaleVoice = voices.find(v => 
        (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('Victoria') || v.name.includes('Google US English')) &&
        (v.lang.startsWith('en'))
      ) || voices.find(v => v.lang.startsWith('en'));
      if (femaleVoice) utterance.voice = femaleVoice;
    }
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };
  utterance.onerror = (e) => {
    currentUtterance = null;
    onError?.(e);
  };

  window.speechSynthesis.speak(utterance);
}
