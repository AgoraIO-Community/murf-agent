# Agora Murf Agent Service

FastAPI backend for the standalone Murf voice agent.

## Pipeline

- `SarvamSTT`: `SARVAM_LANGUAGE=en-IN` by default; requires `SARVAM_API_KEY`
- managed `OpenAI`: `gpt-4o-mini`
- `MurfTTS`: `MURF_VOICE_ID=Matthew` by default, `FALCON`, `en-US`, 24 kHz; requires `MURF_API_KEY`

The pipeline is fixed in `src/agent.py`. `POST /startAgent` does not accept or return a provider choice.

## Configure

Use `.env.example` as the shape for a local `.env.local`, then supply real values through your local secret-management workflow. Never commit `.env.local`.

Required:

- `AGORA_APP_ID`
- `AGORA_APP_CERTIFICATE`
- `SARVAM_API_KEY`
- `MURF_API_KEY`

Optional:

- `SARVAM_LANGUAGE` (default `en-IN`)
- `MURF_VOICE_ID` (default `Matthew`)
- `AGENT_GREETING`
- `PORT` (default `8001`)

The older `APP_ID` and `APP_CERTIFICATE` aliases remain accepted for Agora CLI compatibility.

## Run

From the repository root:

```bash
bun run setup:backend
bun run dev:backend
```

Or from `server/` with an existing virtual environment:

```bash
source venv/bin/activate
python src/server.py
```

## API

```bash
curl http://localhost:8001/get_config

curl -X POST http://localhost:8001/startAgent \
  -H "Content-Type: application/json" \
  -d '{"channelName":"test-channel","rtcUid":123456,"userUid":789012}'

curl -X POST http://localhost:8001/stopAgent \
  -H "Content-Type: application/json" \
  -d '{"agentId":"agent-id-from-start"}'
```

## Checks

```bash
python3 -m py_compile src/server.py src/agent.py
pytest tests -v
```

The repository smoke harness substitutes `scripts/run_fake_server.py`, so route checks do not start a real Agora agent.
