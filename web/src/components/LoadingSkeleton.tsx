'use client'

export function LoadingSkeleton() {
  return (
    <div
      className="showcase-shell flex min-h-0 flex-1 flex-col"
      aria-busy="true"
      aria-label="Loading voice session workspace"
    >
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border/70 bg-background/85 px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
          <div className="space-y-2">
            <div className="h-2.5 w-28 animate-pulse rounded bg-muted" />
            <div className="h-4 w-52 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="h-11 w-28 animate-pulse rounded-xl bg-muted" />
      </header>

      <div className="mx-auto grid min-h-0 w-full max-w-[100rem] flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_22rem] lg:p-5">
        <section className="flex min-h-[32rem] flex-col overflow-hidden rounded-[1.5rem] border border-border/80 bg-card/80">
          <div className="flex h-[4.5rem] items-center gap-3 border-b border-border/70 px-5">
            <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
            <div className="space-y-2">
              <div className="h-3.5 w-28 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-end gap-5 p-5">
            <p className="mb-auto text-sm font-medium text-muted-foreground">
              Preparing the voice session workspace...
            </p>
            <div className="h-16 w-3/5 animate-pulse rounded-2xl bg-muted" />
            <div className="ml-auto h-20 w-2/3 animate-pulse rounded-2xl bg-muted" />
            <div className="h-14 w-1/2 animate-pulse rounded-2xl bg-muted" />
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[1.5rem] border border-border/80 bg-card/80 p-4">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <div className="mx-auto my-10 h-28 w-28 animate-pulse rounded-full bg-muted" />
            <div className="mx-auto h-3 w-36 animate-pulse rounded bg-muted" />
            <div className="mt-8 h-16 animate-pulse rounded-xl bg-muted" />
          </div>
          <div className="space-y-2 rounded-[1.5rem] border border-border/80 bg-card/80 p-4">
            <div className="h-3 w-32 animate-pulse rounded bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
            <div className="h-12 animate-pulse rounded-xl bg-muted" />
          </div>
        </aside>
      </div>
      <p className="sr-only">Loading the transcript and voice session controls.</p>
    </div>
  )
}
