"use client";

import { useEffect, useState } from "react";

import { api } from "@/lib/api";

export default function Home() {
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const [features, setFeatures] = useState("1.0, 2.0, 3.0");
  const [prediction, setPrediction] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .health()
      .then(() => setBackendOk(true))
      .catch(() => setBackendOk(false));
  }, []);

  async function handlePredict() {
    setError("");
    try {
      const nums = features
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map(Number);
      const data = await api.predict({ features: nums });
      setPrediction(data.prediction);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleChat() {
    if (!message) return;
    setError("");
    setLoading(true);
    try {
      const data = await api.chat({ message });
      setReply(data.reply);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 flex flex-col gap-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">🚀 Hackathon Demo</h1>
          <p className="text-zinc-500 mt-1">주제 확정 후 화면을 교체하세요</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-3 py-1 text-sm ${
            backendOk === null
              ? "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              : backendOk
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
          }`}
        >
          {backendOk === null
            ? "백엔드 확인 중"
            : backendOk
              ? "백엔드 연결됨"
              : "백엔드 꺼짐"}
        </span>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">📈 Predict</h2>
        <input
          className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 bg-transparent"
          value={features}
          onChange={(e) => setFeatures(e.target.value)}
          placeholder="Features (쉼표 구분)"
        />
        <button
          className="self-start rounded-lg bg-foreground text-background px-4 py-2"
          onClick={handlePredict}
        >
          예측
        </button>
        {prediction !== null && <p>결과: {prediction}</p>}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">💬 Chat</h2>
        <textarea
          className="min-h-28 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 bg-transparent"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="질문"
        />
        <button
          className="self-start rounded-lg bg-foreground text-background px-4 py-2 disabled:opacity-50"
          onClick={handleChat}
          disabled={loading}
        >
          {loading ? "생각 중..." : "보내기"}
        </button>
        {reply && (
          <p className="whitespace-pre-wrap rounded-lg bg-zinc-100 p-4 dark:bg-zinc-900">
            {reply}
          </p>
        )}
      </section>

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </main>
  );
}
