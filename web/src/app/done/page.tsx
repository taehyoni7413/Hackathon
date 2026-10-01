/* eslint-disable @next/next/no-img-element -- public 의 로고 이미지를 그대로 사용 */
"use client";

import Link from "next/link";

import { useApp } from "@/context/AppContext";

/** 11. 수령 완료 */
export default function DonePage() {
  const { t } = useApp();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 bg-rice px-6 text-center">
      <img src="/logo.png" alt="" aria-hidden className="h-32 w-auto" />
      <h1 className="font-display text-4xl text-ink">{t("done.title")}</h1>
      <Link href="/map" className="btn-primary mt-6 w-full">
        {t("done.backMap")}
      </Link>
    </main>
  );
}
