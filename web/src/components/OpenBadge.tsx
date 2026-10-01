"use client";

import { useApp } from "@/context/AppContext";
import { isOpenNow, todayHours } from "@/lib/geo";
import type { OpenHours } from "@/types/models";

export function OpenBadge({ hours, withTime }: { hours: OpenHours | null; withTime?: boolean }) {
  const { t } = useApp();
  // 영업시간 정보가 없는 가게(백엔드 데이터)는 배지를 표시하지 않는다
  if (!hours) return null;
  const today = todayHours(hours);
  const open = isOpenNow(hours);
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        className={`rounded-md px-1.5 py-0.5 text-xs font-bold ${
          open ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"
        }`}
      >
        {!today ? t("store.dayOff") : open ? t("store.open") : t("store.closed")}
      </span>
      {withTime && today && (
        <span className="text-zinc-500">
          {t("store.hours", { open: today.open, close: today.close })}
        </span>
      )}
    </span>
  );
}
