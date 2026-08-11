# Agora Murf Voice Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Python](https://img.shields.io/badge/python-%3E%3D3.10-blue)](https://www.python.org/)
[![Bun](https://img.shields.io/badge/bun-latest-black)](https://bun.sh/)

A standalone Agora Conversational AI voice agent with a Next.js client and Python FastAPI backend. Its fixed speech pipeline is:

- Speech recognition: Sarvam STT (`SARVAM_LANGUAGE`, default `en-IN`)
- Reasoning: Agora-managed OpenAI `gpt-4o-mini`
- Voice synthesis: Murf TTS (`MURF_VOICE_ID`, default `Matthew`), `FALCON`, `en-US`, 24 kHz

The web app includes live transcripts, agent state, pipeline metrics, microphone controls, and an Agent UIKit visualizer.

## Prerequisites

- Python 3.10+
- Bun
- An Agora project with Conversational AI enabled
- Sarvam and Murf API keys

## Setup

1. Install dependencies:

   ```bash
   bun run setup
   ```

2. Configure `server/.env.local` from [`server/.env.example`](server/.env.example) with your own values. Keep this file local and never commit it.

3. Run both services:

   ```bash
   bun run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

Services:

- Web: `http://localhost:3000`
- FastAPI: `http://localhost:8001`
- API docs: `http://localhost:8001/docs`

## Environment

| Variable | Required | Default | Purpose |
| --- | :---: | --- | --- |
| `AGORA_APP_ID` | Yes | - | Agora project App ID |
| `AGORA_APP_CERTIFICATE` | Yes | - | Server-only Agora App Certificate |
| `SARVAM_API_KEY` | Yes | - | Server-only Sarvam STT key |
| `SARVAM_LANGUAGE` | No | `en-IN` | Sarvam recognition language |
| `MURF_API_KEY` | Yes | - | Server-only Murf TTS key |
| `MURF_VOICE_ID` | No | `Matthew` | Murf voice ID |
| `AGENT_GREETING` | No | Built-in greeting | Opening utterance |
| `PORT` | No | `8001` | FastAPI port |
| `AGENT_BACKEND_URL` | Web deploy | - | FastAPI origin used by Next rewrites |

The browser never receives the Agora certificate, Sarvam key, or Murf key.

## API Contract

- `GET /api/get_config` returns the Agora channel, RTC/RTM token, and UIDs.
- `POST /api/startAgent` accepts `{ channelName, rtcUid, userUid, parameters? }`.
- `POST /api/stopAgent` accepts `{ agentId }`.

Next.js rewrites `/api/*` to FastAPI. The start request has no runtime speech-provider option because the project always runs the Murf pipeline above.

## Commands

```bash
bun run dev
bun run doctor
bun run doctor:local
bun run verify:backend
bun run verify:web
bun run verify:local
```

Standalone tests do not call Agora cloud:

```bash
cd server && pytest tests -v
cd web && bun test
```

## Deploy

Deploy `web/` to a Next.js host and `server/` to a Python host. Set `AGENT_BACKEND_URL=https://your-fastapi-service.example.com` for the web deployment and set all server credentials only on the Python host. The backend listens on `PORT=8001` by default.

## Flow

1. The browser requests a channel and combined RTC/RTM token from `/api/get_config`.
2. It logs into RTM, joins RTC, and calls `/api/startAgent`.
3. FastAPI starts the fixed Sarvam STT, managed OpenAI, and Murf TTS agent.
4. Audio travels over RTC; transcripts, state, and metrics arrive over RTM.
5. `/api/stopAgent` stops the session and the browser releases RTC/RTM resources.

## Repository

- `server/src/agent.py`: fixed voice pipeline and session lifecycle
- `server/src/server.py`: FastAPI routes and token generation
- `web/src/lib/pipeline.ts`: immutable pipeline description used by the UI
- `web/src/services/api.ts`: browser API client
- [`ARCHITECTURE.md`](ARCHITECTURE.md): ownership and request flow
- [`server/README.md`](server/README.md): backend-only usage

## Troubleshooting

- Agent startup reports `SARVAM_API_KEY is required`: configure the Sarvam key on the backend.
- Agent startup reports `MURF_API_KEY is required`: configure the Murf key on the backend.
- Web requests return 404: set `AGENT_BACKEND_URL` to the FastAPI origin.
- Agora auth fails: verify `AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`, and Conversational AI enablement.

## License

Released under the [MIT License](LICENSE).
# murf-agent
