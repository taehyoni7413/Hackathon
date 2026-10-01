"use client";

import { OpenBadge } from "@/components/OpenBadge";
import { SmartImage, defaultImage } from "@/components/SmartImage";
import { useApp } from "@/context/AppContext";
import { pickText, type MessageKey } from "@/i18n";
import { formatDistance, formatMinutes, walkSeconds } from "@/lib/geo";
import type { Store } from "@/types/models";

/** 학생 검증 배지 자리 (나중에 verifications 데이터가 오면 표시) */
export function VerificationBadges({ store }: { store: Store }) {
  const { t } = useApp();
  if (!store.verifications?.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {store.verifications.map((v) => (
        <span key={v.type} className="rounded-md bg-sky-50 px-1.5 py-0.5 text-xs text-sky-700">
          ✓ {t("store.verified")} · {v.type} {v.count}
        </span>
      ))}
    </div>
  );
}

export function StoreCard({
  store,
  distance,
  onClick,
}: {
  store: Store;
  distance: number;
  onClick: () => void;
}) {
  const { lang, t } = useApp();
  const name = pickText(store.name, lang, store.name_ko);
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-rice"
    >
      <SmartImage
        src={store.image_url}
        fallback={defaultImage(store.category)}
        alt={name}
        className="h-[72px] w-[72px] shrink-0 rounded-2xl bg-rice object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px] font-bold text-ink">{name}</p>
        {name !== store.name_ko && (
          <p className="truncate text-sm text-zinc-500">{store.name_ko}</p>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500">
          <span>{t(`cat.${store.category}` as MessageKey)}</span>
          <span>
            {formatDistance(distance)} · {t("store.walk", { m: formatMinutes(walkSeconds(distance)) })}
          </span>
          <OpenBadge hours={store.open_hours} />
        </div>
        <VerificationBadges store={store} />
      </div>
    </button>
  );
}
