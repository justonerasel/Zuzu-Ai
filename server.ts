import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { generateIntelligentAnswer } from './src/utils/aiEngine.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Verified Premade System Voice IDs (Free-tier safe on ElevenLabs)
// Brian (deep, masculine, authoritative) & Sarah (warm, melodic, feminine)
const DEFAULT_MALE_VOICE_ID = process.env.ELEVENLABS_MALE_VOICE_ID || 'nPczCjzI2devNBz1zQrb'; // Brian (Premade)
const DEFAULT_FEMALE_VOICE_ID = process.env.ELEVENLABS_FEMALE_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Sarah (Premade)

const FALLBACK_PREMADE_MALE = 'nPczCjzI2devNBz1zQrb'; // Brian
const FALLBACK_PREMADE_FEMALE = 'EXAVITQu4vr4xnSDxMaL'; // Sarah

// Initialize GoogleGenAI with recommended aistudio-build User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Curated list of premade system voices that work on ElevenLabs Free Tier
const CURATED_PREMADE_VOICES = [
  { voice_id: 'nPczCjzI2devNBz1zQrb', name: 'Brian', gender: 'male', category: 'premade', description: 'Deep, crisp, authoritative male tone' },
  { voice_id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George', gender: 'male', category: 'premade', description: 'Warm British Baritone male' },
  { voice_id: 'CwhRBWXzGAHq8TQ4Fs17', name: 'Roger', gender: 'male', category: 'premade', description: 'Calm, casual male voice' },
  { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', gender: 'female', category: 'premade', description: 'Soft, melodic, expressive female tone' },
  { voice_id: '9BWtsMINqrJLrRacOk9x', name: 'Aria', gender: 'female', category: 'premade', description: 'Expressive, radiant female voice' },
  { voice_id: 'FGY2WhTYpPnrIDTdsKH5', name: 'Laura', gender: 'female', category: 'premade', description: 'Clear narrative female voice' }
];

// Endpoint: Configuration check (Voice IDs, API key availability)
app.get('/api/config', (req, res) => {
  res.json({
    appName: 'Zuzu AI',
    maleVoiceId: process.env.ELEVENLABS_MALE_VOICE_ID || DEFAULT_MALE_VOICE_ID,
    femaleVoiceId: process.env.ELEVENLABS_FEMALE_VOICE_ID || DEFAULT_FEMALE_VOICE_ID,
    hasElevenLabsKey: Boolean(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim().length > 0),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0),
    version: '3.2.0-android'
  });
});

// Endpoint: List ElevenLabs Voices (filtered for premade or account-accessible)
app.get('/api/elevenlabs/voices', async (req, res) => {
  const apiKey = (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim()) ||
                 (req.headers['x-custom-api-key'] as string);

  if (!apiKey) {
    return res.json({ voices: CURATED_PREMADE_VOICES, source: 'curated_premade' });
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices?category=premade', {
      headers: { 'xi-api-key': apiKey }
    });

    if (!response.ok) {
      return res.json({ voices: CURATED_PREMADE_VOICES, source: 'curated_fallback' });
    }

    const data = await response.json();
    const voices = Array.isArray(data.voices) && data.voices.length > 0
      ? data.voices.map((v: any) => ({
          voice_id: v.voice_id,
          name: v.name,
          category: v.category || 'premade',
          gender: v.labels?.gender || (v.name === 'Brian' || v.name === 'George' || v.name === 'Roger' ? 'male' : 'female'),
          description: v.labels?.description || v.labels?.accent || 'Natural tone'
        }))
      : CURATED_PREMADE_VOICES;

    res.json({ voices, source: 'elevenlabs_api' });
  } catch (err) {
    res.json({ voices: CURATED_PREMADE_VOICES, source: 'curated_fallback' });
  }
});

