"""FastAPI 백엔드 진입점.

실행: uvicorn backend.main:app --reload
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend import llm

app = FastAPI(title="Hackathon API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    features: list[float]


class ChatRequest(BaseModel):
    message: str
    system: str | None = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(req: PredictRequest):
    # TODO: 주제 확정 후 ml/train.py 로 학습한 모델을 로드해 교체
    if not req.features:
        raise HTTPException(status_code=400, detail="features is empty")
    return {"prediction": sum(req.features) / len(req.features)}


@app.post("/chat")
def chat(req: ChatRequest):
    try:
        return {"reply": llm.ask(req.message, system=req.system)}
    except llm.LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))
