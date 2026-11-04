export type VoiceIdentity = 'male' | 'female';

export type PersonalityId =
  | 'Normal'
  | 'Friendly'
  | 'Professional'
  | 'Funny'
  | 'Companion'
  | 'GF Mode'
  | 'Teacher'
  | 'Developer'
  | 'Hungry'
  | 'Custom';

export interface Personality {
  id: PersonalityId;
  name: string;
  description: string;
  emoji: string;
  prompt: string;
  accentColor: string;
  glowColor: string;
}

export type ConversationType = 'text' | 'voice';

// Strict separation: Text Chat message
export interface ChatMessage {
  id: string;
  conversation_type: 'text';
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  voiceIdentity: VoiceIdentity;
  personality: PersonalityId;
}

// Strict separation: Voice Conversation message
export interface VoiceMessage {
  id: string;
  conversation_type: 'voice';
  sessionId: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
  voiceIdentity: VoiceIdentity;
  audioDuration?: number;
  isSwitchCommand?: boolean;
}

// Strict separation: Voice Session Container
export interface VoiceSession {
  id: string;
  conversation_type: 'voice';
  title: string;
  startTime: number;
  endTime?: number;
  voiceIdentity: VoiceIdentity;
  personality: PersonalityId;
  messages: VoiceMessage[];
}

export interface AppSettings {
  activeIdentity: VoiceIdentity;
  activePersonality: PersonalityId;
  customPersonalityPrompt: string;
  continuousListening: boolean;
  elevenLabsMaleVoiceId: string;
  elevenLabsFemaleVoiceId: string;
  customElevenLabsApiKey: string;
  customGeminiApiKey: string;
  aiModel: string;
  stability: number;
  similarityBoost: number;
  speechRate: number;
  soundEffects: boolean;
  recognitionLanguage: 'auto' | 'en-US' | 'bn-BD';
  viewMode: 'android_frame' | 'fullscreen';
}

export type ActiveTab = 'dashboard' | 'chat' | 'voice' | 'history' | 'settings';
