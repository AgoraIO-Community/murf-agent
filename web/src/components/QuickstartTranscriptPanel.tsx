'use client'

import { ArrowDown, Check, Copy, Download, FileText } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { TranscriptMessage } from '@/lib/conversation'

type QuickstartTranscriptPanelProps = {
  messageList: TranscriptMessage[]
  currentInProgressMessage: TranscriptMessage | null
  agentUID: string
}

function formatMessageTime(createdAt?: number) {
  if (!createdAt) return null
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(createdAt))
}

function formatConfidence(confidence?: number) {
  return confidence === undefined ? null : `${Math.round(confidence * 100)}%`
}

export function QuickstartTranscriptPanel({
  messageList,
  currentInProgressMessage,
  agentUID,
}: QuickstartTranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousFinalCountRef = useRef(0)
  const announcedTurnRef = useRef<string | number | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isFollowing, setIsFollowing] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [finalTurnAnnouncement, setFinalTurnAnnouncement] = useState('')
  const messages = useMemo(
    () => (currentInProgressMessage ? [...messageList, currentInProgressMessage] : messageList),
    [currentInProgressMessage, messageList],
  )

  const finalTurnCount = useMemo(
    () => messageList.filter((message) => message.status === 'final').length,
    [messageList],
  )

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return

    const newFinalTurns = Math.max(0, finalTurnCount - previousFinalCountRef.current)
    previousFinalCountRef.current = finalTurnCount

    if (isFollowing) {
      const frame = requestAnimationFrame(() => {
        node.scrollTo({ top: node.scrollHeight, behavior: 'auto' })
      })
      setUnreadCount(0)
      return () => cancelAnimationFrame(frame)
    }

    if (newFinalTurns > 0) setUnreadCount((count) => count + newFinalTurns)
  }, [finalTurnCount, isFollowing, messages])

  useEffect(() => {
    const latestFinalTurn = [...messageList].reverse().find((message) => message.status === 'final')
    if (!latestFinalTurn) return
    const turnKey = latestFinalTurn.turn_id ?? `${latestFinalTurn.uid}-${latestFinalTurn.createdAt}`
    if (turnKey === announcedTurnRef.current) return
    announcedTurnRef.current = turnKey
    const speaker = String(latestFinalTurn.uid) === agentUID ? 'Agent' : 'You'
    setFinalTurnAnnouncement(`${speaker} finalized: ${latestFinalTurn.text.trim()}`)
  }, [agentUID, messageList])

  useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    },
    [],
  )

  const exportedTurns = useMemo(
    () =>
      messages.map((message) => ({
        turn_id: message.turn_id ?? null,
        speaker: String(message.uid) === agentUID ? 'agent' : 'user',
        uid: message.uid,
        text: message.text.trim(),
        status: message.status,
        confidence: message.confidence ?? null,
        timestamp: message.createdAt ?? null,
        timestamp_iso: message.createdAt ? new Date(message.createdAt).toISOString() : null,
      })),
    [agentUID, messages],
  )

  const copyTranscript = async () => {
    const plainText = exportedTurns
      .map((turn) => {
        const time = turn.timestamp ? formatMessageTime(turn.timestamp) : 'Unknown time'
        const status = turn.status === 'interim' ? ' (interim)' : ''
        return `[${time}] ${turn.speaker === 'agent' ? 'Agent' : 'You'}: ${turn.text}${status}`
      })
      .join('\n')

    await navigator.clipboard.writeText(plainText)
    setIsCopied(true)
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    copiedTimerRef.current = setTimeout(() => setIsCopied(false), 1800)
  }

  const downloadTranscript = () => {
    const payload = {
      exported_at: new Date().toISOString(),
      turn_count: exportedTurns.length,
      turns: exportedTurns,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `agora-transcript-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  const handleScroll = () => {
    const node = scrollRef.current
    if (!node) return
    const isNearBottom = node.scrollHeight - node.scrollTop - node.clientHeight <= 96
    setIsFollowing(isNearBottom)
    if (isNearBottom) setUnreadCount(0)
  }

  const jumpToLatest = () => {
    const node = scrollRef.current
    if (!node) return
    setIsFollowing(true)
    setUnreadCount(0)
    node.scrollTo({ top: node.scrollHeight, behavior: 'auto' })
  }

  return (
    <section
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/80 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl"
      aria-label="Transcription panel"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border/70 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground">Live transcript</h2>
            <p className="truncate text-xs text-muted-foreground">
              {finalTurnCount} final {finalTurnCount === 1 ? 'turn' : 'turns'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl"
            onClick={copyTranscript}
            disabled={messages.length === 0}
            aria-label={isCopied ? 'Transcript copied' : 'Copy transcript'}
            title={isCopied ? 'Transcript copied' : 'Copy transcript'}
          >
            {isCopied ? <Check className="text-emerald-500" /> : <Copy />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-xl"
            onClick={downloadTranscript}
            disabled={messages.length === 0}
            aria-label="Download transcript as JSON"
            title="Download transcript as JSON"
          >
            <Download />
          </Button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="transcript-scroll absolute inset-0 flex flex-col gap-5 overflow-y-auto px-4 py-5 sm:px-5"
          onScroll={handleScroll}
        >
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-muted-foreground">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Waiting for speech</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Speak into your microphone. Interim words will appear here live.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isAgent = String(message.uid) === agentUID
              const label = isAgent ? 'Agent' : 'You'
              const text = message.text?.trim()
              const time = formatMessageTime(message.createdAt)
              const confidence = formatConfidence(message.confidence)
              const isInterim = message.status === 'interim'
              const isInterrupted = message.status === 'interrupted'

              return (
                <article
                  key={`${message.turn_id ?? message.uid}-${index}`}
                  className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}
                >
                  <div className="mb-1.5 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    <span>{label}</span>
                    {time ? <span className="font-mono font-normal tracking-normal">{time}</span> : null}
                    {confidence ? (
                      <span className="font-mono font-normal tracking-normal text-primary">
                        {confidence} confidence
                      </span>
                    ) : null}
                  </div>
                  <div
                    className={`max-w-full whitespace-pre-wrap rounded-2xl border px-3.5 py-2.5 text-sm leading-6 shadow-sm transition-colors ${
                      isInterim
                        ? 'border-dashed border-amber-400/50 bg-amber-400/5 text-foreground/75'
                        : isInterrupted
                          ? 'border-border bg-muted/50 text-muted-foreground line-through decoration-muted-foreground/30'
                          : isAgent
                            ? 'border-slate-800 bg-slate-900 text-slate-100'
                            : 'border-primary/20 bg-primary/10 text-foreground'
                    }`}
                  >
                    {text || '...'}
                    {isInterim ? (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-amber-500">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                        Interim
                      </span>
                    ) : null}
                  </div>
                </article>
              )
            })
          )}
        </div>

        {!isFollowing ? (
          <Button
            type="button"
            className="absolute bottom-4 left-1/2 h-11 -translate-x-1/2 rounded-full px-4 shadow-xl"
            onClick={jumpToLatest}
            aria-label={`Jump to latest transcript${unreadCount ? `, ${unreadCount} unread final turns` : ''}`}
          >
            <ArrowDown className="h-4 w-4" />
            Jump to latest{unreadCount ? ` (${unreadCount} new)` : ''}
          </Button>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {finalTurnAnnouncement}
      </p>
    </section>
  )
}
