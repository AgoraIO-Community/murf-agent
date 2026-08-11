'use client'

import { AudioLines, Clock3, Radio, Square } from 'lucide-react'
import Image from 'next/image'
import { type ReactNode, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { SessionDisplayStatus } from '@/lib/conversation'
import { VOICE_PIPELINE } from '@/lib/pipeline'

type QuickstartConversationLayoutProps = {
  statusPanel: ReactNode
  sessionStatus: SessionDisplayStatus
  pipelineMetrics: ReactNode
  transcriptPanel: ReactNode
  visualizer: ReactNode
  controls: ReactNode
  channelName: string
  onEndConversation: () => void
}

function formatDuration(elapsedSeconds: number) {
  const minutes = Math.floor(elapsedSeconds / 60)
  const seconds = elapsedSeconds % 60
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

export function QuickstartConversationLayout({
  statusPanel,
  sessionStatus,
  pipelineMetrics,
  transcriptPanel,
  visualizer,
  controls,
  channelName,
  onEndConversation,
}: QuickstartConversationLayoutProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    const startedAt = Date.now()
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const statusTone = {
    success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    error: 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300',
    neutral: 'border-border bg-muted/60 text-muted-foreground',
  }[sessionStatus.tone]

  return (
    <div className="showcase-shell flex min-h-0 flex-1 flex-col text-left">
      <header className="shrink-0 border-b border-border/70 bg-background/85 px-4 py-3 backdrop-blur-xl md:px-6">
        <div className="mx-auto flex max-w-[100rem] flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <Image src="/agora-logo-mark.svg" alt="Agora" width={28} height={28} className="h-7 w-7 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{VOICE_PIPELINE.eyebrow}</p>
              <h1 className="truncate text-base font-semibold tracking-[-0.02em] text-foreground sm:text-lg">
                {VOICE_PIPELINE.provider} {VOICE_PIPELINE.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {statusPanel}
            <Button
              variant="destructive"
              className="h-11 rounded-xl px-4 font-semibold shadow-sm"
              onClick={onEndConversation}
              aria-label="End conversation with AI agent"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              <span className="hidden sm:inline">End session</span>
              <span className="sm:hidden">End</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[100rem] flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:overflow-hidden lg:p-5 xl:gap-5">
        <main className="min-h-[32rem] min-w-0 lg:min-h-0">{transcriptPanel}</main>

        <aside className="flex min-w-0 flex-col gap-4 lg:min-h-0 lg:overflow-y-auto">
          <section className="overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/80 shadow-[0_20px_60px_rgba(15,23,42,0.07)]">
            <div className="flex items-start justify-between gap-3 border-b border-border/70 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Agent state</p>
                <h2 className="mt-1 text-sm font-semibold text-foreground">Voice activity</h2>
              </div>
              <span
                className={`inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold ${statusTone}`}
              >
                <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
                {sessionStatus.label}
              </span>
            </div>

            <div className="flex min-h-[14rem] flex-col items-center justify-center px-4 py-5">
              <div className="flex min-h-0 w-full flex-1 items-center justify-center">{visualizer}</div>
              <p className="mt-2 text-center text-sm font-medium text-foreground">{sessionStatus.visualizerLabel}</p>
              <p className="mt-1 text-center text-xs leading-5 text-muted-foreground">{sessionStatus.detail}</p>
            </div>

            <div className="border-t border-border/70 p-4">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Audio input
              </p>
              {controls}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-border/80 bg-card/80 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.05)]">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              <AudioLines className="h-3.5 w-3.5 text-primary" />
              Pipeline telemetry
            </div>
            <div className="mt-3">{pipelineMetrics}</div>
          </section>

          <section className="grid grid-cols-2 gap-3 rounded-[1.5rem] border border-border/80 bg-card/80 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                <Radio className="h-3.5 w-3.5 text-primary" /> Channel
              </div>
              <p className="mt-2 truncate font-mono text-xs font-semibold text-foreground" title={channelName}>
                {channelName}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                <Clock3 className="h-3.5 w-3.5 text-primary" /> Duration
              </div>
              <p className="mt-2 font-mono text-xs font-semibold text-foreground">{formatDuration(elapsedSeconds)}</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}
