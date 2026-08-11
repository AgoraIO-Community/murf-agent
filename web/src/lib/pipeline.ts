export const VOICE_PIPELINE = Object.freeze({
  name: 'Murf Voice Agent',
  provider: 'Murf',
  title: 'Real-time Voice Agent',
  eyebrow: 'Developer showcase',
  accent: 'Murf voice synthesis, orchestrated by Agora',
  description: 'Sarvam recognizes Indian English and Murf FALCON synthesizes the Matthew voice.',
  stt: 'Sarvam STT (en-IN)',
  llm: 'OpenAI GPT-4o mini',
  tts: 'Murf Matthew (FALCON)',
} as const)
