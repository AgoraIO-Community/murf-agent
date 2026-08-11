'use client'

import { AlertTriangle, CheckCircle2, Wifi, WifiOff, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { type ConnectionIssue, ConversationErrorCard } from '@/components/ConversationErrorCard'

type ConnectionStatusPanelProps = {
  connectionState: string
  connectionSeverity: 'normal' | 'warning' | 'error'
  connectionIssues: ConnectionIssue[]
  isOpen: boolean
  onToggle: () => void
}

function getConnectionLabel(connectionState: string, connectionSeverity: 'normal' | 'warning' | 'error') {
  if (connectionSeverity !== 'normal' && connectionState === 'CONNECTED') return 'Connected with issues'
  if (connectionState === 'CONNECTED') return 'RTC connected'
  if (connectionState === 'CONNECTING') return 'RTC connecting'
  if (connectionState === 'RECONNECTING') return 'RTC reconnecting'
  if (connectionState === 'DISCONNECTING') return 'RTC disconnecting'
  return 'RTC disconnected'
}

export function ConnectionStatusPanel({
  connectionState,
  connectionSeverity,
  connectionIssues,
  isOpen,
  onToggle,
}: ConnectionStatusPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const label = getConnectionLabel(connectionState, connectionSeverity)

  useEffect(() => {
    if (!isOpen) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onToggle()
    }
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onToggle()
    }

    document.addEventListener('keydown', closeOnEscape)
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => {
      document.removeEventListener('keydown', closeOnEscape)
      document.removeEventListener('pointerdown', closeOnOutsideClick)
    }
  }, [isOpen, onToggle])

  const StatusIcon =
    connectionSeverity === 'error' ? WifiOff : connectionSeverity === 'warning' ? AlertTriangle : CheckCircle2

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          connectionSeverity === 'error'
            ? 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
            : connectionSeverity === 'warning'
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
        }`}
        aria-label={`${label}. Show connection details`}
        aria-expanded={isOpen}
        aria-controls="connection-details-panel"
        onClick={onToggle}
      >
        <StatusIcon className="h-4 w-4" />
        <span className="hidden sm:inline">{label}</span>
        <span className="sm:hidden">Status</span>
      </button>

      {isOpen ? (
        <dialog
          open
          id="connection-details-panel"
          className="fixed right-4 top-20 z-50 m-0 w-[min(92vw,24rem)] space-y-3 rounded-2xl border border-border bg-popover p-4 text-left shadow-2xl md:absolute md:right-0 md:top-full md:mt-3"
          aria-labelledby="connection-details-title"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div id="connection-details-title" className="text-sm font-semibold text-foreground">
                Connection details
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wifi className="h-3.5 w-3.5" />
                {label} · {connectionIssues.length} reported {connectionIssues.length === 1 ? 'issue' : 'issues'}
              </div>
            </div>
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={onToggle}
              aria-label="Close connection details"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {connectionIssues.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/35 p-3 text-xs leading-5 text-muted-foreground">
              RTC is {connectionState.toLowerCase()}. No RTM or agent errors have been reported.
            </div>
          ) : (
            <div className="max-h-64 space-y-2 overflow-auto pr-1">
              {connectionIssues.map((issue) => (
                <ConversationErrorCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </dialog>
      ) : null}
    </div>
  )
}
