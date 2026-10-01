"use client";

import Link from "next/link";

import { useApp } from "@/context/AppContext";

/** 11. 수령 완료 */
export default function DonePage() {
  const { t } = useApp();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-7xl" aria-hidden>
        😋
      </p>
      <h1 className="text-3xl font-extrabold">{t("done.title")}</h1>
      <Link href="/map" className="btn-primary mt-6 w-full">
        {t("done.backMap")}
      </Link>
    </main>
  );
}
