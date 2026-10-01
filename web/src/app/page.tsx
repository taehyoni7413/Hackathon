/* eslint-disable @next/next/no-img-element -- 로고 파일이 없을 때 텍스트 로고로 바꾸기 위해 img 사용 */
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useApp } from "@/context/AppContext";

const SPLASH_MS = 1500;

/** 1. 스플래시: 로고 1.5초 → 언어를 고른 적 있으면 지도, 없으면 언어 선택 */
export default function SplashPage() {
  const router = useRouter();
  const { ready, langChosen, t } = useApp();
  const [logoFailed, setLogoFailed] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setTimeUp(true), SPLASH_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (timeUp && ready) router.replace(langChosen ? "/map" : "/language");
  }, [timeUp, ready, langChosen, router]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-brand px-6 text-white">
      {logoFailed ? (
        <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-white text-6xl shadow-lg">
          🍚
        </div>
      ) : (
        <img
          src="/logo.png"
          alt={t("app.name")}
          className="h-32 w-32 object-contain"
          onError={() => setLogoFailed(true)}
        />
      )}
      <h1 className="text-3xl font-extrabold tracking-tight">{t("app.name")}</h1>
      <p className="text-center text-white/90">{t("app.tagline")}</p>
    </main>
  );
}