// Endpoint: Chat / Voice AI Response
app.post('/api/chat', async (req, res) => {
  try {
    const { 
      messages, 
      personality = 'Normal', 
      voiceIdentity = 'male', 
      language = 'auto', 
      customPersonalityPrompt = '',
      customGeminiKey = '',
      isVoiceMode = false
    } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const latestUserMsg = [...messages].reverse().find(m => m.sender === 'user')?.text || '';
    const identityName = voiceIdentity === 'female' ? 'Female Zuzu' : 'Male Zuzu';
    const pronoun = voiceIdentity === 'female' ? 'female (sister/companion/assistant)' : 'male (brother/companion/assistant)';

    const effectiveGeminiKey = (customGeminiKey && customGeminiKey.trim()) || 
                              (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());

    // If Gemini API Key is available, invoke Gemini 3.8 Flash model
    if (effectiveGeminiKey && effectiveGeminiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const clientAi = new GoogleGenAI({ apiKey: effectiveGeminiKey });

        let systemInstruction = `You are ${identityName}, an intelligent, highly expressive AI assistant running on Android.
Your gender identity is ${pronoun}.
Always remain in character as ${identityName}.
Your name is strictly Zuzu AI (formerly STONIC AI). Never call yourself STONIC AI unless explaining your rebranding to Zuzu AI.
Language capability: Fluent in Bengali (বাংলা) and English. If the user addresses you in Bengali, respond naturally in Bengali. If in English, respond in English. If code or technical question, provide clear, concise answers.
`;

        if (isVoiceMode) {
          systemInstruction += `\nVOICE MODE INSTRUCTION: This conversation is spoken aloud. Keep spoken answers concise, engaging, punchy, conversational, and avoid markdown asterisks, raw tables, or excessive formatting that sounds awkward when spoken.`;
        }

        const personalityInstructions: Record<string, string> = {
          Normal: 'Be helpful, balanced, polite, and direct.',
          Friendly: 'Be warm, enthusiastic, friendly, welcoming, like a close friend with upbeat positive energy.',
          Professional: 'Be formal, authoritative, structured, concise, and business-ready.',
          Funny: 'Be witty, sarcastic in a playful way, use smart humor, puns, and entertaining commentary.',
          Companion: 'Be deeply empathetic, caring, a great listener, supportive, thoughtful, and emotionally present.',
          'GF Mode': 'Be charming, sweet, playful, caring, affectionate, teasing nicely, and emotionally affectionate companion.',
          Teacher: 'Explain concepts step by step with clear analogies, encourage learning, and quiz gently when appropriate.',
          Developer: 'Be a high-tier software engineer: precise, technical, provide clean code snippets, analyze bugs rapidly, and explain architecture.',
          Hungry: 'Make frequent fun food metaphors, express a love for delicious cuisines, snacks, biryani, and food cravings while staying genuinely helpful.',
          Custom: customPersonalityPrompt || 'Act according to custom user directives.'
        };

        systemInstruction += `\nACTIVE PERSONALITY: ${personality}. ${personalityInstructions[personality] || ''}`;

        const contents = messages.map(m => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }));

        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API call timed out')), 5000)
        );

        const response: any = await Promise.race([
          clientAi.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: contents,
            config: {
              systemInstruction: {
                parts: [{ text: systemInstruction }]
              },
              temperature: 0.7,
            }
          }),
          timeoutPromise
        ]);

        if (response?.text && response.text.trim().length > 0) {
          return res.json({ 
            reply: response.text.trim(), 
            model: 'gemini-3.8-flash',
            isCloudAI: true 
          });
        }
      } catch (geminiError: any) {
        console.warn('[Zuzu AI] Cloud Gemini API error or timeout, engaging conversational engine:', geminiError?.message);
      }
    }

    // Dynamic Conversational Engine: generates rich, context-specific answers
    // to questions like "What is your name?", "Explain artificial intelligence", math, code, etc.
    const answer = generateIntelligentAnswer({
      userQuestion: latestUserMsg,
      conversationHistory: messages,
      personality,
      voiceIdentity,
      customPersonalityPrompt,
      isVoiceMode
    });

    res.json({
      reply: answer,
      model: 'zuzu-neural-engine',
      isCloudAI: false,
      hasGeminiKey: Boolean(effectiveGeminiKey && effectiveGeminiKey !== 'MY_GEMINI_API_KEY')
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    // Never send static greeting when answering!
    const fallbackAnswer = generateIntelligentAnswer({
      userQuestion: req.body?.messages?.slice(-1)[0]?.text || 'Hello',
      conversationHistory: req.body?.messages || [],
      personality: req.body?.personality || 'Normal',
      voiceIdentity: req.body?.voiceIdentity || 'male'
    });

    res.json({ 
      reply: fallbackAnswer,
      model: 'zuzu-neural-engine-safe',
      isCloudAI: false
    });
  }
});

