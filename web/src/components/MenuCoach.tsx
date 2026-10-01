"use client";

import { useState } from "react";

import { useApp } from "@/context/AppContext";
import { getMenuInsight, type MenuInsight } from "@/lib/api";
import type { Menu } from "@/types/models";

/** AI 메뉴 코치: "이 메뉴가 나에게 맞을까?" 버튼 → 요약·추천 대상·주의 (사용자 언어) */
export function MenuCoach({ menu }: { menu: Menu }) {
  const { lang, t } = useApp();
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [insight, setInsight] = useState<MenuInsight | null>(null);

  const ask = async () => {
    setState("loading");
    const r = await getMenuInsight(menu.store_id, menu.id, lang);
    setInsight(r);
    setState(r ? "done" : "error");
  };

  return (
    <section className="mt-5 rounded-2xl bg-brand-soft p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-brand-dark">🤖 {t("coach.label")}</p>
          <p className="font-semibold">{t("coach.question")}</p>
        </div>
        {state !== "done" && (
          <button
            className="shrink-0 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            onClick={ask}
            disabled={state === "loading"}
          >
            {state === "loading" ? t("coach.loading") : state === "error" ? t("coach.retry") : t("coach.ask")}
          </button>
        )}
      </div>
      {state === "error" && <p className="mt-2 text-sm text-zinc-600">{t("coach.error")}</p>}
      {state === "done" && insight && (
        <dl className="mt-3 space-y-2 text-sm">
          {(
            [
              ["coach.summary", insight.summary],
              ["coach.goodFor", insight.recommended_for],
              ["coach.notice", insight.notice],
            ] as const
          ).map(([k, v]) => (
            <div key={k}>
              <dt className="font-semibold text-zinc-800">{t(k)}</dt>
              <dd className="text-zinc-700">{v}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
