import { expect, test } from 'bun:test'
import { TurnStatus } from 'agora-agent-client-toolkit'

import {
  getCurrentInProgressMessage,
  getMessageList,
  getSessionDisplayStatus,
  getTranscriptConfidence,
  normalizeTranscript,
  normalizeTranscriptSpacing,
} from './conversation'

test('session display status reflects connection, agent, and microphone readiness', () => {
  expect(
    getSessionDisplayStatus({
      connectionState: 'CONNECTED',
      isAgentConnected: false,
      agentState: null,
      isMicReady: true,
      isMicEnabled: true,
    }).label,
  ).toBe('Waiting for agent')

  expect(
    getSessionDisplayStatus({
      connectionState: 'CONNECTED',
      isAgentConnected: true,
      agentState: 'speaking',
      isMicReady: true,
      isMicEnabled: true,
    }),
  ).toEqual(expect.objectContaining({ label: 'Speaking', tone: 'success' }))

  expect(
    getSessionDisplayStatus({
      connectionState: 'CONNECTED',
      isAgentConnected: true,
      agentState: 'listening',
      isMicReady: false,
      isMicEnabled: true,
    }).label,
  ).toBe('Microphone unavailable')
})

test('normalizeTranscriptSpacing inserts spaces and collapses whitespace', () => {
  expect(normalizeTranscriptSpacing('Hello.World,now  ok')).toBe('Hello. World, now ok')
})

test("normalizeTranscript remaps uid '0' to the local uid and normalizes text", () => {
  const out = normalizeTranscript(
    [
      { uid: '0', text: 'Hi.There', turn_id: '1', status: 0 },
      { uid: '42', text: 'ok', turn_id: '2', status: 0 },
    ] as any,
    'local-9',
  )
  expect(out[0].uid).toBe('local-9')
  expect(out[0].text).toBe('Hi. There')
  expect(out[1].uid).toBe('42')
})

test('getTranscriptConfidence accepts normalized, percentage, and word-level values', () => {
  expect(getTranscriptConfidence({ confidence: 0.93 })).toBe(0.93)
  expect(getTranscriptConfidence({ confidence_score: 87 })).toBe(0.87)
  expect(
    getTranscriptConfidence({
      words: [{ confidence: 0.8 }, { confidence: 0.6 }],
    }),
  ).toBeCloseTo(0.7)
  expect(getTranscriptConfidence({ confidence: 240 })).toBeUndefined()
})

test('transcript helpers separate final and interim turns with metadata', () => {
  const transcript = [
    {
      uid: '7',
      text: 'Final turn',
      turn_id: 1,
      stream_id: 1,
      _time: 1_720_000_000,
      status: TurnStatus.END,
      metadata: { confidence: 0.96 },
    },
    {
      uid: '7',
      text: 'Still speaking',
      turn_id: 2,
      stream_id: 1,
      _time: 1_720_000_001,
      status: TurnStatus.IN_PROGRESS,
      metadata: { confidence: 82 },
    },
  ] as any

  expect(getMessageList(transcript)).toEqual([
    expect.objectContaining({
      text: 'Final turn',
      status: 'final',
      confidence: 0.96,
      createdAt: 1_720_000_000_000,
    }),
  ])
  expect(getCurrentInProgressMessage(transcript)).toEqual(
    expect.objectContaining({
      text: 'Still speaking',
      status: 'interim',
      confidence: 0.82,
    }),
  )
})
