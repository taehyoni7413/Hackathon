// 프론트의 모든 데이터 접근은 이 파일 한 곳을 거친다.
//
// 데이터 출처 우선순위
//   기본                       : 백엔드B /api/stores/all + /api/stores/{id}/menus
//                                → 백엔드에 연결 못 하면 번들 정적 데이터(src/data/stores.json) → 비어 있으면 가짜 데이터(src/mocks)
//   NEXT_PUBLIC_USE_MOCK === "1": 백엔드 없이 번들 → 가짜 데이터 (로컬 화면 작업용)
// 백엔드B 형식 → 프론트 형식 변환은 lib/backendAdapter.ts

import bundled from "@/data/stores.json";
import { SCHOOL_COORD } from "@/config/location";
import {
  adaptMenu,
  adaptStore,
  type BackendMenu,
  type BackendRoute,
  type BackendStore,
} from "@/lib/backendAdapter";
import { distanceM, walkSeconds } from "@/lib/geo";
import { MOCK_STORES } from "@/mocks/stores";
import type { Coord, Menu, RouteResult, StoreWithMenus } from "@/types/models";

export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "1";

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
    const raw = await request<BackendStore[]>("/stores/all");
    const stores = raw.map(adaptStore).filter((s) => s !== null);
    const withMenus: StoreWithMenus[] = await Promise.all(
      stores.map(async (s) => {
        // 메뉴는 가게마다 따로. 한 가게 메뉴를 못 받아도 가게는 보여준다
        const menus = await request<BackendMenu[]>(`/stores/${s.id}/menus`).catch(
          () => [] as BackendMenu[],
        );
        return { ...s, menus: menus.map(adaptMenu) };
      }),
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
 * 요청사항 원문 → 사장님께 보여줄 한국어 (백엔드 /api/translate, gpt-6-luna).
 * 가게 데이터의 목업 여부와 관계없이 항상 백엔드를 부른다. 실패하면 null.
 */
export async function translateRequest(text: string, lang: string): Promise<string | null> {
  try {
    const r = await request<{ ko: string }>("/translate", {
      method: "POST",
      body: JSON.stringify({ text: text.slice(0, 200), lang }),
    });
    return r.ko?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * 도보 경로. ① 백엔드B GET /api/route (TMAP, 키 필요) ② OSRM 공개 도보 서버 ③ 직선 + 4km/h
 * OSRM: routing.openstreetmap.de 의 routed-foot, CORS 허용 확인됨 (좌표는 lng,lat 순서)
 */
export async function getWalkingRoute(
  from: Coord,
  to: Coord,
  /** 백엔드 가게 id. 있으면 TMAP 경로를 먼저 시도 */
  storeId?: string,
): Promise<RouteResult> {
  if (!USE_MOCK && storeId) {
    try {
      const q = new URLSearchParams({
        from_lat: String(from.lat),
        from_lng: String(from.lng),
        store_id: storeId,
      });
      const r = await request<BackendRoute>(`/route?${q}`);
      if (r.path?.length > 1) {
        const distance = r.total_distance_m ?? distanceM(from, to);
        return {
          coordinates: r.path.map(([lat, lng]) => ({ lat, lng })),
          distance_m: distance,
          duration_s: r.total_time_s ?? walkSeconds(distance),
          source: "backend",
        };
      }
    } catch {
      // TMAP 키가 없거나 실패 → 다음 방법으로
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

export type MenuInsight = { summary: string; recommended_for: string; notice: string };

/**
 * AI 메뉴 코치: 메뉴 정보 기반 한 줄 요약·추천 대상·주의사항 (백엔드 /api/menu-insight, gpt-6-luna).
 * 백엔드 메뉴(숫자 id)만 가능. 실패하면 null.
 */
export async function getMenuInsight(
  storeId: string,
  menuId: string,
  lang: string,
): Promise<MenuInsight | null> {
  const store_id = Number(storeId);
  const menu_id = Number(menuId);
  if (!Number.isInteger(store_id) || !Number.isInteger(menu_id)) return null;
  try {
    return await request<MenuInsight>("/menu-insight", {
      method: "POST",
      body: JSON.stringify({ store_id, menu_id, lang }),
    });
  } catch {
    return null;
  }
}

/**
 * 음식 번호 발급 (백엔드 /api/orders): 장바구니 음식마다 들어온 순서대로 이어지는 번호.
 * 백엔드에 못 닿으면 이 기기에서만 세는 번호.
 */
export async function getDishNumbers(count: number): Promise<number[]> {
  try {
    const r = await request<{ numbers: number[] }>("/orders", {
      method: "POST",
      body: JSON.stringify({ count }),
    });
    if (Array.isArray(r.numbers) && r.numbers.length === count) return r.numbers;
  } catch {
    // 아래 기기 번호로
  }
  let start = 1;
  try {
    start = Number(localStorage.getItem("buk.dishSeq") ?? "0") + 1;
    localStorage.setItem("buk.dishSeq", String(start + count - 1));
  } catch {
    // 저장 못 하면 1부터
  }
  return Array.from({ length: count }, (_, i) => start + i);
}
