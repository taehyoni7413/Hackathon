"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ErrorView, LoadingView } from "@/components/StateViews";
import { StoreCard } from "@/components/StoreCard";
import { ARRIVAL_RADIUS_M, NEARBY_RADIUS_M } from "@/config/location";
import { useApp } from "@/context/AppContext";
import { getCurrentCoord } from "@/hooks/useMyLocation";
import { useStores } from "@/hooks/useStores";
import { pickText } from "@/i18n";
import { distanceM, offsetCoord } from "@/lib/geo";
import type { Coord } from "@/types/models";

type Phase = "checking" | "confirm" | "nearby" | "failed" | "all";

/** 6. 도착 확인: 80m 이내면 확인 질문, 아니면 300m 안 식당 중 선택 */
export default function ArrivePage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();
  const { lang, t, demo, ready } = useApp();
  const data = useStores();
  const [phase, setPhase] = useState<Phase>("checking");
  const [coord, setCoord] = useState<Coord | null>(null);

  const stores = useMemo(() => (data.status === "ok" ? data.stores : []), [data]);
  const target = stores.find((s) => s.id === storeId) ?? null;

  const check = useCallback(async () => {
    if (!target) return;
    setPhase("checking");
    // 데모: 목적지 근처로 이동한 것처럼 처리
    const c = demo ? offsetCoord(target, 15, 10) : await getCurrentCoord();
    if (!c) {
      setPhase("failed");
      return;
    }
    setCoord(c);
    setPhase(distanceM(c, target) <= ARRIVAL_RADIUS_M ? "confirm" : "nearby");
  }, [demo, target]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 위치 확인은 외부 시스템 조회
    if (ready && target) void check();
  }, [ready, target, check]);

  const nearby = useMemo(() => {
    if (!coord) return [];
    return stores
      .map((s) => ({ store: s, distance: distanceM(coord, s) }))
      .filter((x) => x.distance <= NEARBY_RADIUS_M)
      .sort((a, b) => a.distance - b.distance);
  }, [stores, coord]);

  const goMenu = (id: string) => router.push(`/store/${id}/menu`);

  if (data.status === "loading") return <LoadingView />;
  if (data.status === "error") return <ErrorView onRetry={data.reload} />;
  if (!target) return <ErrorView />;

  if (phase === "checking") return <LoadingView label={t("arrive.checking")} />;

  if (phase === "confirm") {
    return (
      <main className="flex flex-1 flex-col justify-center gap-6 px-6">
        <p className="text-center text-5xl" aria-hidden>📍</p>
        <h1 className="text-center text-2xl font-bold">
          {t("arrive.question", { name: pickText(target.name, lang, target.name_ko) })}
        </h1>
        <div className="flex flex-col gap-3">
          <button className="btn-primary w-full" onClick={() => goMenu(target.id)}>
            {t("arrive.yes")}
          </button>
          <button className="btn-secondary w-full" onClick={() => setPhase("nearby")}>
            {t("arrive.no")}
          </button>
        </div>
      </main>
    );
  }

  const list =
    phase === "all"
      ? stores.map((s) => ({ store: s, distance: coord ? distanceM(coord, s) : 0 }))
      : nearby;
  const showEmpty = phase === "failed" || (phase === "nearby" && nearby.length === 0);

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center gap-2 px-2 py-2">
        <button className="icon-btn shadow-none" onClick={() => router.back()} aria-label={t("common.back")}>
          ←
        </button>
        <h1 className="text-lg font-bold">{t("arrive.selectNearby")}</h1>
      </header>

      {showEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <p className="text-4xl" aria-hidden>🧭</p>
          <p className="text-zinc-600">
            {phase === "failed" ? t("arrive.locationFail") : t("arrive.noneNearby")}
          </p>
          <button className="btn-primary w-full" onClick={check}>{t("common.retry")}</button>
          <button className="btn-secondary w-full" onClick={() => setPhase("all")}>
            {t("arrive.chooseAll")}
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {list.map(({ store, distance }) => (
            <li key={store.id}>
              <StoreCard store={store} distance={distance} onClick={() => goMenu(store.id)} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
