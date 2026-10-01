// 프론트의 모든 데이터 접근은 이 파일 한 곳을 거친다.
//
// 데이터 출처 우선순위
//   NEXT_PUBLIC_USE_MOCK !== "0" (기본) : 번들 정적 데이터(src/data/stores.json) → 비어 있으면 가짜 데이터(src/mocks)
//   NEXT_PUBLIC_USE_MOCK === "0"        : 백엔드 /api/stores → 실패하면 번들 → 가짜 데이터
// 백엔드 계약(제안): GET /stores, GET /stores/{id}/menus, POST /route

import bundled from "@/data/stores.json";
import { SCHOOL_COORD } from "@/config/location";
import { distanceM, walkSeconds } from "@/lib/geo";
import { MOCK_STORES } from "@/mocks/stores";
import type {
  Coord,
  Menu,
  RouteResult,
  Store,
  StoreWithMenus,
} from "@/types/models";

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "0";

export type DataSource = "backend" | "bundle" | "mock";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }
  return res.json();
}

function localData(): { stores: StoreWithMenus[]; source: DataSource } {
  const list = bundled as unknown as StoreWithMenus[];
  return list.length > 0
    ? { stores: list, source: "bundle" }
    : { stores: MOCK_STORES, source: "mock" };
}

let cache: Promise<{ stores: StoreWithMenus[]; source: DataSource }> | null =
  null;

async function loadAll() {
  if (USE_MOCK) return localData();
  try {
    const stores = await request<Store[]>("/stores");
    const withMenus = await Promise.all(
      stores.map(async (s) => ({
        ...s,
        menus: await request<Menu[]>(`/stores/${s.id}/menus`),
      })),
    );
    return { stores: withMenus, source: "backend" as const };
  } catch {
    return localData();
  }
}

function all() {
  if (!cache) cache = loadAll();
  return cache;
}

export const api = {
  health: () => request<{ status: string }>("/health"),

  dataSource: async (): Promise<DataSource> => (await all()).source,

  getStores: async (): Promise<StoreWithMenus[]> => (await all()).stores,

  getStore: async (id: string): Promise<StoreWithMenus | null> =>
    (await all()).stores.find((s) => s.id === id) ?? null,

  getMenus: async (storeId: string): Promise<Menu[]> =>
    (await api.getStore(storeId))?.menus ?? [],
};

/**
 * 도보 경로. ① 백엔드 /route (TMAP) ② OSRM 공개 도보 서버 ③ 직선 + 4km/h
 * OSRM: routing.openstreetmap.de 의 routed-foot, CORS 허용 확인됨 (좌표는 lng,lat 순서)
 */
export async function getWalkingRoute(
  from: Coord,
  to: Coord,
): Promise<RouteResult> {
  if (!USE_MOCK) {
    try {
      const r = await request<{
        coordinates: Coord[];
        distance_m: number;
        duration_s: number;
      }>("/route", { method: "POST", body: JSON.stringify({ from, to }) });
      if (r.coordinates?.length > 1) return { ...r, source: "backend" };
    } catch {
      // 다음 방법으로
    }
  }

  try {
    const url = `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const data = await res.json();
      const route = data.routes?.[0];
      if (data.code === "Ok" && route) {
        return {
          coordinates: route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => ({ lat, lng }),
          ),
          distance_m: route.distance,
          // OSRM 도보 프로필 속도 대신 우리 기준(4km/h)으로 통일
          duration_s: walkSeconds(route.distance),
          source: "osrm",
        };
      }
    }
  } catch {
    // 다음 방법으로
  }

  const d = distanceM(from, to);
  return {
    coordinates: [from, to],
    distance_m: d,
    duration_s: walkSeconds(d),
    source: "straight",
  };
}

export { SCHOOL_COORD };
