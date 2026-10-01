"use client";

import { CaretLeft } from "@/components/Icon";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MapView } from "@/components/map/MapView";
import { ErrorView, LoadingView } from "@/components/StateViews";
import { useApp } from "@/context/AppContext";
import { useMyLocation } from "@/hooks/useMyLocation";
import { useStore } from "@/hooks/useStores";
import { pickText } from "@/i18n";
import { getWalkingRoute } from "@/lib/api";
import { formatDistance, formatMinutes } from "@/lib/geo";
import type { RouteResult } from "@/types/models";

/** 5. 경로 안내: 백엔드(TMAP) → OSRM → 직선 순으로 경로를 구해 지도에 그린다 */
export default function RoutePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();
  const { lang, t } = useApp();
  const data = useStore(storeId);
  const { coord, status } = useMyLocation();
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);

  const store = data.status === "ok" ? data.store : null;

  useEffect(() => {
    if (!store || status === "loading") return;
    let alive = true;
    getWalkingRoute(coord, store, store.id).then((r) => alive && setRoute(r));
    return () => {
      alive = false;
    };
  }, [store, coord, status]);

  const markers = useMemo(
    () =>
      store
        ? [{ id: store.id, coord: store, label: pickText(store.name, lang, store.name_ko), category: store.category }]
        : [],
    [store, lang],
  );

  if (data.status === "loading") return <LoadingView />;
  if (data.status === "error") return <ErrorView onRetry={data.reload} />;
  if (!store) return <ErrorView />;

  const name = pickText(store.name, lang, store.name_ko);

  return (
    <main className="relative flex-1 overflow-hidden bg-zinc-100" style={{ minHeight: "var(--app-h)" }}>
      {!mapUnavailable && (
        <MapView
          center={store}
          myLocation={coord}
          markers={markers}
          selectedId={store.id}
          route={route?.coordinates}
          bottomInset={260}
          onUnavailable={() => setMapUnavailable(true)}
        />
      )}

      <button
        className="icon-btn absolute left-3 top-safe z-20"
        onClick={() => router.push(`/map?store=${store.id}`)}
        aria-label={t("common.back")}
      >
        <CaretLeft weight="bold" />
      </button>

      <section className="absolute inset-x-0 bottom-0 z-30 rounded-t-3xl bg-white px-5 pt-5 pb-safe shadow-[0_-8px_24px_rgba(0,0,0,0.12)]">
        <p className="text-sm text-zinc-500">{t("route.title")}</p>
        <h1 className="text-xl font-bold">{name}</h1>

        {!route ? (
          <p className="mt-4 text-zinc-500">{t("route.loading")}…</p>
        ) : (
          <>
            <div className="mt-3 flex gap-6">
              <div>
                <p className="text-xs text-zinc-500">{t("route.remaining")}</p>
                <p className="text-2xl font-bold">{formatDistance(route.distance_m)}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500">{t("route.time")}</p>
                <p className="text-2xl font-bold">
                  {t("route.minutes", { m: formatMinutes(route.duration_s) })}
                </p>
              </div>
            </div>
            {route.source === "straight" && (
              <p className="mt-2 text-xs text-amber-700">{t("route.straight")}</p>
            )}
          </>
        )}

        <Link href={`/arrive/${store.id}`} className="btn-primary mt-4 w-full">
          {t("route.arrived")}
        </Link>
      </section>
    </main>
  );
}
