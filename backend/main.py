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


@router.post("/chat")
def chat(req: ChatRequest):
    try:
        return {"reply": llm.ask(req.message, system=req.system)}
    except llm.LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))


app.include_router(router)
