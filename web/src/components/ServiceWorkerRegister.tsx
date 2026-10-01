"use client";

import { useEffect } from "react";

/** 프로덕션 빌드에서만 서비스 워커 등록 (개발 중에는 캐시 때문에 헷갈리지 않도록 끔) */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {
      // 등록 실패해도 앱은 정상 동작
    });
  }, []);
  return null;
}
