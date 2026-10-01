"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApp } from "@/context/AppContext";
import { LANGS, translate, type Lang } from "@/i18n";

/** 2. 언어 선택: 첫 번째 언어(简体中文)를 기본으로 강조 */
export default function LanguagePage() {
  const router = useRouter();
  const { lang, langChosen, setLang } = useApp();
  const [selected, setSelected] = useState<Lang>(langChosen ? lang : LANGS[0].code);

  return (
    <main className="flex flex-1 flex-col px-6 pb-8 pt-16">
      <span className="text-5xl" aria-hidden>
        🌏
      </span>
      {/* 고른 언어로 바로 바뀌어 보이도록 selected 기준으로 번역 */}
      <h1 className="mt-4 text-2xl font-bold">{translate(selected, "lang.title")}</h1>
      <p className="mt-1 text-zinc-500">{translate(selected, "lang.subtitle")}</p>

      <ul className="mt-8 flex flex-col gap-3" role="radiogroup">
        {LANGS.map((l) => {
          const active = selected === l.code;
          return (
            <li key={l.code}>
              <button
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(l.code)}
                className={`flex min-h-16 w-full items-center justify-between rounded-2xl border-2 px-5 text-left text-lg font-semibold transition ${
                  active
                    ? "border-brand bg-brand-soft text-brand-dark"
                    : "border-zinc-200 bg-white text-zinc-800"
                }`}
              >
                {l.label}
                {active && <span aria-hidden>✓</span>}
              </button>
            </li>
          );
        })}
      </ul>

      <button
        className="btn-primary mt-auto w-full"
        onClick={() => {
          setLang(selected);
          router.replace("/map");
        }}
      >
        {translate(selected, "lang.continue")}
      </button>
    </main>
  );
}
