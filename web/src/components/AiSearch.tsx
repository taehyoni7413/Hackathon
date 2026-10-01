"use client";

import { useEffect, useRef, useState } from "react";

import { ArrowUp, CaretLeft, Sparkle } from "@/components/Icon";
import { SmartImage, defaultImage } from "@/components/SmartImage";
import { useApp } from "@/context/AppContext";
import { pickText, type MessageKey } from "@/i18n";
import { recommendMenus, type Recommendation } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import type { StoreWithMenus } from "@/types/models";

const EXAMPLES: MessageKey[] = ["ai.ex1", "ai.ex2", "ai.ex3"];

/** 예시 문구를 몇 초마다 바꿔 보여 준다 (반투명 안내 글씨) */
function useRotatingExample(active = true) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setI((n) => (n + 1) % EXAMPLES.length), 2600);
    return () => clearInterval(id);
  }, [active]);
  return EXAMPLES[i];
}

/** 지도 맨 위 AI 검색 막대 (네이버 지도 검색창처럼). 누르면 AiSearchSheet 가 열린다 */
export function AiSearchBar({ onOpen }: { onOpen: () => void }) {
  const { t } = useApp();
  const example = useRotatingExample();
  return (
    <button
      onClick={onOpen}
      className="flex h-12 w-full items-center gap-2.5 rounded-full bg-white px-4 text-left shadow-md ring-1 ring-black/5 transition active:scale-[0.99]"
      aria-label={t("ai.label")}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand text-white">
        <Sparkle weight="fill" />
      </span>
      <span key={example} className="min-w-0 flex-1 animate-[fade-in_0.4s_ease] truncate text-zinc-400">
        {t(example)}
      </span>
      <span className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-bold text-brand-dark">AI</span>
    </button>
  );
}

type Phase = "idle" | "loading" | "done" | "error";

/** AI 맞춤 추천 화면: 손님 말 → 우리 가게 메뉴 중에서 추천 → 메뉴를 누르면 그 가게로 */
export function AiSearchSheet({
  stores,
  onClose,
  onPick,
}: {
  stores: StoreWithMenus[];
  onClose: () => void;
  onPick: (storeId: string) => void;
}) {
  const { lang, t } = useApp();
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [items, setItems] = useState<Recommendation[]>([]);
  const [keywordOnly, setKeywordOnly] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const example = useRotatingExample(!query);

  useEffect(() => input.current?.focus(), []);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || phase === "loading") return;
    setQuery(text);
    input.current?.blur();
    setPhase("loading");
    const r = await recommendMenus(text, lang);
    if (!r) {
      setPhase("error");
      return;
    }
    // 앱에 불러온 가게 메뉴에 있는 것만 (사진·번역 이름을 보여 주기 위해)
    setItems(r.items.filter((i) => stores.some((s) => s.id === i.store_id && s.menus.some((m) => m.id === i.menu_id))));
    setKeywordOnly(r.source === "keyword");
    setPhase("done");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-modal aria-label={t("ai.label")}>
      {/* 검색 줄 */}
      <form
        className="flex items-center gap-2 border-b border-black/5 px-2 pb-3 pt-safe"
        onSubmit={(e) => {
          e.preventDefault();
          void ask(query);
        }}
      >
        <button type="button" className="icon-btn shrink-0 shadow-none" onClick={onClose} aria-label={t("common.back")}>
          <CaretLeft weight="bold" />
        </button>
        <div className="relative flex h-12 min-w-0 flex-1 items-center rounded-full bg-zinc-100 pl-4 pr-1.5">
          <Sparkle weight="fill" className="mr-2 shrink-0 text-brand" />
          <input
            ref={input}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={120}
            enterKeyHint="search"
            className="h-full min-w-0 flex-1 bg-transparent text-base text-ink outline-none"
            aria-label={t("ai.title")}
          />
          {!query && (
            <span key={example} className="pointer-events-none absolute left-11 animate-[fade-in_0.4s_ease] text-zinc-400">
              {t(example)}
            </span>
          )}
          <button
            type="submit"
            disabled={!query.trim() || phase === "loading"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand text-white transition active:scale-95 disabled:bg-zinc-300"
            aria-label={t("ai.submit")}
          >
            <ArrowUp weight="bold" />
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto px-4 pb-safe">
        {phase === "idle" && (
          <div className="pt-6">
            <h2 className="font-display text-3xl leading-tight text-ink">{t("ai.title")}</h2>
            <p className="mt-1 text-zinc-500">{t("ai.subtitle")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {EXAMPLES.map((k) => (
                <button
                  key={k}
                  onClick={() => void ask(t(k))}
                  className="rounded-full bg-brand-soft px-4 py-2.5 font-semibold text-brand-dark transition active:scale-95"
                >
                  {t(k)}
                </button>
              ))}
            </div>
          </div>
        )}

        {phase === "loading" && (
          <div className="flex flex-col items-center gap-3 pt-20 text-zinc-500">
            <Sparkle weight="fill" className="animate-pulse text-5xl text-brand" />
            <p>{t("ai.loading")}…</p>
          </div>
        )}

        {phase === "error" && <p className="pt-16 text-center text-zinc-500">{t("ai.error")}</p>}

        {phase === "done" && items.length === 0 && (
          <p className="pt-16 text-center text-zinc-500">{t("ai.empty")}</p>
        )}

        {phase === "done" && items.length > 0 && (
          <>
            <h2 className="mt-5 font-display text-2xl text-ink">{t("ai.results")}</h2>
            <p className="text-sm text-zinc-500">{keywordOnly ? t("ai.keyword") : t("ai.tapHint")}</p>
            <ul className="mt-3 space-y-3 pb-4">
              {items.map((it) => {
                const store = stores.find((s) => s.id === it.store_id)!;
                const menu = store.menus.find((m) => m.id === it.menu_id)!;
                const name = menu.translations[lang]?.name ?? menu.name_ko;
                return (
                  <li key={it.menu_id}>
                    <button
                      onClick={() => onPick(store.id)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm ring-1 ring-black/5 transition active:scale-[0.99] active:bg-rice"
                    >
                      <SmartImage
                        src={menu.image_url}
                        fallback={defaultImage(store.category)}
                        alt={name}
                        className="h-20 w-20 shrink-0 rounded-xl bg-rice object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[17px] font-bold text-ink">{name}</p>
                        <p className="truncate text-sm text-zinc-500">
                          {pickText(store.name, lang, store.name_ko)} · {formatPrice(menu.price, lang)}
                        </p>
                        {it.reason && (
                          <p className="mt-1 line-clamp-2 text-sm leading-snug text-brand-dark">
                            <Sparkle weight="fill" className="mr-1 inline align-[-2px]" />
                            {it.reason}
                          </p>
                        )}
                      </div>
                      <CaretLeft weight="bold" className="shrink-0 rotate-180 text-zinc-300" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
