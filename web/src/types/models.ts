import type { Lang } from "@/i18n";

/** 언어별 문자열. 일부 언어가 비어 있으면 pickText()가 폴백한다. */
export type Localized = Partial<Record<Lang, string>>;

export type Category =
  | "korean"
  | "chinese"
  | "japanese"
  | "western"
  | "snack"
  | "cafe";

export const CATEGORIES: Category[] = [
  "korean",
  "chinese",
  "japanese",
  "western",
  "snack",
  "cafe",
];

export type Coord = { lat: number; lng: number };

/** 요일별 영업시간 ("HH:MM"), 휴무는 null. 키: mon ~ sun */
export type Weekday = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
export type OpenHours = Record<Weekday, { open: string; close: string } | null>;

/** 학생 검증 정보 (나중에 추가할 기능 — 지금은 배지 자리만) */
export type Verification = {
  type: "halal" | "vegan" | "spicy_ok";
  count: number;
};

export type Store = {
  id: string;
  name_ko: string;
  name: Localized;
  category: Category;
  lat: number;
  lng: number;
  description: Localized;
  open_hours: OpenHours;
  image_url: string;
  menu_board_images: string[];
  verifications?: Verification[];
};

export type Tri = "yes" | "no" | "unknown";

export type MenuOption = {
  id: string;
  /** spicy: 맵기 조절, remove: 재료 빼기, add: 추가 */
  type: "spicy" | "remove" | "add";
  /** 사장님께 보여줄 한국어 요청 문장 (예: "덜 맵게 해주세요") */
  name_ko: string;
  translations: Localized;
  price_delta?: number;
};

export type Menu = {
  id: string;
  store_id: string;
  menu_category: string;
  /** 메뉴 카테고리 탭의 언어별 이름 (없으면 menu_category 그대로) */
  menu_category_name?: Localized;
  name_ko: string;
  /** 로마자 발음 (예: "jeyuk-bokkeum") */
  pronunciation: string;
  translations: Partial<Record<Lang, { name: string; description?: string }>>;
  price: number;
  image_url: string | null;
  ingredients: string[];
  allergens: string[];
  contains_pork: boolean | null;
  contains_alcohol: boolean | null;
  halal: Tri;
  vegan: Tri;
  spicy: 0 | 1 | 2 | 3;
  options: MenuOption[];
};

export type StoreWithMenus = Store & { menus: Menu[] };

export type CartItem = {
  /** menu_id + 선택 옵션으로 만든 고유 키 */
  key: string;
  store_id: string;
  menu_id: string;
  quantity: number;
  option_ids: string[];
};

export type RouteResult = {
  coordinates: Coord[];
  distance_m: number;
  duration_s: number;
  source: "backend" | "osrm" | "straight";
};
