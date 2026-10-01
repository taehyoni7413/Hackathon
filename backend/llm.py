"""OpenAI API 호출 래퍼 (주최 측 제공 공용 키, 사용 가능 모델: gpt-6-luna, text-embedding-3-small)."""
import os

import openai
from dotenv import load_dotenv

load_dotenv()

MODEL = os.getenv("OPENAI_MODEL", "gpt-6-luna")
EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
# MOCK_LLM=1 이면 API 호출 없이 가짜 응답 (키 없이 개발, 공용 키 한도 USD 100 절약)
MOCK = os.getenv("MOCK_LLM", "0") == "1"

_client: openai.OpenAI | None = None


class LLMError(Exception):
    pass


def _get_client() -> openai.OpenAI:
    global _client
    if _client is None:
        # 환경변수 복사 과정에서 섞일 수 있는 BOM·공백·줄바꿈 제거
        key = (os.getenv("OPENAI_API_KEY") or "").strip().lstrip("﻿").strip()
        try:
            _client = openai.OpenAI(api_key=key or None)
        except openai.OpenAIError as e:
            raise LLMError("OPENAI_API_KEY 가 설정되지 않았습니다") from e
    return _client


def _call(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except openai.RateLimitError as e:
        raise LLMError("요청 한도 초과 (공용 키 사용량 확인 필요)") from e
    except openai.APIStatusError as e:
        raise LLMError(f"API 오류 ({e.status_code}): {e.message}") from e
    except openai.APIConnectionError as e:
        raise LLMError("API 연결 실패") from e
    except Exception as e:  # 예상 못 한 오류도 500 대신 502 + 이유로
        raise LLMError(f"AI 호출 실패: {type(e).__name__}") from e


def ask(prompt: str, system: str | None = None) -> str:
    """단일 질문 → 텍스트 응답."""
    if MOCK:
        return f"[MOCK] '{prompt}' 에 대한 가짜 응답입니다."

    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = _call(
        _get_client().chat.completions.create, model=MODEL, messages=messages
    )
    return response.choices[0].message.content or ""


def embed(texts: list[str]) -> list[list[float]]:
    """텍스트 목록 → 임베딩 벡터 목록 (검색·유사도용)."""
    if MOCK:
        return [[0.0] * 1536 for _ in texts]

    response = _call(
        _get_client().embeddings.create, model=EMBEDDING_MODEL, input=texts
    )
    return [d.embedding for d in response.data]
