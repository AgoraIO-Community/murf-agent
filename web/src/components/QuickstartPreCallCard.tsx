'use client'

import { ArrowRight, AudioLines, Bot, CheckCircle2, Code2, Loader2, Mic2, Radio, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { VOICE_PIPELINE } from '@/lib/pipeline'

type QuickstartPreCallCardProps = {
  isLoading: boolean
  error: string | null
  onStartConversation: () => void
}

const pipelineSteps = [
  { icon: Radio, shortLabel: 'STT', label: VOICE_PIPELINE.stt },
  { icon: Bot, shortLabel: 'LLM', label: VOICE_PIPELINE.llm },
  { icon: AudioLines, shortLabel: 'TTS', label: VOICE_PIPELINE.tts },
]

export function QuickstartPreCallCard({ isLoading, error, onStartConversation }: QuickstartPreCallCardProps) {
  return (
    <div className="mx-auto w-full max-w-[76rem] animate-fade-up px-1">
      <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/80 shadow-[0_36px_120px_rgba(15,23,42,0.14)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 border-b border-border/70 px-6 py-4 sm:px-8">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
            <Code2 className="h-4 w-4" />
            {VOICE_PIPELINE.eyebrow}
          </div>
          <div className="hidden items-center gap-2 font-mono text-[11px] text-muted-foreground sm:flex">
            <span className="h-2 w-2 rounded-full bg-fuchsia-500" />
            fixed-pipeline / rtc + rtm
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <section className="flex flex-col justify-center px-6 py-10 text-left sm:px-10 sm:py-14 lg:px-14 lg:py-16">
            <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              {VOICE_PIPELINE.accent}
            </div>
            <p className="text-sm font-semibold text-muted-foreground">{VOICE_PIPELINE.provider}</p>
            <h1 className="mt-2 max-w-2xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-foreground sm:text-5xl lg:text-[3.6rem]">
              Build with voice. Observe every turn.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground">
              A transcript-first reference experience for testing real-time speech recognition, agent reasoning, and
              synthesized response audio.
            </p>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-fuchsia-500" /> Live interim transcripts
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-fuchsia-500" /> Pipeline latency metrics
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-fuchsia-500" /> Exportable session log
              </span>
            </div>

            <Button
              onClick={onStartConversation}
              disabled={isLoading}
              className="mt-9 h-12 w-full rounded-xl px-5 text-sm font-semibold shadow-[0_14px_36px_rgba(124,58,237,0.26)] sm:w-fit"
              aria-label={isLoading ? 'Starting conversation with AI agent' : 'Start conversation with AI agent'}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic2 className="h-4 w-4" />}
              {isLoading ? 'Preparing session...' : 'Launch voice session'}
              {!isLoading ? <ArrowRight className="h-4 w-4" /> : null}
            </Button>
            {error ? (
              <p className="mt-3 text-sm font-medium text-destructive" role="alert">
                {error}
              </p>
            ) : null}
          </section>

          <aside className="relative overflow-hidden border-t border-border/70 bg-slate-950 px-6 py-9 text-slate-100 sm:px-9 sm:py-11 lg:border-l lg:border-t-0">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-400/20 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-fuchsia-400/15 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300">Execution path</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                    One fixed, production-shaped pipeline
                  </h2>
                </div>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 font-mono text-[10px] text-slate-400">
                  v1
                </span>
              </div>

              <div className="mt-7 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {pipelineSteps.map(({ icon: Icon, shortLabel, label }, index) => (
                  <div
                    key={shortLabel}
                    className="relative min-w-0 rounded-2xl border border-white/10 bg-white/[0.045] p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/15 text-violet-300">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">0{index + 1}</span>
                    </div>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-fuchsia-300">
                      {shortLabel}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-100">{label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute h-full w-full animate-ping rounded-full bg-fuchsia-400 opacity-60" />
                    <span className="relative h-2 w-2 rounded-full bg-fuchsia-400" />
                  </span>
                  Readiness checks run on launch
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  {VOICE_PIPELINE.description} Microphone access is requested only when the session starts.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
