import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  Bot, 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { AppSettings, ChatMessage, VoiceIdentity } from '../types';
import { PERSONALITIES, VOICE_IDENTITIES } from '../constants/personalities';
import { getChatMessages, saveChatMessage, clearChatHistory } from '../utils/storage';
import { playHapticSound } from '../utils/audio';
import { generateIntelligentAnswer } from '../utils/aiEngine';

interface ChatViewProps {
  settings: AppSettings;
  onUpdateSettings?: (settings: Partial<AppSettings>) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ settings }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => getChatMessages());
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeIdentity = VOICE_IDENTITIES[settings.activeIdentity];
  const activePersonality = PERSONALITIES[settings.activePersonality] || PERSONALITIES.Normal;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if (!text || isLoading) return;

    playHapticSound('message_sent');

    // 1. Strictly create text-only user message
    const userMsg: ChatMessage = {
      id: `chat-usr-${Date.now()}`,
      conversation_type: 'text',
      sender: 'user',
      text,
      timestamp: Date.now(),
      voiceIdentity: settings.activeIdentity,
      personality: settings.activePersonality
    };

    // Save strictly to Chat History
    saveChatMessage(userMsg);
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // 2. Fetch AI response via backend proxy
      const conversationContext = [...messages, userMsg].map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: conversationContext,
          personality: settings.activePersonality,
          voiceIdentity: settings.activeIdentity,
          customPersonalityPrompt: settings.customPersonalityPrompt,
          customGeminiKey: settings.customGeminiApiKey,
          isVoiceMode: false // Explicitly text mode
        })
      });

      const data = await res.json();
      let replyText = data.reply;

      // If backend returned empty or greeting placeholder on a substantive question,
      // generate intelligent, context-specific answer
      if (!replyText || replyText.trim().length === 0) {
        replyText = generateIntelligentAnswer({
          userQuestion: text,
          conversationHistory: messages,
          personality: settings.activePersonality,
          voiceIdentity: settings.activeIdentity,
          customPersonalityPrompt: settings.customPersonalityPrompt,
          isVoiceMode: false
        });
      }

      // 3. Strictly create text-only assistant response
      const assistantMsg: ChatMessage = {
        id: `chat-ai-${Date.now()}`,
        conversation_type: 'text',
        sender: 'assistant',
        text: replyText.trim(),
        timestamp: Date.now(),
        voiceIdentity: settings.activeIdentity,
        personality: settings.activePersonality
      };

      saveChatMessage(assistantMsg);
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.warn('Text Chat Network fallback:', err);
      // Guarantee intelligent answer even if network drops
      const fallbackReply = generateIntelligentAnswer({
        userQuestion: text,
        conversationHistory: messages,
        personality: settings.activePersonality,
        voiceIdentity: settings.activeIdentity,
        customPersonalityPrompt: settings.customPersonalityPrompt,
        isVoiceMode: false
      });

      const fallbackMsg: ChatMessage = {
        id: `chat-ai-${Date.now()}`,
        conversation_type: 'text',
        sender: 'assistant',
        text: fallbackReply,
        timestamp: Date.now(),
        voiceIdentity: settings.activeIdentity,
        personality: settings.activePersonality
      };
      saveChatMessage(fallbackMsg);
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    clearChatHistory();
    setMessages([]);
    setShowClearConfirm(false);
    playHapticSound('listen_stop');
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#07090e] overflow-hidden relative">
      {/* Subheader: Mode & Isolation notice */}
      <div className="px-4 py-2 bg-[#0d111c] border-b border-white/5 flex items-center justify-between z-20">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded-md">
            Text Chat Mode
          </span>
          <span className="text-[11px] text-slate-400">
            Responding as <strong className="text-slate-200">{activeIdentity.name}</strong> ({activePersonality.name})
          </span>
        </div>

        {messages.length > 0 && (
          <button
            onClick={() => setShowClearConfirm(true)}
            title="Clear Chat History"
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Strict Isolation Banner */}
      <div className="bg-[#0b0f19] px-4 py-1.5 border-b border-white/5 flex items-center justify-between text-[10px] text-slate-400 select-none">
        <span className="flex items-center gap-1 text-emerald-400 font-medium">
          <ShieldCheck className="w-3 h-3" />
          Strict text isolation: Voice recordings are excluded from this section.
        </span>
        <span className="text-slate-400 font-mono">{messages.length} msgs</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 select-none">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-200 text-sm">No Typed Conversations Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
              Type a message below to begin chatting with {activeIdentity.name}. Only manually typed conversations are stored here.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const msgIdentity = VOICE_IDENTITIES[msg.voiceIdentity || 'male'];

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} group`}
              >
                {!isUser && (
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${msgIdentity.avatarGradient} p-0.5 flex-shrink-0 mt-0.5`}
                  >
                    <div className="w-full h-full bg-[#0a0d16] rounded-[6px] flex items-center justify-center">
                      <Sparkles
                        className={`w-3.5 h-3.5 ${
                          msg.voiceIdentity === 'female' ? 'text-rose-400' : 'text-cyan-400'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed relative ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-xs shadow-md shadow-blue-900/20'
                      : 'bg-[#111625] text-slate-200 border border-white/5 rounded-bl-xs shadow-md'
                  }`}
                >
                  {!isUser && (
                    <div className="text-[10px] font-semibold text-slate-400 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-300">
                        {msgIdentity.name}
                        <span className="text-[9px] px-1 rounded bg-white/10 font-mono">
                          {msg.personality || 'Normal'}
                        </span>
                      </span>
                      <button
                        onClick={() => handleCopyText(msg.id, msg.text)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-white transition-opacity ml-2"
                        title="Copy text"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap break-words">{msg.text}</div>

                  <div
                    className={`text-[9px] mt-1 font-mono flex items-center justify-end gap-1 ${
                      isUser ? 'text-blue-200/70' : 'text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })
        )}

        {isLoading && (
          <div className="flex gap-2.5 items-center">
            <div
              className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${activeIdentity.avatarGradient} p-0.5 flex-shrink-0 animate-pulse`}
            >
              <div className="w-full h-full bg-[#0a0d16] rounded-[6px] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            </div>
            <div className="bg-[#111625] border border-white/5 rounded-2xl rounded-bl-xs px-4 py-2.5 text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
              <span
                className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                style={{ animationDelay: '0.15s' }}
              ></span>
              <span
                className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"
                style={{ animationDelay: '0.3s' }}
              ></span>
              <span className="text-[11px] ml-1">{activeIdentity.name} is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Field Area */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-[#0a0d16] border-t border-white/10 flex items-center gap-2 select-none"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Type message to ${activeIdentity.name}...`}
          className="flex-1 bg-[#121624] text-slate-100 placeholder-slate-400 text-xs px-4 py-2.5 rounded-2xl border border-white/10 focus:outline-none focus:border-cyan-500 transition-colors"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className={`p-2.5 rounded-2xl text-white font-bold transition-all shadow-md ${
            inputText.trim() && !isLoading
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-95 shadow-cyan-600/30'
              : 'bg-white/10 text-slate-400 cursor-not-allowed'
          }`}
          title="Send Text Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Confirmation Dialog to Clear Text History */}
      {showClearConfirm && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0f1422] border border-white/10 rounded-3xl p-5 max-w-xs w-full text-center shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-white text-sm">Clear Text Chat History?</h4>
            <p className="text-xs text-slate-400 mt-1.5">
              This will permanently delete typed conversations. Your Voice History remains untouched.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-xs text-slate-300 font-semibold hover:bg-white/15"
              >
                Cancel
              </button>
              <button
                onClick={handleClearHistory}
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
