"use client";

import { GearSix, MapPin, MapTrifold } from "@/components/Icon";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo, useState } from "react";

import {
  BottomSheet,
  snapHeight,
  useViewportHeight,
  type Snap,
} from "@/components/BottomSheet";
import { AiSearchBar, AiSearchSheet } from "@/components/AiSearch";
import { CategoryChips, type CategoryFilter } from "@/components/CategoryChips";
import { MapView, type MapMarker } from "@/components/map/MapView";
import { SettingsSheet } from "@/components/SettingsSheet";
import { EmptyView, ErrorView, LoadingView } from "@/components/StateViews";
import { StoreCard } from "@/components/StoreCard";
import { StoreDetail, StoreDetailFooter } from "@/components/StoreDetail";
import { useApp } from "@/context/AppContext";
import { useMyLocation } from "@/hooks/useMyLocation";
import { useStores } from "@/hooks/useStores";
import { pickText } from "@/i18n";
import { distanceM } from "@/lib/geo";

/** 3. 지도 홈 + 4. 식당 상세(바텀시트 안, ?store=<id>) */
function MapHome() {
  const router = useRouter();
  const params = useSearchParams();
  const selectedId = params.get("store");
  const { lang, t } = useApp();
  const data = useStores();
  const { coord, status } = useMyLocation();

  const [category, setCategory] = useState<CategoryFilter>("all");
  const [snap, setSnap] = useState<Snap>("collapsed");
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const vh = useViewportHeight();

  const stores = useMemo(() => {
    if (data.status !== "ok") return [];
    return data.stores
      .filter((s) => category === "all" || s.category === category)
      .map((s) => ({ store: s, distance: distanceM(coord, s) }))
      .sort((a, b) => a.distance - b.distance);
  }, [data, category, coord]);

  const selected =
    data.status === "ok" ? data.stores.find((s) => s.id === selectedId) ?? null : null;

  const markers: MapMarker[] = useMemo(
    () =>
      stores.map(({ store }) => ({
        id: store.id,
        coord: store,
        label: pickText(store.name, lang, store.name_ko),
        category: store.category,
      })),
    [stores, lang],
  );

  const select = useCallback(
    (id: string | null) => {
      router.replace(id ? `/map?store=${id}` : "/map", { scroll: false });
      setSnap(id ? "half" : "collapsed");
    },
    [router],
  );

  // 지도를 못 쓰면 목록이 주 화면
  const effectiveSnap: Snap = mapUnavailable && snap === "collapsed" ? "full" : snap;
  const center = selected ?? coord;

  return (
    <main className="relative flex-1 overflow-hidden bg-zinc-100" style={{ minHeight: "var(--app-h)" }}>
      {!mapUnavailable && (
        <MapView
          center={center}
          myLocation={coord}
          markers={markers}
          selectedId={selectedId}
          bottomInset={snapHeight(effectiveSnap, vh)}
          onMarkerClick={select}
          onUnavailable={() => setMapUnavailable(true)}
        />
      )}

      {/* 상단: AI 맞춤 추천 검색창 + 카테고리 칩 + 설정 */}
      <div className="absolute inset-x-0 top-0 z-20 pt-safe">
        <div className="px-4 pb-2">
          <AiSearchBar onOpen={() => setAiOpen(true)} />
        </div>
        <div className="flex items-center gap-2 pr-4">
          <div className="min-w-0 flex-1">
            <CategoryChips
              value={category}
              onChange={(c) => {
                setCategory(c);
                if (selectedId) select(null);
              }}
            />
          </div>
          <button
            className="icon-btn shrink-0"
            onClick={() => setSettingsOpen(true)}
            aria-label={t("settings.title")}
          >
            <GearSix />
          </button>
        </div>
        {(status === "denied" || mapUnavailable) && (
          <p className="mx-4 mt-2 rounded-xl bg-white/95 px-3 py-2 text-sm text-zinc-700 shadow">
            {status === "denied" && <span className="flex items-center gap-1"><MapPin className="shrink-0 text-brand" /> {t("map.locationDenied")}</span>}
            {mapUnavailable && <span className="flex items-center gap-1"><MapTrifold className="shrink-0 text-brand" /> {t("map.mapUnavailable")}</span>}
          </p>
        )}
      </div>

      <BottomSheet
        snap={effectiveSnap}
        onSnapChange={setSnap}
        header={
          !selected && (
            <p className="pb-2 font-bold">
              {t("map.listTitle", { n: stores.length })}
            </p>
          )
        }
        footer={selected && <StoreDetailFooter storeId={selected.id} />}
      >
        {data.status === "loading" ? (
          <LoadingView />
        ) : data.status === "error" ? (
          <ErrorView onRetry={data.reload} />
        ) : selected ? (
          <StoreDetail
            store={selected}
            distance={distanceM(coord, selected)}
            onBack={() => select(null)}
          />
        ) : stores.length === 0 ? (
          <EmptyView label={t("map.noStores")} />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {stores.map(({ store, distance }) => (
              <li key={store.id}>
                <StoreCard store={store} distance={distance} onClick={() => select(store.id)} />
              </li>
            ))}
          </ul>
        )}
      </BottomSheet>

      {settingsOpen && <SettingsSheet onClose={() => setSettingsOpen(false)} />}
      {aiOpen && (
        <AiSearchSheet
          stores={data.status === "ok" ? data.stores : []}
          onClose={() => setAiOpen(false)}
          onPick={(id) => {
            setAiOpen(false);
            setCategory("all");
            select(id);
          }}
        />
      )}
    </main>
  );
}

export default function MapPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <MapHome />
    </Suspense>
  );
}
