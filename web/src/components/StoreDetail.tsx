"use client";

import Link from "next/link";

import { OpenBadge } from "@/components/OpenBadge";
import { SmartImage, defaultImage } from "@/components/SmartImage";
import { VerificationBadges } from "@/components/StoreCard";
import { ROUTE_READY } from "@/config/features";
import { useApp } from "@/context/AppContext";
import { pickText, type MessageKey } from "@/i18n";
import { formatPrice } from "@/lib/format";
import { formatDistance, formatMinutes, walkSeconds } from "@/lib/geo";
import type { StoreWithMenus } from "@/types/models";

/** 4. 식당 상세 (바텀시트 안에서 표시) */
export function StoreDetail({
  store,
  distance,
  onBack,
}: {
  store: StoreWithMenus;
  distance: number;
  onBack: () => void;
}) {
  const { lang, t } = useApp();
  const name = pickText(store.name, lang, store.name_ko);

  return (
    <div className="pb-4">
      <div className="relative">
        <SmartImage
          src={store.image_url}
          fallback={defaultImage(store.category)}
          alt={name}
          className="h-44 w-full object-cover"
        />
        <button
          onClick={onBack}
          className="icon-btn absolute left-3 top-3"
          aria-label={t("common.back")}
        >
          ←
        </button>
      </div>

      <div className="px-4 pt-4">
        <h2 className="text-2xl font-bold">{name}</h2>
        {name !== store.name_ko && <p className="text-zinc-500">{store.name_ko}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-600">
          <span>{t(`cat.${store.category}` as MessageKey)}</span>
          <span>
            {formatDistance(distance)} · {t("store.walk", { m: formatMinutes(walkSeconds(distance)) })}
          </span>
        </div>
        <div className="mt-2">
          <OpenBadge hours={store.open_hours} withTime />
        </div>
        <div className="mt-2">
          <VerificationBadges store={store} />
        </div>
        {store.address && <p className="mt-2 text-sm text-zinc-500">📍 {store.address}</p>}
        <p className="mt-3 leading-relaxed text-zinc-700">{pickText(store.description, lang)}</p>

        <h3 className="mt-5 font-semibold">{t("store.popular")}</h3>
        {store.menus.length === 0 && (
          <p className="mt-2 text-sm text-zinc-500">{t("menu.empty")}</p>
        )}
        <ul className="mt-2 flex gap-3 overflow-x-auto pb-1">
          {store.menus.slice(0, 4).map((m) => {
            const menuName = m.translations[lang]?.name ?? m.name_ko;
            return (
              <li key={m.id} className="w-28 shrink-0">
                <SmartImage
                  src={m.image_url}
                  fallback={defaultImage(store.category)}
                  alt={menuName}
                  className="h-24 w-28 rounded-xl object-cover"
                />
                <p className="mt-1 line-clamp-2 text-sm font-medium">{menuName}</p>
                <p className="text-sm text-zinc-500">{formatPrice(m.price, lang)}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** 식당 상세 하단 고정 영역 */
export function StoreDetailFooter({ storeId }: { storeId: string }) {
  const { t } = useApp();
  const menuHref = `/store/${storeId}/menu`;
  return (
    <div>
      <p className="mb-3 text-center font-medium text-zinc-700">{t("store.askRoute")}</p>
      <div className="flex gap-2">
        <Link href={menuHref} className="btn-secondary flex-1">
          {t("store.menuBtn")}
        </Link>
        <Link href={ROUTE_READY ? `/route/${storeId}` : menuHref} className="btn-primary flex-[1.4]">
          {t("store.routeBtn")}
        </Link>
      </div>
    </div>
  );
}
