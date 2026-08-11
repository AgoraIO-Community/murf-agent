'use client'

import { VOICE_PIPELINE } from '@/lib/pipeline'

export type QuickstartAgentMetric = {
  type: string
  name: string
  value: number
  timestamp: number
}

type QuickstartPipelineMetricsProps = {
  metrics: QuickstartAgentMetric[]
}

function formatMetricName(name: string) {
  return name.replace(/[_-]+/g, ' ')
}

export function QuickstartPipelineMetrics({ metrics }: QuickstartPipelineMetricsProps) {
  const pipeline = [
    { key: 'stt', label: VOICE_PIPELINE.stt, metricTypes: ['stt', 'asr'] },
    { key: 'llm', label: VOICE_PIPELINE.llm, metricTypes: ['llm', 'mllm'] },
    { key: 'tts', label: VOICE_PIPELINE.tts, metricTypes: ['tts'] },
  ]
  const latestByType = new Map<string, QuickstartAgentMetric>()
  for (const metric of metrics) {
    latestByType.set(metric.type.toLowerCase(), metric)
  }

  return (
    <div className="grid min-w-0 gap-2">
      {pipeline.map((step, index) => {
        const metric = step.metricTypes.map((type) => latestByType.get(type)).find(Boolean)

        return (
          <div
            key={step.key}
            className="flex min-w-0 items-center gap-3 rounded-xl border border-border/70 bg-muted/30 p-2.5"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-[10px] font-bold text-primary">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-foreground">{step.label}</p>
              <p className="mt-0.5 truncate text-[10px] uppercase tracking-wide text-muted-foreground">
                {metric ? formatMetricName(metric.name) : `${step.key} ready`}
              </p>
            </div>
            <span
              className="shrink-0 font-mono text-xs font-semibold text-primary"
              title={metric ? new Date(metric.timestamp).toLocaleTimeString() : undefined}
            >
              {metric ? `${Math.round(metric.value)}ms` : '—'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
