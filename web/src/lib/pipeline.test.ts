import { expect, test } from 'bun:test'

import { VOICE_PIPELINE } from './pipeline'

test('fixed pipeline is immutable and describes each stage accurately', () => {
  expect(Object.isFrozen(VOICE_PIPELINE)).toBe(true)
  expect(VOICE_PIPELINE.provider).toBe('Murf')
  expect(VOICE_PIPELINE.title).toBe('Real-time Voice Agent')
  expect(VOICE_PIPELINE.stt).toBe('Sarvam STT (en-IN)')
  expect(VOICE_PIPELINE.llm).toBe('OpenAI GPT-4o mini')
  expect(VOICE_PIPELINE.tts).toBe('Murf Matthew (FALCON)')
})
