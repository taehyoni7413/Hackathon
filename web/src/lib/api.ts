// 백엔드 API 클라이언트.
// docs/api-contract.md 의 계약과 타입을 1:1 로 맞춰서 관리하세요.

export type PredictRequest = { features: number[] };
export type PredictResponse = { prediction: number };

export type ChatRequest = { message: string; system?: string };
export type ChatResponse = { reply: string };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }
  return res.json();
}

export const api = {
  health: () => request<{ status: string }>("/health"),
  predict: (body: PredictRequest) =>
    request<PredictResponse>("/predict", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  chat: (body: ChatRequest) =>
    request<ChatResponse>("/chat", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
