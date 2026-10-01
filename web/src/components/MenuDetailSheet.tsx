"use client";

import { useState } from "react";

import { AiNotice, DietBadges } from "@/components/DietBadges";
import { SmartImage } from "@/components/SmartImage";
import { useApp } from "@/context/AppContext";
import { pickText } from "@/i18n";
import { unitPrice } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { Menu } from "@/types/models";

/** 메뉴 상세: 수량·요청사항 선택 후 장바구니 담기 */
export function MenuDetailSheet({
  menu,
  fallbackImage,
  onAdd,
  onClose,
}: {
  menu: Menu;
  fallbackImage: string;
  onAdd: (quantity: number, optionIds: string[]) => void;
  onClose: () => void;
}) {
  const { lang, t } = useApp();
  const [qty, setQty] = useState(1);
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const tr = menu.translations[lang];
  const name = tr?.name ?? menu.name_ko;

  const toggle = (id: string) => {
    const opt = menu.options.find((o) => o.id === id)!;
    setOptionIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // 맵기 옵션은 하나만
      const spicyIds = menu.options.filter((o) => o.type === "spicy").map((o) => o.id);
      const base = opt.type === "spicy" ? prev.filter((x) => !spicyIds.includes(x)) : prev;
      return [...base, id];
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="flex max-h-[92dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl bg-white"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        <div className="relative shrink-0">
          <SmartImage src={menu.image_url} fallback={fallbackImage} alt={name} className="h-52 w-full object-cover" />
          <button
            className="icon-btn absolute right-3 top-3"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <h2 className="text-2xl font-bold">{name}</h2>
          <p className="text-zinc-500">
            {menu.name_ko} <span className="text-zinc-400">· {menu.pronunciation}</span>
          </p>
          <p className="mt-1 text-lg font-semibold">{formatPrice(menu.price, lang)}</p>
          {tr?.description && <p className="mt-2 text-zinc-700">{tr.description}</p>}

          <div className="mt-4 space-y-2">
            <DietBadges menu={menu} detail />
            <AiNotice />
          </div>

          {menu.ingredients.length > 0 && (
            <p className="mt-4 text-sm text-zinc-600">
              <span className="font-semibold">{t("menu.ingredients")}</span> · {menu.ingredients.join(", ")}
            </p>
          )}

          {menu.options.length > 0 && (
            <>
              <h3 className="mt-6 font-semibold">{t("menu.options")}</h3>
              <ul className="mt-2 space-y-2">
                {menu.options.map((o) => {
                  const on = optionIds.includes(o.id);
                  return (
                    <li key={o.id}>
                      <button
                        onClick={() => toggle(o.id)}
                        className={`flex min-h-12 w-full items-center justify-between rounded-xl border-2 px-4 text-left ${
                          on ? "border-brand bg-brand-soft" : "border-zinc-200"
                        }`}
                        aria-pressed={on}
                      >
                        <span>
                          <span className="block font-medium">{pickText(o.translations, lang, o.name_ko)}</span>
                          <span className="block text-xs text-zinc-500">{o.name_ko}</span>
                        </span>
                        <span className="text-sm text-zinc-500">
                          {o.price_delta ? `+${formatPrice(o.price_delta, lang)}` : on ? "✓" : ""}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          <div className="mt-6 flex items-center justify-between">
            <span className="font-semibold">{t("menu.quantity")}</span>
            <div className="flex items-center gap-3">
              <button className="icon-btn border border-zinc-200 shadow-none" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="-">
                −
              </button>
              <span className="w-6 text-center text-lg font-bold">{qty}</span>
              <button className="icon-btn border border-zinc-200 shadow-none" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="+">
                +
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-zinc-100 p-4">
          <button className="btn-primary w-full" onClick={() => onAdd(qty, optionIds)}>
            {t("menu.addToCart", { price: formatPrice(unitPrice(menu, optionIds) * qty, lang) })}
          </button>
        </div>
      </div>
    </div>
  );
}
