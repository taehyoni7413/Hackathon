"""FastAPI 백엔드 진입점.

로컬 실행: uvicorn backend.main:app --reload
모든 엔드포인트는 /api 아래에 있다. Vercel은 /api/* 요청을 경로 그대로(/api/health) 이 서비스로 보내고,
로컬에서는 Next.js(next.config.ts)가 /api/* 를 같은 경로로 전달한다.
"""
from fastapi import APIRouter, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend import llm

app = FastAPI(title="Hackathon API", docs_url="/api/docs", openapi_url="/api/openapi.json")

# 프론트는 같은 도메인의 /api/* 로 호출하므로 보통 불필요. 직접 호출 테스트용으로 열어둠
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/api")


class PredictRequest(BaseModel):
    features: list[float]


class ChatRequest(BaseModel):
    message: str
    system: str | None = None


@router.get("/health")
def health():
    return {"status": "ok"}


@router.post("/predict")
def predict(req: PredictRequest):
    # TODO: 주제 확정 후 ml/train.py 로 학습한 모델을 로드해 교체
    if not req.features:
        raise HTTPException(status_code=400, detail="features is empty")
    return {"prediction": sum(req.features) / len(req.features)}


MAX_REQUEST_CHARS = 200

TRANSLATE_SYSTEM = (
    "You translate a restaurant customer's spoken request into natural, polite Korean "
    "that a Korean restaurant owner can read at a glance. "
    "The customer is an international student ordering food. "
    "Output only the Korean sentence, ending in a polite request form such as '~해주세요' or '~있나요?'. "
    "Keep food and ingredient words concrete. No quotes, no explanations."
)


class TranslateRequest(BaseModel):
    text: str
    # 말한 언어 (BCP-47, 예: zh-CN, vi-VN, ko-KR) 또는 "auto"(직접 입력). 한국어면 번역하지 않음
    lang: str | None = None


@router.post("/translate")
def translate(req: TranslateRequest):
    """주문 요청사항(사용자 언어) → 사장님께 보여줄 한국어 문장"""
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is empty")
    if len(text) > MAX_REQUEST_CHARS:
        raise HTTPException(status_code=400, detail=f"text is longer than {MAX_REQUEST_CHARS} chars")
    if (req.lang or "").lower().startswith("ko"):
        return {"ko": text}
    try:
        ko = llm.ask(text, system=TRANSLATE_SYSTEM).strip()
    except llm.LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {"ko": ko}


@router.post("/chat")
def chat(req: ChatRequest):
    try:
        return {"reply": llm.ask(req.message, system=req.system)}
    except llm.LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))


app.include_router(router)
