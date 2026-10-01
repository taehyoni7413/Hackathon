"use client";

import { BeerStein, Info, Pepper, Pig, SealCheck } from "@/components/Icon";
import { useApp } from "@/context/AppContext";
import type { MessageKey } from "@/i18n";
import type { Menu, Tri } from "@/types/models";

type Tone = "bad" | "good" | "warn" | "neutral";

const TONE: Record<Tone, string> = {
  bad: "bg-red-50 text-red-700 ring-red-200",
  good: "bg-leaf-soft text-leaf ring-leaf/30",
  warn: "bg-amber-50 text-amber-800 ring-amber-200",
  neutral: "bg-zinc-100 text-zinc-700 ring-zinc-200",
};

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold ring-1 ${TONE[tone]}`}>
      {children}
    </span>
  );
}

/** 맵기: 고추 아이콘 n개 */
function Peppers({ n }: { n: number }) {
  return (
    <span className="inline-flex" aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <Pepper key={i} className="-mx-px" />
      ))}
    </span>
  );
}

/** 비건: yes / no / unknown("확인 필요") */
function TriBadge({ label, value }: { label: string; value: Tri }) {
  const { t } = useApp();
  if (value === "yes") return <Badge tone="good"><SealCheck /> {label}</Badge>;
  if (value === "no") return <Badge tone="neutral">{label}: {t("diet.no")}</Badge>;
  return <Badge tone="warn">{label}: {t("diet.unknown")}</Badge>;
}

/**
 * 메뉴 식단 배지. detail이면 전부(할랄·비건 아님/확인 필요, 알레르기 포함),
 * 목록에서는 판단에 바로 쓰이는 것만: 돼지고기·술(주의), 비건 가능(안심), 맵기
 */
export function DietBadges({ menu, detail }: { menu: Menu; detail?: boolean }) {
  const { t } = useApp();
  if (!detail) {
    return (
      <div className="flex flex-wrap gap-1">
        {menu.contains_pork === true && <Badge tone="bad"><Pig /> {t("diet.pork")}</Badge>}
        {menu.contains_alcohol === true && <Badge tone="bad"><BeerStein /> {t("diet.alcohol")}</Badge>}
        {menu.vegan === "yes" && <Badge tone="good"><SealCheck /> {t("diet.vegan")}</Badge>}
        {menu.spicy > 0 && (
          <Badge tone={menu.spicy >= 2 ? "bad" : "neutral"}>
            <Peppers n={menu.spicy} /> {t(`diet.spicy${menu.spicy}` as MessageKey)}
          </Badge>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {menu.contains_pork === true && <Badge tone="bad"><Pig /> {t("diet.pork")}</Badge>}
      {menu.contains_pork === false && <Badge tone="good">{t("diet.noPork")}</Badge>}
      {menu.contains_pork === null && <Badge tone="warn"><Pig /> {t("diet.porkUnknown")}</Badge>}
      {menu.contains_alcohol === true && <Badge tone="bad"><BeerStein /> {t("diet.alcohol")}</Badge>}
      <TriBadge label={t("diet.vegan")} value={menu.vegan} />
      <Badge tone={menu.spicy >= 2 ? "bad" : "neutral"}>
        <Peppers n={Math.max(1, menu.spicy)} /> {t(`diet.spicy${menu.spicy}` as MessageKey)}
      </Badge>
      {detail && menu.allergens.length > 0 && (
        <Badge tone="warn">{t("diet.allergens", { list: menu.allergens.join(", ") })}</Badge>
      )}
    </div>
  );
}

export function AiNotice() {
  const { t } = useApp();
  return <p className="text-xs text-zinc-500"><Info className="mr-0.5 inline align-[-3px]" />{t("menu.aiNotice")}</p>;
}
