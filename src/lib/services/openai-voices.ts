// OpenAI TTS Voice configurations
export interface OpenAIVoice {
  id: string;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
  style: string;
  preview?: string;
}

export const OPENAI_VOICES: Record<string, OpenAIVoice> = {
  alloy: {
    id: 'alloy',
    name: 'Alloy',
    description: 'Neutral, balanced voice',
    gender: 'neutral',
    style: 'Professional and clear'
  },
  ash: {
    id: 'ash',
    name: 'Ash',
    description: 'Warm, engaging voice',
    gender: 'male',
    style: 'Friendly and approachable'
  },
  ballad: {
    id: 'ballad',
    name: 'Ballad',
    description: 'Smooth, storytelling voice',
    gender: 'female',
    style: 'Narrative and expressive'
  },
  coral: {
    id: 'coral',
    name: 'Coral',
    description: 'Bright, energetic voice',
    gender: 'female',
    style: 'Upbeat and cheerful'
  },
  echo: {
    id: 'echo',
    name: 'Echo',
    description: 'Deep, resonant voice',
    gender: 'male',
    style: 'Authoritative and confident'
  },
  fable: {
    id: 'fable',
    name: 'Fable',
    description: 'Wise, thoughtful voice',
    gender: 'male',
    style: 'Contemplative and measured'
  },
  nova: {
    id: 'nova',
    name: 'Nova',
    description: 'Dynamic, modern voice',
    gender: 'female',
    style: 'Contemporary and vibrant'
  },
  onyx: {
    id: 'onyx',
    name: 'Onyx',
    description: 'Strong, commanding voice',
    gender: 'male',
    style: 'Bold and decisive'
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    description: 'Calm, knowledgeable voice',
    gender: 'female',
    style: 'Wise and reassuring'
  },
  shimmer: {
    id: 'shimmer',
    name: 'Shimmer',
    description: 'Light, melodic voice',
    gender: 'female',
    style: 'Gentle and soothing'
  }
};

export const DEFAULT_VOICE = 'alloy';

export function getVoiceById(voiceId: string): OpenAIVoice {
  return OPENAI_VOICES[voiceId] || OPENAI_VOICES[DEFAULT_VOICE];
}

export function getVoicesByGender(gender: 'male' | 'female' | 'neutral'): OpenAIVoice[] {
  return Object.values(OPENAI_VOICES).filter(voice => voice.gender === gender);
}

export function getAllVoices(): OpenAIVoice[] {
  return Object.values(OPENAI_VOICES);
}

// Default voice assignments for agent personas
export const DEFAULT_AGENT_VOICES: Record<string, string> = {
  bull: 'coral',      // Bright, energetic for optimistic analysis
  bear: 'onyx',       // Strong, commanding for cautious analysis
  skeptic: 'echo',    // Deep, resonant for questioning tone
  balanced: 'alloy',  // Neutral, balanced for objective analysis
  technical: 'sage',  // Calm, knowledgeable for data-driven analysis
  macro: 'fable',     // Wise, thoughtful for strategic thinking
  risk: 'ash',        // Warm but serious for risk assessment
  growth: 'nova',     // Dynamic, modern for growth opportunities
  value: 'shimmer',   // Gentle, soothing for patient value investing
  contrarian: 'ballad' // Smooth, storytelling for contrarian views
};

export function getDefaultVoiceForAgent(agentId: string): string {
  return DEFAULT_AGENT_VOICES[agentId] || DEFAULT_VOICE;
}
