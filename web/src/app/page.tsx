/* eslint-disable @next/next/no-img-element -- 로고 파일이 없을 때 텍스트 로고로 바꾸기 위해 img 사용 */
"use client";

import { BowlSteam } from "@/components/Icon";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useApp } from "@/context/AppContext";

const SPLASH_MS = 2000;

/** 1. 스플래시: 로고가 튀어 오르는 효과 2초 → 언어를 고른 적 있으면 지도, 없으면 언어 선택 */
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
    <main className="splash-bg relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6">
      <div className="relative flex h-44 w-44 items-center justify-center">
        {/* 로고 뒤로 한 번 퍼지는 빛 고리 */}
        <span className="splash-ring absolute inset-0 rounded-full border-4 border-brand/40" aria-hidden />
        <span className="splash-glow absolute inset-4 rounded-full bg-brand/15 blur-xl" aria-hidden />
        {logoFailed ? (
          <span className="splash-pop relative flex h-28 w-28 items-center justify-center rounded-3xl bg-white text-6xl text-ink shadow-lg">
            <BowlSteam />
          </span>
        ) : (
          <img
            src="/logo.png"
            alt={t("app.name")}
            className="splash-pop relative h-36 w-auto drop-shadow-[0_10px_18px_rgba(236,138,51,0.35)]"
            onError={() => setLogoFailed(true)}
          />
        )}
      </div>
      <h1 className="splash-rise mt-2 font-display text-6xl tracking-wide text-ink" style={{ animationDelay: "0.45s" }}>
        {t("app.name")}
      </h1>
      <p className="splash-rise mt-2 text-center text-zinc-600" style={{ animationDelay: "0.65s" }}>
        {t("app.tagline")}
      </p>
    </main>
  );
}
