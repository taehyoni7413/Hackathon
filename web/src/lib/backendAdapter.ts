// 백엔드B(backend/places.py) 응답 → 프론트 데이터 형식 변환.
// 백엔드 데이터에 없는 값은 안전한 기본값으로 채운다 (카테고리 "other", 영업시간 null 등).
import { CATEGORIES, type Category, type Localized, type Menu, type MenuOption, type OpenHours, type Store, type Tri, type Weekday } from "@/types/models";

/** 백엔드B 가게 형식 (backend/data/stores.json) */
export type BackendStore = {
  id: number | string;
  name: string;
  /** 언어별 이름 (있으면 사용) */
  names?: Localized;
  address?: string;
  lat: number | null;
  lng: number | null;
  category?: string;
  description?: Localized;
  /** {"mon": "11:00-21:00", "sun": null} — 비어 있으면 정보 없음 */
  open_hours?: Partial<Record<Weekday, string | null>>;
  image_url?: string;
  menu_board_images?: string[];
  verifications?: Store["verifications"];
};

/** 백엔드B 메뉴 형식 (backend/data/menus.json). 프론트 Menu 필드를 그대로 쓰되 비어 있어도 됨 */
export type BackendMenu = Partial<Omit<Menu, "id" | "store_id" | "spicy">> & {
  id?: number | string;
  store_id: number | string;
  name_ko: string;
  category?: string;
  spicy?: number;
};

const WEEKDAYS: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function toOpenHours(h: BackendStore["open_hours"]): OpenHours | null {
  if (!h || Object.keys(h).length === 0) return null;
  const out = {} as OpenHours;
  for (const d of WEEKDAYS) {
    const v = h[d];
    const m = typeof v === "string" ? v.match(/^\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*$/) : null;
    out[d] = m ? { open: m[1].padStart(5, "0"), close: m[2].padStart(5, "0") } : null;
  }
  return out;
}

function toCategory(c: string | undefined): Category {
  return CATEGORIES.includes(c as Category) ? (c as Category) : "other";
}

function toTri(v: unknown): Tri {
  return v === "yes" || v === "no" ? v : "unknown";
}

export function adaptStore(s: BackendStore): Store | null {
  // 좌표가 없는 가게는 지도에 놓을 수 없으므로 제외
  if (s.lat == null || s.lng == null) return null;
  return {
    id: String(s.id),
    name_ko: s.name,
    name: { ko: s.name, ...s.names },
    category: toCategory(s.category),
    lat: s.lat,
    lng: s.lng,
    description: s.description ?? {},
    open_hours: toOpenHours(s.open_hours),
    address: s.address,
    image_url: s.image_url ?? "",
    menu_board_images: s.menu_board_images ?? [],
    verifications: s.verifications ?? [],
  };
}

export function adaptMenu(m: BackendMenu, index: number): Menu {
  const storeId = String(m.store_id);
  const cat = m.menu_category ?? m.category ?? "메뉴";
  return {
    id: String(m.id ?? `${storeId}-${index}`),
    store_id: storeId,
    menu_category: cat,
    menu_category_name: m.menu_category_name,
    name_ko: m.name_ko,
    pronunciation: m.pronunciation ?? "",
    translations: m.translations ?? {},
    price: m.price ?? 0,
    image_url: m.image_url || null,
    ingredients: m.ingredients ?? [],
    allergens: m.allergens ?? [],
    contains_pork: m.contains_pork ?? null,
    contains_alcohol: m.contains_alcohol ?? null,
    halal: toTri(m.halal),
    vegan: toTri(m.vegan),
    spicy: Math.max(0, Math.min(3, Math.round(m.spicy ?? 0))) as Menu["spicy"],
    options: (m.options ?? []) as MenuOption[],
  };
}

/** 백엔드B GET /api/route 응답 */
export type BackendRoute = {
  total_distance_m: number | null;
  total_time_s: number | null;
  path: [number, number][];
};
