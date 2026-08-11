# Fixed Murf Agent Config

> Read this when changing the prompt, greeting, VAD, fixed speech pipeline, or session options.

All runtime agent configuration lives in `server/src/agent.py`. The browser sends `{ channelName, rtcUid, userUid, parameters? }` to `POST /startAgent`; it cannot choose a speech provider.

## Pipeline

```python
from agora_agent.agentkit.vendors import MurfTTS, OpenAI, SarvamSTT

stt = SarvamSTT(
    api_key=_required_env("SARVAM_API_KEY"),
    language=os.getenv("SARVAM_LANGUAGE", "en-IN"),
)
llm = OpenAI(model="gpt-4o-mini", ...)
tts = MurfTTS(
    key=_required_env("MURF_API_KEY"),
    voice_id=os.getenv("MURF_VOICE_ID", "Matthew"),
    base_url="wss://global.api.murf.ai/v1/speech/stream-input",
    locale="en-US",
    model="FALCON",
    sample_rate=24000,
    rate=0,
    pitch=0,
)

agora_agent = AgoraAgent(...).with_stt(stt).with_llm(llm).with_tts(tts)
```

Sarvam and Murf credentials are required when `Agent.start` builds the session. Managed OpenAI does not require an application-provided OpenAI key.

## Agent Options

- `ADA_PROMPT` defines the system instructions.
- `AGENT_GREETING` overrides the opening utterance.
- `turn_detection` controls VAD sensitivity, interruption, prefix padding, and silence duration.
- `parameters` enables RTM data, metrics, and error messages; `output_audio_codec` may be forwarded from the start request.
- `advanced_features` enables RTM and tools.
- Sessions use numeric UIDs, a 30-second idle timeout, and a one-hour expiry.

## Response

`Agent.start` returns only:

```json
{
  "agent_id": "string",
  "channel_name": "string",
  "status": "started"
}
```

The session is retained by `agent_id` for stop. `Agent.stop` uses the active session first and falls back to `AsyncAgora.stop_agent` when needed.

## UI Descriptor

`web/src/lib/pipeline.ts` contains the immutable labels shown in the browser. It does not configure the backend. Keep it accurate whenever pipeline defaults change.

## Verification

```bash
bun run verify:backend
cd server && pytest tests -v
cd web && bun test
bun run verify:web:api
```
