# Agora Murf Voice Agent Architecture

The project runs two deployable processes. Next.js owns the browser UI and `/api/*` facade; FastAPI owns secrets, Agora token generation, and agent lifecycle.

```text
Browser
  -> Next.js /api/* rewrites
  -> FastAPI on port 8001
  -> Agora Conversational AI
       Sarvam STT (en-IN by default)
       managed OpenAI gpt-4o-mini
       Murf TTS (Matthew, FALCON, en-US, 24 kHz)
  -> RTC agent audio + RTM transcripts/state/metrics
```

## Session Flow

1. `GET /api/get_config` returns a channel, concrete user UID, agent UID, and one-hour RTC+RTM token.
2. The browser logs into RTM, subscribes to the channel, and joins RTC.
3. `POST /api/startAgent { channelName, rtcUid, userUid }` starts the fixed pipeline. There is no provider-selection field.
4. `ConversationComponent` publishes microphone audio and consumes agent audio plus RTM events.
5. `POST /api/stopAgent { agentId }` stops the tracked session; the client then releases RTC and RTM resources.

## Ownership

- `web/next.config.ts` maps `/api/get_config`, `/api/startAgent`, and `/api/stopAgent` to `AGENT_BACKEND_URL`.
- `server/src/server.py` validates route input, generates tokens, and maps errors.
- `server/src/agent.py` imports and configures only `SarvamSTT`, `OpenAI`, and `MurfTTS`.
- `web/src/lib/pipeline.ts` is an immutable presentation descriptor, not runtime configuration.

## Security Boundary

`AGORA_APP_CERTIFICATE`, `SARVAM_API_KEY`, and `MURF_API_KEY` exist only on FastAPI. The browser receives scoped Agora tokens but never provider credentials. Public deployments should add authentication, rate limiting, and restricted CORS in front of FastAPI.

See [README.md](README.md) for setup and [docs/ai/L1/02_architecture.md](docs/ai/L1/02_architecture.md) for implementation details.
