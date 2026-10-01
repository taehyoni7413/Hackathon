/* eslint-disable @next/next/no-img-element -- public 의 로고 이미지를 그대로 사용 */
"use client";

import { Check } from "@/components/Icon";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApp } from "@/context/AppContext";
import { DEFAULT_LANG, LANGS, translate, type Lang } from "@/i18n";

/**
 * 2. 언어 선택: 각 언어가 자기 말로 인사하는 카드. 고른 언어로 화면 문구가 바로 바뀐다.
 * 기본 선택은 DEFAULT_LANG(한국어).
 */
export default function LanguagePage() {
  const router = useRouter();
  const { lang, langChosen, setLang } = useApp();
  const [selected, setSelected] = useState<Lang>(langChosen ? lang : DEFAULT_LANG);

  return (
    <main className="flex flex-1 flex-col bg-rice px-6 pb-8 pt-12">
      <img src="/logo-full.png" alt="BUK" className="h-28 w-auto self-start" />

      <h1 className="mt-8 font-display text-3xl leading-tight text-ink">
        {translate(selected, "lang.title")}
      </h1>
      <p className="mt-1 text-zinc-600">{translate(selected, "lang.subtitle")}</p>

      <ul className="mt-6 flex flex-col gap-3" role="radiogroup">
        {LANGS.map((l) => {
          const active = selected === l.code;
          return (
            <li key={l.code}>
              <button
                role="radio"
                aria-checked={active}
                lang={l.code}
                onClick={() => setSelected(l.code)}
                className={`flex min-h-20 w-full items-center justify-between rounded-2xl px-5 text-left transition ${
                  active
                    ? "bg-ink text-white shadow-lg"
                    : "bg-white text-ink ring-1 ring-zinc-200"
                }`}
              >
                <span>
                  <span className="block font-display text-3xl leading-none">{l.greeting}</span>
                  <span className={`mt-1 block text-sm ${active ? "text-white/70" : "text-zinc-500"}`}>
                    {l.label}
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-base font-bold ${
                    active ? "bg-brand text-white" : "ring-2 ring-zinc-200"
                  }`}
                >
                  {active && <Check weight="bold" />}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <button
        className="btn-primary mt-auto w-full text-lg"
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
