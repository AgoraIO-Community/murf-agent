'use client'

import type { RTMClient } from 'agora-rtm'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'

import { ErrorBoundary } from '@/components/ErrorBoundary'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'
import { QuickstartPreCallCard } from '@/components/QuickstartPreCallCard'
import { ShareButton } from '@/components/share-button'
import { getConfig, startAgent, stopAgent } from '@/services/api'
import type { AgoraRenewalTokens, AgoraTokenData } from '@/types/conversation'

const ConversationComponent = dynamic(() => import('@/components/ConversationComponent'), {
  ssr: false,
})

function waitForRtmConnected(rtmClient: RTMClient, timeoutMs = 600): Promise<void> {
  return new Promise((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const finish = () => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      rtmClient.removeEventListener('status', onStatus)
      resolve()
    }

    const onStatus = (connectionStatus: { newState?: string } | { state?: string } | Record<string, unknown>) => {
      const nextState =
        typeof connectionStatus === 'object' && connectionStatus !== null
          ? 'newState' in connectionStatus
            ? connectionStatus.newState
            : 'state' in connectionStatus
              ? connectionStatus.state
              : undefined
          : undefined
      if (nextState === 'CONNECTED') {
        finish()
      }
    }

    rtmClient.addEventListener('status', onStatus)
    timer = setTimeout(finish, timeoutMs)
  })
}

const AgoraProvider = dynamic(
  async () => {
    const { AgoraRTCProvider, default: AgoraRTC } = await import('agora-rtc-react')

    return {
      default: function AgoraProviders({ children }: { children: React.ReactNode }) {
        const clientRef = useRef<ReturnType<typeof AgoraRTC.createClient> | null>(null)
        if (!clientRef.current) {
          clientRef.current = AgoraRTC.createClient({
            mode: 'rtc',
            codec: 'vp8',
          })
        }
        return <AgoraRTCProvider client={clientRef.current}>{children}</AgoraRTCProvider>
      },
    }
  },
  { ssr: false },
)

export default function LandingPage() {
  const [showConversation, setShowConversation] = useState(false)
  const [agoraData, setAgoraData] = useState<AgoraTokenData | null>(null)
  const [rtmClient, setRtmClient] = useState<RTMClient | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    import('agora-rtc-react').catch(() => {})
    import('agora-rtm').catch(() => {})
  }, [])

  const handleStartConversation = async () => {
    setIsLoading(true)
    setError(null)
    let startedAgentId: string | undefined
    let pendingRtm: RTMClient | null = null

    try {
      const config = await getConfig()
      const appId = config.app_id

      startedAgentId = await startAgent(config.channel_name, Number(config.agent_uid), Number(config.uid))
      const { default: AgoraRTM } = await import('agora-rtm')
      pendingRtm = new AgoraRTM.RTM(appId, config.uid)
      await pendingRtm.login({ token: config.token })
      await waitForRtmConnected(pendingRtm)
      await pendingRtm.subscribe(config.channel_name)

      setRtmClient(pendingRtm)
      setAgoraData({
        token: config.token,
        uid: config.uid,
        channel: config.channel_name,
        appId: config.app_id,
        agentUid: config.agent_uid,
        agentId: startedAgentId,
      })
      setShowConversation(true)
    } catch (nextError) {
      if (startedAgentId) {
        await stopAgent(startedAgentId).catch((cleanupError) =>
          console.error('Failed to stop agent after startup error:', cleanupError),
        )
      }
      if (pendingRtm) {
        await pendingRtm.logout().catch((cleanupError) =>
          console.error('Failed to log out RTM after startup error:', cleanupError),
        )
      }
      setError('Failed to start conversation. Please try again.')
      console.error('Error starting conversation:', nextError)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTokenWillExpire = useCallback(
    async (uid: string): Promise<AgoraRenewalTokens> => {
      try {
        const channel = agoraData?.channel
        if (!channel) {
          throw new Error('Missing channel for token renewal')
        }

        // Python get_config issues RTM-capable tokens for the configured account,
        // so renew RTM with the same UID used by the RTM client login.
        const [rtcConfig, rtmConfig] = await Promise.all([
          getConfig({ channel, uid }),
          getConfig({ channel, uid: agoraData.uid }),
        ])

        return {
          rtcToken: rtcConfig.token,
          rtmToken: rtmConfig.token,
        }
      } catch (error) {
        console.error('Error renewing token:', error)
        throw error
      }
    },
    [agoraData],
  )

  const handleEndConversation = async () => {
    if (agoraData?.agentId) {
      try {
        await stopAgent(agoraData.agentId)
      } catch (nextError) {
        console.error('Failed to stop agent:', nextError)
      }
    }

    rtmClient?.logout().catch((err) => console.error('RTM logout error:', err))
    setRtmClient(null)
    setAgoraData(null)
    setShowConversation(false)
  }

  return (
    <div
      className={`showcase-background relative flex h-dvh min-h-screen flex-col bg-background text-foreground ${
        showConversation ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto'
      }`}
    >
      <div
        className={`flex min-h-0 flex-1 flex-col ${
          showConversation ? 'items-stretch justify-start' : 'items-center justify-center'
        }`}
      >
        <div
          className={`z-10 flex min-h-0 flex-1 flex-col ${
            showConversation
              ? 'h-full w-full max-w-none items-stretch gap-0 px-0 text-left'
              : 'w-full max-w-none items-center justify-center px-4 py-8 pb-24 text-center md:py-12 md:pb-24'
          }`}
        >
          {!showConversation ? (
            <QuickstartPreCallCard
              isLoading={isLoading}
              error={error}
              onStartConversation={handleStartConversation}
            />
          ) : agoraData && rtmClient ? (
            <>
              <Suspense fallback={<LoadingSkeleton />}>
                <ErrorBoundary>
                  <AgoraProvider>
                    <ConversationComponent
                      agoraData={agoraData}
                      rtmClient={rtmClient}
                      onTokenWillExpire={handleTokenWillExpire}
                      onEndConversation={handleEndConversation}
                    />
                  </AgoraProvider>
                </ErrorBoundary>
              </Suspense>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Failed to load conversation data.</p>
          )}
        </div>
      </div>

      {!showConversation ? (
        <footer
          className={`fixed inset-x-0 bottom-0 z-40 flex items-center gap-4 px-4 py-4 md:px-6 md:py-6 ${
            showConversation ? 'justify-end' : 'justify-between'
          }`}
        >
          {!showConversation ? <ShareButton menuPlacement="top" /> : null}
          <div className="flex items-center justify-end gap-2 text-muted-foreground">
            <span className="text-xs font-medium uppercase tracking-wide">Powered by</span>
            <a
              href="https://agora.io/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-primary"
              aria-label="Visit Agora's website"
            >
              <Image
                src="/agora-logo-rgb-blue.svg"
                alt="Agora"
                width={86}
                height={24}
                priority
                className="translate-y-1 transition-opacity hover:opacity-80"
              />
              <span className="sr-only">Agora</span>
            </a>
          </div>
        </footer>
      ) : null}
    </div>
  )
}
