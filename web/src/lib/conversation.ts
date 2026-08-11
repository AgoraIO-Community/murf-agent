import {
  type AgentState,
  type AgentTranscription,
  type TranscriptHelperItem,
  TurnStatus,
  type UserTranscription,
} from 'agora-agent-client-toolkit'
import type { AgentVisualizerState } from 'agora-agent-uikit'

export type TranscriptMessage = {
  turn_id?: string | number
  uid: number
  text: string
  status: 'interim' | 'final' | 'interrupted'
  createdAt?: number
  confidence?: number
}

export type SessionDisplayStatus = {
  label: string
  detail: string
  visualizerLabel: string
  tone: 'neutral' | 'warning' | 'success' | 'error'
}

export function getSessionDisplayStatus({
  connectionState,
  isAgentConnected,
  agentState,
  isMicReady,
  isMicEnabled,
}: {
  connectionState: string
  isAgentConnected: boolean
  agentState: AgentState | null
  isMicReady: boolean
  isMicEnabled: boolean
}): SessionDisplayStatus {
  if (connectionState === 'DISCONNECTED' || connectionState === 'DISCONNECTING') {
    return {
      label: 'Disconnected',
      detail: 'The RTC session is not connected.',
      visualizerLabel: 'Session disconnected',
      tone: 'error',
    }
  }

  if (connectionState === 'CONNECTING' || connectionState === 'RECONNECTING') {
    const reconnecting = connectionState === 'RECONNECTING'
    return {
      label: reconnecting ? 'Reconnecting' : 'Connecting',
      detail: reconnecting ? 'Restoring the RTC session.' : 'Joining the RTC channel.',
      visualizerLabel: reconnecting ? 'Restoring connection' : 'Joining channel',
      tone: 'warning',
    }
  }

  if (!isAgentConnected) {
    return {
      label: 'Waiting for agent',
      detail: 'RTC is connected. Waiting for the agent to join.',
      visualizerLabel: 'Agent has not joined',
      tone: 'warning',
    }
  }

  if (!isMicReady) {
    return {
      label: 'Microphone unavailable',
      detail: 'The agent is connected, but microphone input is not ready.',
      visualizerLabel: 'Microphone input unavailable',
      tone: 'warning',
    }
  }

  if (!isMicEnabled) {
    return {
      label: 'Microphone muted',
      detail: 'The agent is connected and microphone input is muted.',
      visualizerLabel: 'Microphone muted',
      tone: 'neutral',
    }
  }

  switch (agentState) {
    case 'listening':
      return {
        label: 'Listening',
        detail: 'The agent is receiving microphone audio.',
        visualizerLabel: 'Agent is listening',
        tone: 'success',
      }
    case 'thinking':
      return {
        label: 'Thinking',
        detail: 'The agent is preparing a response.',
        visualizerLabel: 'Agent is thinking',
        tone: 'success',
      }
    case 'speaking':
      return {
        label: 'Speaking',
        detail: 'The agent is sending synthesized audio.',
        visualizerLabel: 'Agent is speaking',
        tone: 'success',
      }
    default:
      return {
        label: 'Ready',
        detail: 'Agent, RTC, and microphone are ready.',
        visualizerLabel: 'Agent is ready',
        tone: 'success',
      }
  }
}

export function normalizeTranscriptSpacing(text: string): string {
  return text
    .replace(/([.!?])([A-Za-z])/g, '$1 $2')
    .replace(/,([A-Za-z])/g, ', $1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function normalizeTimestampMs(timestamp: number): number {
  return timestamp > 1e12 ? timestamp : timestamp * 1000
}

export function mapAgentVisualizerState(
  agentState: AgentState | null,
  isAgentConnected: boolean,
  connectionState: string,
): AgentVisualizerState {
  if (connectionState === 'DISCONNECTED' || connectionState === 'DISCONNECTING') {
    return 'disconnected'
  }

  if (connectionState === 'CONNECTING' || connectionState === 'RECONNECTING') {
    return 'joining'
  }

  if (!isAgentConnected) {
    return 'not-joined'
  }

  switch (agentState) {
    case 'listening':
      return 'listening'
    case 'thinking':
      return 'analyzing'
    case 'speaking':
      return 'talking'
    default:
      return 'ambient'
  }
}

function normalizeConfidence(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return undefined
  }

  const normalized = value > 1 && value <= 100 ? value / 100 : value
  return normalized <= 1 ? normalized : undefined
}

export function getTranscriptConfidence(value: unknown): number | undefined {
  if (!value || typeof value !== 'object') return undefined

  const record = value as Record<string, unknown>
  for (const key of ['confidence', 'confidence_score', 'probability']) {
    const confidence = normalizeConfidence(record[key])
    if (confidence !== undefined) return confidence
  }

  if (!Array.isArray(record.words)) return undefined
  const wordConfidences = record.words
    .map((word) => getTranscriptConfidence(word))
    .filter((confidence): confidence is number => confidence !== undefined)

  if (wordConfidences.length === 0) return undefined
  return wordConfidences.reduce((sum, confidence) => sum + confidence, 0) / wordConfidences.length
}

function toMessageListItem(
  item: TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>,
): TranscriptMessage {
  return {
    turn_id: item.turn_id,
    uid: Number(item.uid) || 0,
    text: typeof item.text === 'string' ? item.text : '',
    status:
      item.status === TurnStatus.IN_PROGRESS
        ? 'interim'
        : item.status === TurnStatus.INTERRUPTED
          ? 'interrupted'
          : 'final',
    createdAt: typeof item._time === 'number' ? normalizeTimestampMs(item._time) : undefined,
    confidence: getTranscriptConfidence(item.metadata) ?? getTranscriptConfidence(item),
  }
}

export function normalizeTranscript(
  transcript: TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[],
  localUid: string,
) {
  return transcript.map((item) => {
    const nextUid = item.uid === '0' ? localUid : item.uid
    const nextText = typeof item.text === 'string' ? normalizeTranscriptSpacing(item.text) : item.text

    return { ...item, uid: nextUid, text: nextText }
  })
}

export function getMessageList(transcript: TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[]) {
  return transcript.filter((item) => item.status !== TurnStatus.IN_PROGRESS).map(toMessageListItem)
}

export function getCurrentInProgressMessage(
  transcript: TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[],
) {
  const item = transcript.find((entry) => entry.status === TurnStatus.IN_PROGRESS)
  return item ? toMessageListItem(item) : null
}
