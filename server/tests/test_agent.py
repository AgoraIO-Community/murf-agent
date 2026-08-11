"""Agent env validation and fixed pipeline wiring (SDK session monkeypatched)."""
import asyncio
import sys

import pytest


def _fresh_agent_module():
    sys.modules.pop("agent", None)
    import agent

    return agent


@pytest.mark.parametrize(
    "missing", ["AGORA_APP_ID", "AGORA_APP_CERTIFICATE"]
)
def test_agent_requires_env(fake_env, monkeypatch, missing):
    monkeypatch.delenv(missing, raising=False)
    agent = _fresh_agent_module()
    with pytest.raises(ValueError):
        agent.Agent()


def test_agent_constructs_with_full_env(fake_env):
    agent = _fresh_agent_module()
    instance = agent.Agent()
    assert instance.app_id == "0123456789abcdef0123456789abcdef"
    assert instance.client is not None


def test_agent_accepts_cli_quickstart_env_names(fake_env, monkeypatch):
    monkeypatch.setenv("APP_ID", fake_env["AGORA_APP_ID"])
    monkeypatch.setenv("APP_CERTIFICATE", fake_env["AGORA_APP_CERTIFICATE"])
    monkeypatch.delenv("AGORA_APP_ID")
    monkeypatch.delenv("AGORA_APP_CERTIFICATE")

    agent = _fresh_agent_module()
    instance = agent.Agent()

    assert instance.app_id == fake_env["AGORA_APP_ID"]
    assert instance.client is not None


def test_agent_ignores_placeholder_primary_credentials(fake_env, monkeypatch):
    monkeypatch.setenv("AGORA_APP_ID", "your_agora_app_id")
    monkeypatch.setenv("AGORA_APP_CERTIFICATE", "your_agora_app_certificate")
    monkeypatch.setenv("APP_ID", fake_env["AGORA_APP_ID"])
    monkeypatch.setenv("APP_CERTIFICATE", fake_env["AGORA_APP_CERTIFICATE"])

    agent = _fresh_agent_module()
    instance = agent.Agent()

    assert instance.app_id == fake_env["AGORA_APP_ID"]
    assert instance.app_certificate == fake_env["AGORA_APP_CERTIFICATE"]


def test_start_wires_fixed_pipeline_and_returns_shape(fake_env, monkeypatch):
    agent = _fresh_agent_module()
    captured = {}

    class FakeSession:
        async def start(self):
            return "test-agent-id"

        async def stop(self):
            captured["stopped"] = True

    def fake_create_async_session(self, **kwargs):
        captured["llm"] = self.llm
        captured["stt"] = self.stt
        captured["tts"] = self.tts
        captured["channel"] = kwargs.get("channel")
        captured["remote_uids"] = kwargs.get("remote_uids")
        return FakeSession()

    from agora_agent.agentkit import Agent as AgoraAgent

    monkeypatch.setattr(AgoraAgent, "create_async_session", fake_create_async_session)

    instance = agent.Agent()
    result = asyncio.run(
        instance.start(
            channel_name="ch",
            agent_uid=111,
            user_uid=222,
        )
    )

    assert result == {
        "agent_id": "test-agent-id",
        "channel_name": "ch",
        "status": "started",
    }
    # The LLM stage is the managed OpenAI vendor (gpt-4o-mini), NOT CustomLLM.
    assert captured["llm"]["url"] == "https://api.openai.com/v1/chat/completions"
    assert captured["llm"]["params"]["model"] == "gpt-4o-mini"
    assert captured["llm"]["style"] == "openai"
    assert "vendor" not in captured["llm"]  # managed OpenAI has no custom vendor key
    assert captured["stt"]["vendor"] == "sarvam"
    assert captured["stt"]["params"]["api_key"] == "test-sarvam-key"
    assert captured["stt"]["params"]["language"] == "en-IN"
    assert captured["tts"] == {
        "vendor": "murf",
        "params": {
            "api_key": "test-murf-key",
            "voiceId": "Matthew",
            "base_url": "wss://global.api.murf.ai/v1/speech/stream-input",
            "locale": "en-US",
            "rate": 0.0,
            "pitch": 0.0,
            "model": "FALCON",
            "sample_rate": 24000,
        },
    }
    assert captured["channel"] == "ch"
    assert captured["remote_uids"] == ["222"]


@pytest.mark.parametrize("missing", ["SARVAM_API_KEY", "MURF_API_KEY"])
def test_start_requires_pipeline_credentials(fake_env, monkeypatch, missing):
    agent = _fresh_agent_module()
    monkeypatch.delenv(missing)

    with pytest.raises(ValueError, match=missing):
        asyncio.run(
            agent.Agent().start(
                channel_name="ch",
                agent_uid=111,
                user_uid=222,
            )
        )


def test_start_validates_arguments(fake_env, monkeypatch):
    agent = _fresh_agent_module()
    from agora_agent.agentkit import Agent as AgoraAgent

    monkeypatch.setattr(AgoraAgent, "create_async_session", lambda self, **k: None)
    instance = agent.Agent()
    with pytest.raises(ValueError):
        asyncio.run(instance.start(channel_name="", agent_uid=1, user_uid=2))
    with pytest.raises(ValueError):
        asyncio.run(instance.start(channel_name="c", agent_uid=0, user_uid=2))


def test_stop_uses_active_session_then_falls_back(fake_env, monkeypatch):
    agent = _fresh_agent_module()

    class FakeSession:
        def __init__(self):
            self.stopped = False

        async def start(self):
            return "agent-xyz"

        async def stop(self):
            self.stopped = True

    session = FakeSession()
    from agora_agent.agentkit import Agent as AgoraAgent

    monkeypatch.setattr(AgoraAgent, "create_async_session", lambda self, **k: session)
    instance = agent.Agent()

    fallback_calls = []

    async def fake_stop_agent(agent_id):
        fallback_calls.append(agent_id)

    monkeypatch.setattr(instance.client, "stop_agent", fake_stop_agent)

    asyncio.run(instance.start(channel_name="ch", agent_uid=111, user_uid=222))
    asyncio.run(instance.stop("agent-xyz"))
    assert session.stopped is True
    assert fallback_calls == []

    asyncio.run(instance.stop("unknown-id"))
    assert fallback_calls == ["unknown-id"]
