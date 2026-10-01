"""Claude API 호출 래퍼."""
import os

import anthropic
from dotenv import load_dotenv

load_dotenv()

MODEL = os.getenv("CLAUDE_MODEL", "claude-opus-5-5")

_client: anthropic.Anthropic | None = None


class LLMError(Exception):
    pass


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic()  # ANTHROPIC_API_KEY 환경변수 사용
    return _client


def ask(prompt: str, system: str | None = None, effort: str = "medium") -> str:
    """단일 질문 → 텍스트 응답. effort: low / medium / high / xhigh / max"""
    kwargs = {}
    if system:
        kwargs["system"] = system
    try:
        response = _get_client().beta.messages.create(
            model=MODEL,
            max_tokens=16000,
            output_config={"effort": effort},
            # 안전 분류기가 거절하면 서버가 자동으로 다른 모델로 이어서 응답
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            messages=[{"role": "user", "content": prompt}],
            **kwargs,
        )
    except anthropic.RateLimitError as e:
        raise LLMError("요청 한도 초과, 잠시 후 다시 시도하세요") from e
    except anthropic.APIStatusError as e:
        raise LLMError(f"API 오류 ({e.status_code}): {e.message}") from e
    except anthropic.APIConnectionError as e:
        raise LLMError("API 연결 실패") from e

    if response.stop_reason == "refusal":
        raise LLMError("모델이 요청을 거절했습니다")

    return "".join(b.text for b in response.content if b.type == "text")