// Helper function to call ElevenLabs TTS API
async function callElevenLabsTTS(
  text: string,
  voiceId: string,
  apiKey: string,
  stability: number,
  similarityBoost: number
): Promise<{ ok: boolean; status: number; buffer?: Buffer; errorText?: string }> {
  try {
    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text: text.slice(0, 1000),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: Number(stability),
          similarity_boost: Number(similarityBoost),
          style: 0.35,
          use_speaker_boost: true
        }
      })
    });

    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      return { ok: true, status: response.status, buffer: Buffer.from(arrayBuffer) };
    }

    const errorText = await response.text();
    return { ok: false, status: response.status, errorText };
  } catch (err: any) {
    return { ok: false, status: 500, errorText: err.message };
  }
}

// Endpoint: ElevenLabs TTS Proxy
// Protects the ElevenLabs API key on the backend & handles Free tier premade voice fallbacks gracefully
app.post('/api/tts', async (req, res) => {
  try {
    const { 
      text, 
      voiceIdentity = 'male', 
      customVoiceId, 
      customApiKey, 
      stability = 0.5, 
      similarityBoost = 0.75 
    } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required for TTS' });
    }

    // Determine API Key: backend secret takes priority, or user custom key from settings
    const apiKey = (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY.trim()) || 
                   (customApiKey && customApiKey.trim());

    // Determine voice ID
    let voiceId = customVoiceId;
    if (!voiceId) {
      if (voiceIdentity === 'female') {
        voiceId = process.env.ELEVENLABS_FEMALE_VOICE_ID || DEFAULT_FEMALE_VOICE_ID;
      } else {
        voiceId = process.env.ELEVENLABS_MALE_VOICE_ID || DEFAULT_MALE_VOICE_ID;
      }
    }

    // If no API key configured, inform client to use native Android Speech Synthesis fallback
    if (!apiKey) {
      return res.json({
        fallback: true,
        reason: 'no_api_key',
        message: 'Native Android high-definition speech synthesis active.',
        voiceIdentity,
        voiceId
      });
    }

    // First attempt with requested voice ID
    let result = await callElevenLabsTTS(text, voiceId, apiKey, stability, similarityBoost);

    // If ElevenLabs returns 402 "paid_plan_required" (e.g. Free users cannot use library voices)
    // Automatically retry with verified Free-tier Premade Voice IDs!
    if (!result.ok && result.status === 402) {
      const premadeFallbackId = voiceIdentity === 'female' ? FALLBACK_PREMADE_FEMALE : FALLBACK_PREMADE_MALE;
      
      if (voiceId !== premadeFallbackId) {
        // Retry with default free premade voice
        const retryResult = await callElevenLabsTTS(text, premadeFallbackId, apiKey, stability, similarityBoost);
        if (retryResult.ok && retryResult.buffer) {
          res.setHeader('Content-Type', 'audio/mpeg');
          res.setHeader('Cache-Control', 'public, max-age=3600');
          return res.send(retryResult.buffer);
        }
      }

      // If retry is also 402 (account credits exhausted), smoothly delegate to high-fidelity device speech
      return res.json({
        fallback: true,
        reason: 'quota_or_free_tier',
        message: 'ElevenLabs free tier quota or voice limit reached. Using calibrated Android high-definition speech synthesis.',
        voiceIdentity,
        voiceId
      });
    }

    if (result.ok && result.buffer) {
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      return res.send(result.buffer);
    }

    // If another non-ok status occurs, smoothly fall back to native speech
    return res.json({
      fallback: true,
      reason: 'tts_service_unavailable',
      message: 'Using calibrated Android speech synthesis.',
      voiceIdentity,
      voiceId
    });
  } catch (error: any) {
    return res.json({
      fallback: true,
      reason: 'exception',
      message: 'Using calibrated Android speech synthesis.'
    });
  }
});

// Setup Vite in Dev or Serve Static in Prod
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Zuzu AI Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
