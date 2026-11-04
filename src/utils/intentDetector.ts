import { VoiceIdentity } from '../types';

export interface SwitchIntentResult {
  isSwitchCommand: boolean;
  targetIdentity?: VoiceIdentity;
  detectedLanguage: 'en' | 'bn';
  confirmationSpoken: string;
  isAmbiguous?: boolean;
  ambiguousQuestion?: string;
}

export function detectVoiceSwitchIntent(
  rawTranscript: string,
  currentIdentity: VoiceIdentity
): SwitchIntentResult {
  if (!rawTranscript || typeof rawTranscript !== 'string') {
    return {
      isSwitchCommand: false,
      detectedLanguage: 'en',
      confirmationSpoken: ''
    };
  }

  const text = rawTranscript.trim().toLowerCase();

  // Detect Bengali characters
  const isBengali = /[\u0980-\u09FF]/.test(rawTranscript);
  const detectedLang: 'en' | 'bn' = isBengali ? 'bn' : 'en';

  // 1. Female Switch Triggers (Bengali & English, supporting Zuzu & Stonic)
  const femalePatterns = [
    // Direct commands
    /convert to female/i,
    /switch to female/i,
    /change to female/i,
    /turn into female/i,
    /become female/i,
    /make voice female/i,
    /female voice/i,
    /female zuzu/i,
    /female stonic/i,
    // Targeted commands
    /male\s+(zuzu|stonic)?.*(?:convert|switch|change|turn).*female/i,
    /(?:convert|switch|change|turn).*(?:female\s+)?(zuzu|stonic)/i,
    /want you to be(?:come)? female/i,
    /be(?:come)? a female/i,
    // Bengali variations
    /female\s*(?:zuzu|stonic)?\s*(?:হয়ে|হয়ে)\s*যাও/i,
    /female\s*(?:zuzu|stonic)?\s*(?:হয়ে|হয়ে)\s*যেতে/i,
    /আমি চাই তুমি\s*female\s*(?:zuzu|stonic)?\s*(?:হয়ে|হয়ে)\s*যাও/i,
    /আমি চাই তুমি ফিমেল\s*(?:জুজু|স্টনিক)?\s*(?:হয়ে|হয়ে)\s*যাও/i,
    /ফিমেল\s*(?:জুজু|স্টনিক)?\s*(?:হয়ে|হয়ে)\s*যাও/i,
    /ফিমেল\s*ভয়েস/i,
    /ফিমেল\s*ভয়েস/i,
    /ফিমেল\s*কণ্ঠ/i,
    /মেয়ে\s*কণ্ঠ/i,
    /মেয়ের\s*কণ্ঠে\s*কথা\s*বলো/i,
    /মেয়ে\s*কণ্ঠে\s*কথা\s*বলো/i,
    /ফিমেল\s*এ\s*সুইচ\s*করো/i,
    /ফিমেল\s*হও/i
  ];

  // 2. Male Switch Triggers (Bengali & English, supporting Zuzu & Stonic)
  const malePatterns = [
    // Direct commands
    /convert to male/i,
    /switch to male/i,
    /change to male/i,
    /turn into male/i,
    /become male/i,
    /make voice male/i,
    /male voice/i,
    /male zuzu/i,
    /male stonic/i,
    // Targeted commands
    /female\s+(zuzu|stonic)?.*(?:convert|switch|change|turn).*male/i,
    /(?:convert|switch|change|turn).*(?:male\s+)?(zuzu|stonic)/i,
    /want you to be(?:come)? male/i,
    /be(?:come)? a male/i,
    // Bengali variations
    /male\s*(?:zuzu|stonic)?\s*(?:হয়ে|হয়ে)\s*যাও/i,
    /male\s*(?:zuzu|stonic)?\s*(?:হয়ে|হয়ে)\s*যেতে/i,
    /আমি চাই তুমি\s*male\s*(?:zuzu|stonic)?\s*(?:হয়ে|হয়ে)\s*যাও/i,
    /আমি চাই তুমি মেল\s*(?:জুজু|স্টনিক)?\s*(?:হয়ে|হয়ে)\s*যাও/i,
    /মেল\s*(?:জুজু|স্টনিক)?\s*(?:হয়ে|হয়ে)\s*যাও/i,
    /মেল\s*ভয়েস/i,
    /মেল\s*ভয়েস/i,
    /মেল\s*কণ্ঠ/i,
    /ছেলে\s*কণ্ঠ/i,
    /ছেলের\s*কণ্ঠে\s*কথা\s*বলো/i,
    /ছেলে\s*কণ্ঠে\s*কথা\s*বলো/i,
    /মেল\s*এ\s*সুইচ\s*করো/i,
    /মেল\s*হও/i
  ];

  // Ambiguity check: phrases like "what is female zuzu?" or "who is male stonic?"
  const isQuestionAboutIdentity = 
    /(what is|who is|tell me about|explain)\s+(male|female)\s+(zuzu|stonic)/i.test(text) ||
    /(মেল|ফিমেল)\s+(জুজু|স্টনিক)\s*(কী|কি|কে)/i.test(text);

  if (isQuestionAboutIdentity) {
    return {
      isSwitchCommand: false,
      detectedLanguage: detectedLang,
      confirmationSpoken: ''
    };
  }

  // Check Female Match
  const wantsFemale = femalePatterns.some(pattern => pattern.test(text));
  // Check Male Match
  const wantsMale = malePatterns.some(pattern => pattern.test(text));

  // If both match or unclear
  if (wantsFemale && wantsMale) {
    return {
      isSwitchCommand: false,
      isAmbiguous: true,
      detectedLanguage: detectedLang,
      confirmationSpoken: '',
      ambiguousQuestion: detectedLang === 'bn' 
        ? "আপনি কি মেল নাকি ফিমেল জুজুতে পরিবর্তন করতে চান? অনুগ্রহ করে স্পষ্ট করে বলুন।"
        : "Did you want to switch to Male Zuzu or Female Zuzu? Please specify."
    };
  }

  if (wantsFemale) {
    if (currentIdentity === 'female') {
      return {
        isSwitchCommand: false,
        detectedLanguage: detectedLang,
        confirmationSpoken: detectedLang === 'bn'
          ? "আমি ইতিমধ্যেই ফিমেল জুজু হিসেবে সক্রিয় আছি।"
          : "I am already operating as Female Zuzu!"
      };
    }

    const confirmation = detectedLang === 'bn'
      ? "অবশ্যই! আমি এখন ফিমেল জুজু হয়ে গেলাম। আপনার কি সেবা করতে পারি বলুন?"
      : "Switching to Female Zuzu. I am now your female assistant, ready to help you!";

    return {
      isSwitchCommand: true,
      targetIdentity: 'female',
      detectedLanguage: detectedLang,
      confirmationSpoken: confirmation
    };
  }

  if (wantsMale) {
    if (currentIdentity === 'male') {
      return {
        isSwitchCommand: false,
        detectedLanguage: detectedLang,
        confirmationSpoken: detectedLang === 'bn'
          ? "আমি ইতিমধ্যেই মেল জুজু হিসেবে সক্রিয় আছি।"
          : "I am already operating as Male Zuzu!"
      };
    }

    const confirmation = detectedLang === 'bn'
      ? "অবশ্যই! আমি এখন মেল জুজু হয়ে গেলাম। বলুন কীভাবে সাহায্য করব?"
      : "Switching to Male Zuzu. I am now your male assistant, ready to assist you!";

    return {
      isSwitchCommand: true,
      targetIdentity: 'male',
      detectedLanguage: detectedLang,
      confirmationSpoken: confirmation
    };
  }

  // Check for vague switch intent: e.g. "change your voice" or "switch identity"
  const isVagueSwitch = /(change your voice|switch voice|switch identity|change identity|ভয়েস পরিবর্তন করো|ভয়েস চেঞ্জ করো)/i.test(text);
  if (isVagueSwitch) {
    const nextTarget = currentIdentity === 'male' ? 'Female Zuzu' : 'Male Zuzu';
    const nextTargetBn = currentIdentity === 'male' ? 'ফিমেল জুজু' : 'মেল জুজু';
    return {
      isSwitchCommand: false,
      isAmbiguous: true,
      detectedLanguage: detectedLang,
      confirmationSpoken: '',
      ambiguousQuestion: detectedLang === 'bn'
        ? `আপনি কি ${nextTargetBn}-তে পরিবর্তন করতে চান? 'হ্যাঁ' বলুন বা বলুন 'সুইচ টু ${nextTargetBn}'।`
        : `Would you like to switch to ${nextTarget}? You can say 'Switch to ${nextTarget}'.`
    };
  }

  return {
    isSwitchCommand: false,
    detectedLanguage: detectedLang,
    confirmationSpoken: ''
  };
}
