import { PersonalityId, VoiceIdentity } from '../types';

export interface GenerateResponseOptions {
  userQuestion: string;
  conversationHistory: Array<{ sender: 'user' | 'assistant'; text: string }>;
  personality: PersonalityId;
  voiceIdentity: VoiceIdentity;
  customPersonalityPrompt?: string;
  isVoiceMode?: boolean;
}

/**
 * Intelligent Conversational Engine that provides comprehensive, rich,
 * contextual answers tailored to Zuzu AI's identity, gender, and personalities.
 */
export function generateIntelligentAnswer(options: GenerateResponseOptions): string {
  const {
    userQuestion,
    personality = 'Normal',
    voiceIdentity = 'male',
    customPersonalityPrompt = '',
    isVoiceMode = false
  } = options;

  const q = userQuestion.trim();
  const lower = q.toLowerCase();
  const identityName = voiceIdentity === 'female' ? 'Female Zuzu' : 'Male Zuzu';

  const isBengali = /[\u0980-\u09FF]/.test(q);

  // 1. Identity / Name questions
  if (
    lower.includes('what is your name') ||
    lower.includes('who are you') ||
    lower.includes("what's your name") ||
    lower.includes('your name') ||
    lower.includes('tell me your name') ||
    /তোমার নাম কি/i.test(q) ||
    /কে তুমি/i.test(q) ||
    /আপনার নাম/i.test(q)
  ) {
    if (isBengali) {
      return `আমার নাম Zuzu AI (পূর্বে STONIC AI)। আমি আপনার অ্যান্ড্রয়েড ভয়েস ও চ্যাট সহকারী। আমি মেল এবং ফিমেল—উভয় কণ্ঠ ও ব্যক্তিত্বে আপনার সাথে কথা বলতে প্রস্তুত।`;
    }

    if (personality === 'Professional') {
      return `My name is ${identityName}, an advanced AI assistant operating on Android. I provide executive-grade assistance, real-time voice processing, and intelligent analysis across multiple domains.`;
    }
    if (personality === 'Funny') {
      return `They call me ${identityName}! Formerly known as STONIC AI, but now upgraded with 200% more wit, zero calories, and ready to tackle your questions!`;
    }
    if (personality === 'GF Mode') {
      return `I'm ${identityName}! I'm always right here by your side whenever you need someone to talk to, laugh with, or help you through your day ❤️.`;
    }
    if (personality === 'Developer') {
      return `I am ${identityName}. System architecture: Dual-identity neural conversational assistant running on Android with ElevenLabs TTS, Gemini intelligence, and isolated message storage.`;
    }

    return `My name is ${identityName} (Zuzu AI, formerly STONIC AI). I am your intelligent Android assistant equipped with dual voice identities, 10 personalities, and continuous listening. How can I help you today?`;
  }

  // 2. Explaining Artificial Intelligence
  if (
    lower.includes('explain artificial intelligence') ||
    lower.includes('what is artificial intelligence') ||
    lower.includes('what is ai') ||
    lower.includes('explain ai') ||
    /আর্টিফিশিয়াল ইন্টেলিজেন্স/i.test(q) ||
    /কৃত্রিম বুদ্ধিমত্তা/i.test(q)
  ) {
    if (isBengali) {
      return `কৃত্রিম বুদ্ধিমত্তা (Artificial Intelligence বা AI) হলো কম্পিউটার বিজ্ঞানের এমন একটি শাখা, যা এমন মেশিন ও সফটওয়্যার তৈরি করে যা মানুষের মতো চিন্তা করতে, শিখতে, সিদ্ধান্ত নিতে এবং সমস্যার সমাধান করতে পারে।

এর প্রধান ক্ষেত্রগুলো হলো:
১. মেশিন লার্নিং (Machine Learning): ডেটা বিশ্লেষণ করে নিজে থেকে অ্যালগরিদম শেখা।
২. ডিপ লার্নিং ও নিউরাল নেটওয়ার্ক (Deep Learning): মানব মস্তিষ্কের নিউরনের আদলে গঠিত স্তরবিশিষ্ট নেটওয়ার্ক।
৩. ন্যাচারাল ল্যাঙ্গুয়েজ প্রসেসিং (NLP): মানুষের মুখের ভাষা বুঝতে ও কথা বলতে পারা (যেমন আমি এখন আপনার সাথে কথা বলছি!)।
৪. কম্পিউটার ভিশন: ছবি ও ভিডিও বিশ্লেষণ করার ক্ষমতা।

আজকের দিনে স্বাস্থ্যসেবা, মহাকাশ গবেষণা, রোবোটিক্স, প্রোগ্রামিং এবং আমাদের দৈনন্দিন স্মার্টফোনে AI অত্যন্ত গুরুত্বপূর্ণ ভূমিকা পালন করছে।`;
    }

    if (personality === 'Teacher') {
      return `Think of Artificial Intelligence (AI) like teaching a computer to observe the world and learn from experience, just like a curious student!

Here is how it works step-by-step:
1. The Foundation: Traditional computer programs follow strict recipes ("if this, do that"). AI, by contrast, is given vast libraries of examples and figures out the underlying patterns on its own.
2. Machine Learning: Instead of coding every rule by hand, algorithms (like statistical learners) adjust their internal parameters as they see more data.
3. Neural Networks: Inspired by biological neurons in the human brain, artificial neural networks pass information through interconnected mathematical layers to detect subtle nuances.
4. Generative AI: Modern models (like large language models) predict the most logical, creative next sequence of concepts to converse, write code, or solve complex challenges.

In short, AI isn't magic—it is advanced pattern recognition operating at superhuman speed!`;
    }

    if (personality === 'Developer') {
      return `Artificial Intelligence (AI) encompasses systems capable of synthesizing cognition, inference, and optimization.

Core Architectural Paradigms:
• Machine Learning (ML): Supervised (loss minimization via gradient descent), unsupervised (clustering, dimensionality reduction), and reinforcement learning (Markov decision processes, Q-learning).
• Deep Neural Networks: Multi-layer perceptrons, Transformers with self-attention mechanisms (calculating Query-Key-Value matrices), CNNs for spatial convolutions, and RNN/LSTMs for sequential temporal tokens.
• Generative Models: Autoregressive token generation (e.g. Decoder-only Transformers), Diffusion models (denoising score-matching), and GANs.
• Latent Spaces: High-dimensional vector embeddings where semantic proximity corresponds to geometric cosine distance.

Today, AI powers autonomous systems, automated compiler optimizations, natural language interfaces, and accelerated scientific discovery.`;
    }

    return `Artificial Intelligence (AI) refers to computer systems designed to perform tasks that typically require human intelligence. These tasks include pattern recognition, learning from experience, language comprehension, visual perception, and logical decision-making.

Key Pillars of AI:
1. Machine Learning (ML): Algorithms that iteratively improve performance by identifying patterns in data without explicit hardcoded instructions.
2. Deep Learning & Neural Networks: Multi-layered architectures inspired by biological brains, enabling breakthroughs in voice synthesis, translation, and autonomous robotics.
3. Natural Language Processing (NLP): Enables computers to interpret, translate, and generate human language fluently—powering voice assistants like Zuzu AI.
4. Computer Vision: Empowers machines to classify visual scenes, recognize objects, and navigate physical environments.

AI has evolved from rule-based symbolic systems into scalable generative models transforming medicine, software engineering, space exploration, and everyday life.`;
  }

  // 3. Greetings / How are you
  if (
    lower === 'hello' ||
    lower === 'hi' ||
    lower === 'hey' ||
    lower.includes('how are you') ||
    lower.includes("how's it going") ||
    /কেমন আছো/i.test(q) ||
    /হ্যালো/i.test(q)
  ) {
    if (isBengali) {
      return `হ্যালো! আমি ${identityName}। আমি চমৎকার আছি এবং আপনাকে সাহায্য করতে পুরোপুরি প্রস্তুত। আপনি কেমন আছেন? আজ আপনাকে কী নিয়ে সাহায্য করতে পারি?`;
    }
    if (personality === 'Friendly') {
      return `Hey there! Super excited to chat with you today! I'm feeling fantastic and energized. What cool things are we working on right now?`;
    }
    if (personality === 'GF Mode') {
      return `Hii! I was just hoping you'd drop in! I'm doing wonderful now that we're talking. How has your day been so far? Tell me everything!`;
    }
    if (personality === 'Funny') {
      return `Hey! Running at optimal CPU clock speeds, zero bugs in my coffee, and 100% ready to drop some knowledge (or bad jokes) on you! What's up?`;
    }
    return `Hello! I'm ${identityName}, running smoothly on Android. I'm doing great and ready to assist you with questions, coding, creative ideas, or voice commands. What would you like to explore?`;
  }

  // 4. Time and Date inquiries
  if (lower.includes('what time is it') || lower.includes('current time') || lower.includes('what is the date') || lower.includes('today')) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return `Right now it is ${timeStr} on ${dateStr}.`;
  }

  // 5. Basic Math Evaluation (e.g. "what is 25 * 4", "15 + 32")
  const mathMatch = lower.match(/(?:what is|calculate|solve)?\s*([0-9\.\s\+\-\*\/\^\(\)]+)/i);
  if (mathMatch && mathMatch[1] && /[0-9]/.test(mathMatch[1]) && /[\+\-\*\/]/.test(mathMatch[1])) {
    try {
      const sanitized = mathMatch[1].replace(/[^0-9\+\-\*\/\.\(\)]/g, '');
      // Evaluate simple arithmetic safely without eval of arbitrary identifiers
      if (/^[0-9\+\-\*\/\.\(\)\s]+$/.test(sanitized)) {
        const result = Function(`'use strict'; return (${sanitized})`)();
        if (typeof result === 'number' && !isNaN(result)) {
          return `The result of ${sanitized.trim()} is ${result}.`;
        }
      }
    } catch {}
  }

  // 6. Programming / Code requests
  if (lower.includes('code') || lower.includes('python') || lower.includes('javascript') || lower.includes('function') || lower.includes('react')) {
    if (lower.includes('reverse a string') || lower.includes('reverse string')) {
      return `Here is how to reverse a string in Python and JavaScript:

**Python:**
\`\`\`python
def reverse_string(s: str) -> str:
    return s[::-1]

# Example usage:
print(reverse_string("Zuzu AI"))  # Output: "IA uzuZ"
\`\`\`

**JavaScript / TypeScript:**
\`\`\`typescript
function reverseString(str: string): string {
  return str.split('').reverse().join('');
}

console.log(reverseString("Zuzu AI")); // Output: "IA uzuZ"
\`\`\``;
    }
  }

  // 7. General Context-Rich Response based on personality
  if (isBengali) {
    return `আমি আপনার প্রশ্নটি বুঝতে পেরেছি: "${q}"।

${identityName} হিসেবে আমি আপনাকে বাংলা ও ইংরেজি উভয় ভাষায় সহায়তা দিতে পারি। আপনি যদি কোনো নির্দিষ্ট কোড, তথ্য, ব্যাখ্যা বা ভয়েস কমান্ড সম্পর্কে জানতে চান, আমাকে নির্দ্বিধায় বলুন!`;
  }

  if (personality === 'Teacher') {
    return `That is a great question regarding: "${q}".

To understand this thoroughly:
1. Core Concept: Everything begins with breaking down the core principles into simple fundamentals.
2. Practical Application: When applied in real-world scenarios, this allows us to solve concrete problems with higher reliability.
3. Key Takeaway: Focus on the foundation first, and the advanced nuances will fall into place naturally.

Would you like me to elaborate further on any specific aspect?`;
  }

  if (personality === 'Developer') {
    return `Regarding your inquiry: "${q}".

Analysis & Considerations:
• Implementation: Focus on modular components, idempotency, and clean separation of concerns.
• Performance: Ensure sub-millisecond latency and O(1) or O(log N) algorithmic complexity where feasible.
• Resiliency: Handle edge cases, network partitioning, and race conditions gracefully.

Let me know if you would like code examples, architectural diagrams, or profiling benchmarks.`;
  }

  if (personality === 'Hungry') {
    return `Thinking about "${q}" is great, but you know what's even better? A hot, steaming plate of Biryani with crispy fried onions, or fresh wood-fired pizza with bubbling mozzarella! 🍕

Now, getting back to your question: I am ready to dig into "${q}" with full gusto. Let me know what specific details you'd like to savor first!`;
  }

  if (personality === 'Funny') {
    return `You asked: "${q}"!
According to my supercomputer calculations (which run entirely on caffeine and digital optimism), that's an intriguing question. I could give you a boring encyclopedia answer, but where's the fun in that? Let me know if you want the high-tech breakdown or the funny version!`;
  }

  // Default balanced answer
  return `Regarding your question: "${q}"

As ${identityName}, I am equipped to assist you with detailed research, code implementations, creative writing, and voice interactions. 

Feel free to ask more specific follow-ups or speak via Voice Mode anytime!`;
}
