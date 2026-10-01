/**
 * 가짜 데이터: SCHOOL_COORD 주변 8곳, 식당마다 메뉴 4~6개.
 * 실제 대표 식당 JSON이 오면 src/data/stores.json 에 넣으면 이 파일 대신 쓰인다.
 */
import { SCHOOL_COORD } from "@/config/location";
import { offsetCoord } from "@/lib/geo";
import type {
  Category,
  Menu,
  MenuOption,
  OpenHours,
  StoreWithMenus,
  Tri,
} from "@/types/models";

const LUNCH_DINNER: OpenHours = {
  mon: { open: "10:30", close: "21:00" },
  tue: { open: "10:30", close: "21:00" },
  wed: { open: "10:30", close: "21:00" },
  thu: { open: "10:30", close: "21:00" },
  fri: { open: "10:30", close: "21:00" },
  sat: { open: "11:00", close: "20:00" },
  sun: null,
};
const LATE: OpenHours = {
  mon: { open: "11:00", close: "02:00" },
  tue: { open: "11:00", close: "02:00" },
  wed: { open: "11:00", close: "02:00" },
  thu: { open: "11:00", close: "02:00" },
  fri: { open: "11:00", close: "02:00" },
  sat: { open: "11:00", close: "02:00" },
  sun: { open: "12:00", close: "24:00" },
};
const CAFE_HOURS: OpenHours = {
  mon: { open: "08:00", close: "22:00" },
  tue: { open: "08:00", close: "22:00" },
  wed: { open: "08:00", close: "22:00" },
  thu: { open: "08:00", close: "22:00" },
  fri: { open: "08:00", close: "22:00" },
  sat: { open: "10:00", close: "22:00" },
  sun: { open: "10:00", close: "22:00" },
};

// 공통 요청 옵션
const LESS_SPICY: MenuOption = {
  id: "less_spicy",
  type: "spicy",
  name_ko: "덜 맵게 해주세요",
  translations: { zh: "少辣", en: "Less spicy" },
};
const NOT_SPICY: MenuOption = {
  id: "not_spicy",
  type: "spicy",
  name_ko: "안 맵게 해주세요",
  translations: { zh: "不要辣", en: "Not spicy" },
};
const MORE_SPICY: MenuOption = {
  id: "more_spicy",
  type: "spicy",
  name_ko: "더 맵게 해주세요",
  translations: { zh: "多加辣", en: "Extra spicy" },
};
const NO_PORK: MenuOption = {
  id: "no_pork",
  type: "remove",
  name_ko: "돼지고기는 빼주세요",
  translations: { zh: "不要猪肉", en: "No pork" },
};
const NO_ONION: MenuOption = {
  id: "no_onion",
  type: "remove",
  name_ko: "양파는 빼주세요",
  translations: { zh: "不要洋葱", en: "No onion" },
};
const NO_CILANTRO: MenuOption = {
  id: "no_cilantro",
  type: "remove",
  name_ko: "고수는 빼주세요",
  translations: { zh: "不要香菜", en: "No cilantro" },
};
const EXTRA_RICE: MenuOption = {
  id: "extra_rice",
  type: "add",
  name_ko: "공깃밥 추가해주세요",
  translations: { zh: "加一碗米饭", en: "Extra rice" },
  price_delta: 1000,
};
const ICE_LESS: MenuOption = {
  id: "less_ice",
  type: "remove",
  name_ko: "얼음 적게 넣어주세요",
  translations: { zh: "少冰", en: "Less ice" },
};

type MenuSpec = {
  id: string;
  cat: [string, { zh: string; en: string }];
  ko: string;
  pron: string;
  zh: [string, string];
  en: [string, string];
  price: number;
  ingredients: string[];
  allergens?: string[];
  pork: boolean | null;
  alcohol?: boolean | null;
  halal: Tri;
  vegan: Tri;
  spicy: 0 | 1 | 2 | 3;
  options?: MenuOption[];
};

function menu(storeId: string, s: MenuSpec): Menu {
  return {
    id: `${storeId}-${s.id}`,
    store_id: storeId,
    menu_category: s.cat[0],
    menu_category_name: { ko: s.cat[0], ...s.cat[1] },
    name_ko: s.ko,
    pronunciation: s.pron,
    translations: {
      zh: { name: s.zh[0], description: s.zh[1] },
      en: { name: s.en[0], description: s.en[1] },
      ko: { name: s.ko },
    },
    price: s.price,
    image_url: null,
    ingredients: s.ingredients,
    allergens: s.allergens ?? [],
    contains_pork: s.pork,
    contains_alcohol: s.alcohol ?? false,
    halal: s.halal,
    vegan: s.vegan,
    spicy: s.spicy,
    options: s.options ?? [],
  };
}

type StoreSpec = {
  id: string;
  ko: string;
  zh: string;
  en: string;
  category: Category;
  /** 학교 기준 북쪽/동쪽 오프셋 (m) */
  offset: [number, number];
  desc: { ko: string; zh: string; en: string };
  hours: OpenHours;
  menus: MenuSpec[];
};

function store(s: StoreSpec): StoreWithMenus {
  const { lat, lng } = offsetCoord(SCHOOL_COORD, s.offset[0], s.offset[1]);
  return {
    id: s.id,
    name_ko: s.ko,
    name: { ko: s.ko, zh: s.zh, en: s.en },
    category: s.category,
    lat,
    lng,
    description: s.desc,
    open_hours: s.hours,
    image_url: `/stores/${s.id}/cover.jpg`,
    menu_board_images: [],
    verifications: [],
    menus: s.menus.map((m) => menu(s.id, m)),
  };
}

const MAIN = ["식사", { zh: "主食", en: "Mains" }] as [string, { zh: string; en: string }];
const SIDE = ["사이드", { zh: "小菜", en: "Sides" }] as [string, { zh: string; en: string }];
const DRINK = ["음료", { zh: "饮品", en: "Drinks" }] as [string, { zh: string; en: string }];
const NOODLE = ["면", { zh: "面类", en: "Noodles" }] as [string, { zh: string; en: string }];

export const MOCK_STORES: StoreWithMenus[] = [
  store({
    id: "s01",
    ko: "정문 한식당",
    zh: "正门韩餐馆",
    en: "Main Gate Korean Kitchen",
    category: "korean",
    offset: [-120, 60],
    desc: {
      ko: "학교 정문 바로 앞, 학생들이 많이 찾는 백반집이에요.",
      zh: "就在学校正门前，学生常去的家常韩餐店。",
      en: "A home-style Korean diner right in front of the main gate.",
    },
    hours: LUNCH_DINNER,
    menus: [
      { id: "m1", cat: MAIN, ko: "제육볶음", pron: "jeyuk-bokkeum", zh: ["辣炒猪肉", "用辣酱炒的猪肉，配米饭"], en: ["Spicy stir-fried pork", "Pork stir-fried in chili sauce, served with rice"], price: 9000, ingredients: ["돼지고기", "고추장", "양파", "대파"], allergens: ["대두", "밀"], pork: true, halal: "no", vegan: "no", spicy: 2, options: [LESS_SPICY, NOT_SPICY, NO_ONION, EXTRA_RICE] },
      { id: "m2", cat: MAIN, ko: "김치찌개", pron: "kimchi-jjigae", zh: ["泡菜汤", "泡菜炖汤，通常含猪肉"], en: ["Kimchi stew", "Kimchi stew, usually with pork"], price: 8000, ingredients: ["김치", "돼지고기", "두부"], allergens: ["대두"], pork: true, halal: "no", vegan: "no", spicy: 2, options: [LESS_SPICY, NO_PORK, EXTRA_RICE] },
      { id: "m3", cat: MAIN, ko: "된장찌개", pron: "doenjang-jjigae", zh: ["大酱汤", "韩式大豆酱炖汤"], en: ["Soybean paste stew", "Stew made with Korean soybean paste"], price: 8000, ingredients: ["된장", "두부", "애호박", "감자"], allergens: ["대두"], pork: null, halal: "unknown", vegan: "unknown", spicy: 0, options: [EXTRA_RICE] },
      { id: "m4", cat: MAIN, ko: "비빔밥", pron: "bibimbap", zh: ["拌饭", "米饭配蔬菜和辣酱拌着吃"], en: ["Bibimbap", "Rice with vegetables and chili paste"], price: 8500, ingredients: ["밥", "나물", "계란", "고추장"], allergens: ["계란", "대두"], pork: false, halal: "unknown", vegan: "no", spicy: 1, options: [NOT_SPICY] },
      { id: "m5", cat: SIDE, ko: "계란말이", pron: "gyeran-mari", zh: ["鸡蛋卷", "韩式厚蛋卷"], en: ["Rolled omelette", "Korean-style rolled egg"], price: 5000, ingredients: ["계란", "당근", "대파"], allergens: ["계란"], pork: false, halal: "unknown", vegan: "no", spicy: 0 },
    ],
  }),
  store({
    id: "s02",
    ko: "할매 국밥",
    zh: "奶奶汤饭",
    en: "Grandma's Gukbap",
    category: "korean",
    offset: [210, -150],
    desc: {
      ko: "24시간 끓인 사골 국물로 만드는 국밥집이에요.",
      zh: "用熬制24小时的骨汤做的汤饭店。",
      en: "Rice soup made with bone broth simmered for 24 hours.",
    },
    hours: LATE,
    menus: [
      { id: "m1", cat: MAIN, ko: "돼지국밥", pron: "dwaeji-gukbap", zh: ["猪肉汤饭", "猪骨汤配米饭和猪肉片"], en: ["Pork rice soup", "Pork bone broth with rice and sliced pork"], price: 9000, ingredients: ["돼지고기", "돼지뼈 육수", "부추"], pork: true, halal: "no", vegan: "no", spicy: 0, options: [EXTRA_RICE] },
      { id: "m2", cat: MAIN, ko: "소고기국밥", pron: "sogogi-gukbap", zh: ["牛肉汤饭", "辣味牛肉汤配米饭"], en: ["Beef rice soup", "Spicy beef broth with rice"], price: 10000, ingredients: ["소고기", "고사리", "대파", "고춧가루"], pork: false, halal: "unknown", vegan: "no", spicy: 2, options: [LESS_SPICY, EXTRA_RICE] },
      { id: "m3", cat: MAIN, ko: "순대국밥", pron: "sundae-gukbap", zh: ["血肠汤饭", "猪血肠和内脏汤饭"], en: ["Blood sausage soup", "Soup with Korean blood sausage and offal"], price: 9000, ingredients: ["순대", "돼지 내장", "들깨"], allergens: ["들깨"], pork: true, halal: "no", vegan: "no", spicy: 0, options: [EXTRA_RICE] },
      { id: "m4", cat: SIDE, ko: "수육", pron: "suyuk", zh: ["白切肉", "水煮猪肉片"], en: ["Boiled pork slices", "Tender boiled pork belly slices"], price: 15000, ingredients: ["돼지고기"], pork: true, halal: "no", vegan: "no", spicy: 0 },
    ],
  }),
  store({
    id: "s03",
    ko: "홍콩반점",
    zh: "香港饭店",
    en: "Hong Kong Banjeom",
    category: "chinese",
    offset: [60, 260],
    desc: {
      ko: "짜장면과 짬뽕이 유명한 한국식 중국집이에요.",
      zh: "以炸酱面和海鲜辣汤面出名的韩式中餐馆。",
      en: "Korean-Chinese restaurant known for jajangmyeon and jjamppong.",
    },
    hours: LUNCH_DINNER,
    menus: [
      { id: "m1", cat: NOODLE, ko: "짜장면", pron: "jjajang-myeon", zh: ["炸酱面", "韩式黑豆酱面，酱里通常有猪肉"], en: ["Black bean noodles", "Noodles in black bean sauce, usually with pork"], price: 7000, ingredients: ["춘장", "돼지고기", "양파", "밀면"], allergens: ["밀", "대두"], pork: true, halal: "no", vegan: "no", spicy: 0, options: [NO_ONION] },
      { id: "m2", cat: NOODLE, ko: "짬뽕", pron: "jjamppong", zh: ["海鲜辣汤面", "辣味海鲜汤面"], en: ["Spicy seafood noodles", "Spicy noodle soup with seafood"], price: 8000, ingredients: ["오징어", "홍합", "배추", "밀면"], allergens: ["밀", "조개류", "오징어"], pork: null, halal: "unknown", vegan: "no", spicy: 3, options: [LESS_SPICY] },
      { id: "m3", cat: MAIN, ko: "볶음밥", pron: "bokkeum-bap", zh: ["炒饭", "鸡蛋炒饭配炸酱"], en: ["Fried rice", "Egg fried rice with black bean sauce"], price: 8000, ingredients: ["밥", "계란", "당근", "춘장"], allergens: ["계란", "대두"], pork: null, halal: "unknown", vegan: "no", spicy: 0 },
      { id: "m4", cat: SIDE, ko: "탕수육", pron: "tangsu-yuk", zh: ["糖醋肉", "糖醋炸猪肉"], en: ["Sweet and sour pork", "Fried pork with sweet and sour sauce"], price: 16000, ingredients: ["돼지고기", "전분", "식초"], allergens: ["밀"], pork: true, halal: "no", vegan: "no", spicy: 0 },
      { id: "m5", cat: SIDE, ko: "군만두", pron: "gun-mandu", zh: ["煎饺", "煎饺子"], en: ["Fried dumplings", "Pan-fried dumplings"], price: 6000, ingredients: ["돼지고기", "부추", "밀가루"], allergens: ["밀"], pork: true, halal: "no", vegan: "no", spicy: 0 },
    ],
  }),
  store({
    id: "s04",
    ko: "스시 하루",
    zh: "寿司小春",
    en: "Sushi Haru",
    category: "japanese",
    offset: [-260, -200],
    desc: {
      ko: "합리적인 가격의 초밥과 돈부리 전문점이에요.",
      zh: "价格实惠的寿司和盖饭专门店。",
      en: "Affordable sushi and donburi.",
    },
    hours: LUNCH_DINNER,
    menus: [
      { id: "m1", cat: MAIN, ko: "모둠초밥", pron: "modum-chobap", zh: ["什锦寿司", "10件综合寿司"], en: ["Assorted sushi", "10-piece sushi platter"], price: 13000, ingredients: ["연어", "광어", "새우", "밥"], allergens: ["생선", "새우"], pork: false, halal: "unknown", vegan: "no", spicy: 0 },
      { id: "m2", cat: MAIN, ko: "연어덮밥", pron: "yeoneo-deopbap", zh: ["三文鱼盖饭", "生三文鱼盖饭"], en: ["Salmon rice bowl", "Raw salmon over rice"], price: 12000, ingredients: ["연어", "밥", "양파"], allergens: ["생선"], pork: false, halal: "unknown", vegan: "no", spicy: 0, options: [NO_ONION] },
      { id: "m3", cat: MAIN, ko: "돈카츠", pron: "donkatsu", zh: ["炸猪排", "日式炸猪排"], en: ["Pork cutlet", "Japanese-style breaded pork cutlet"], price: 10000, ingredients: ["돼지고기", "빵가루", "양배추"], allergens: ["밀", "계란"], pork: true, halal: "no", vegan: "no", spicy: 0 },
      { id: "m4", cat: NOODLE, ko: "우동", pron: "udong", zh: ["乌冬面", "清汤乌冬面"], en: ["Udon", "Thick wheat noodles in broth"], price: 8000, ingredients: ["우동면", "가쓰오 육수", "어묵"], allergens: ["밀", "생선"], pork: false, halal: "unknown", vegan: "no", spicy: 0 },
    ],
  }),
  store({
    id: "s05",
    ko: "캠퍼스 버거",
    zh: "校园汉堡",
    en: "Campus Burger",
    category: "western",
    offset: [320, 120],
    desc: {
      ko: "수제 버거와 감자튀김을 파는 작은 가게예요.",
      zh: "卖手工汉堡和薯条的小店。",
      en: "A small shop for handmade burgers and fries.",
    },
    hours: LATE,
    menus: [
      { id: "m1", cat: MAIN, ko: "치즈버거", pron: "chijeu-beogeo", zh: ["芝士汉堡", "牛肉饼芝士汉堡"], en: ["Cheeseburger", "Beef patty with cheese"], price: 8500, ingredients: ["소고기 패티", "치즈", "양파", "빵"], allergens: ["밀", "우유"], pork: false, halal: "unknown", vegan: "no", spicy: 0, options: [NO_ONION] },
      { id: "m2", cat: MAIN, ko: "베이컨버거", pron: "beikeon-beogeo", zh: ["培根汉堡", "牛肉饼加培根"], en: ["Bacon burger", "Beef patty with bacon"], price: 9500, ingredients: ["소고기 패티", "베이컨", "치즈", "빵"], allergens: ["밀", "우유"], pork: true, halal: "no", vegan: "no", spicy: 0, options: [NO_ONION] },
      { id: "m3", cat: MAIN, ko: "치킨버거", pron: "chikin-beogeo", zh: ["鸡肉汉堡", "炸鸡腿肉汉堡"], en: ["Chicken burger", "Fried chicken thigh burger"], price: 8000, ingredients: ["닭고기", "양상추", "빵"], allergens: ["밀", "계란"], pork: false, halal: "unknown", vegan: "no", spicy: 1 },
      { id: "m4", cat: SIDE, ko: "감자튀김", pron: "gamja-twigim", zh: ["薯条", "炸薯条"], en: ["French fries", "Crispy fries"], price: 3500, ingredients: ["감자", "식용유"], pork: false, halal: "unknown", vegan: "unknown", spicy: 0 },
      { id: "m5", cat: DRINK, ko: "콜라", pron: "kolla", zh: ["可乐", ""], en: ["Cola", ""], price: 2000, ingredients: ["탄산음료"], pork: false, halal: "yes", vegan: "yes", spicy: 0, options: [ICE_LESS] },
    ],
  }),
  store({
    id: "s06",
    ko: "엄마손 분식",
    zh: "妈妈手小吃",
    en: "Mom's Hand Snack Bar",
    category: "snack",
    offset: [-60, -280],
    desc: {
      ko: "떡볶이와 김밥이 맛있는 분식집이에요.",
      zh: "辣炒年糕和紫菜包饭很好吃的小吃店。",
      en: "Snack bar known for tteokbokki and gimbap.",
    },
    hours: LUNCH_DINNER,
    menus: [
      { id: "m1", cat: MAIN, ko: "떡볶이", pron: "tteok-bokki", zh: ["辣炒年糕", "辣酱炒年糕和鱼饼"], en: ["Tteokbokki", "Rice cakes and fish cakes in spicy sauce"], price: 4500, ingredients: ["떡", "어묵", "고추장"], allergens: ["밀", "대두", "생선"], pork: false, halal: "unknown", vegan: "no", spicy: 2, options: [LESS_SPICY, MORE_SPICY] },
      { id: "m2", cat: MAIN, ko: "김밥", pron: "gimbap", zh: ["紫菜包饭", "里面有火腿和蔬菜"], en: ["Gimbap", "Seaweed rice roll with ham and vegetables"], price: 3500, ingredients: ["밥", "김", "햄", "단무지", "계란"], allergens: ["계란"], pork: true, halal: "no", vegan: "no", spicy: 0 },
      { id: "m3", cat: MAIN, ko: "야채김밥", pron: "yachae-gimbap", zh: ["蔬菜紫菜包饭", "不含肉的蔬菜紫菜包饭"], en: ["Veggie gimbap", "Seaweed rice roll with vegetables only"], price: 3500, ingredients: ["밥", "김", "시금치", "당근", "단무지"], pork: false, halal: "unknown", vegan: "unknown", spicy: 0 },
      { id: "m4", cat: MAIN, ko: "라면", pron: "ramyeon", zh: ["拉面", "韩式辣泡面"], en: ["Ramyeon", "Korean spicy instant noodles"], price: 4000, ingredients: ["라면", "계란", "대파"], allergens: ["밀", "계란"], pork: null, halal: "unknown", vegan: "no", spicy: 2, options: [LESS_SPICY] },
      { id: "m5", cat: SIDE, ko: "순대", pron: "sundae", zh: ["血肠", "猪血肠"], en: ["Blood sausage", "Korean blood sausage"], price: 5000, ingredients: ["돼지 창자", "당면", "선지"], pork: true, halal: "no", vegan: "no", spicy: 0 },
      { id: "m6", cat: SIDE, ko: "튀김", pron: "twigim", zh: ["炸物", "炸蔬菜和炸虾"], en: ["Fried snacks", "Fried vegetables and shrimp"], price: 4000, ingredients: ["고구마", "새우", "튀김옷"], allergens: ["밀", "새우"], pork: false, halal: "unknown", vegan: "no", spicy: 0 },
    ],
  }),
  store({
    id: "s07",
    ko: "마라 공방",
    zh: "麻辣工坊",
    en: "Mala Workshop",
    category: "snack",
    offset: [150, -330],
    desc: {
      ko: "재료를 골라 무게로 계산하는 마라탕 가게예요.",
      zh: "自选食材、按重量计价的麻辣烫店。",
      en: "Pick your ingredients, pay by weight mala soup.",
    },
    hours: LATE,
    menus: [
      { id: "m1", cat: MAIN, ko: "마라탕", pron: "mara-tang", zh: ["麻辣烫", "按重量计价，价格为参考价"], en: ["Mala soup", "Priced by weight; this is a reference price"], price: 10000, ingredients: ["마라 소스", "채소", "당면", "소고기"], allergens: ["대두", "땅콩"], pork: null, halal: "unknown", vegan: "no", spicy: 3, options: [LESS_SPICY, NOT_SPICY, NO_CILANTRO] },
      { id: "m2", cat: MAIN, ko: "마라샹궈", pron: "mara-syang-gwo", zh: ["麻辣香锅", "干炒麻辣香锅"], en: ["Mala stir-fry", "Dry spicy stir-fry"], price: 16000, ingredients: ["마라 소스", "채소", "새우"], allergens: ["대두", "땅콩", "새우"], pork: null, halal: "unknown", vegan: "no", spicy: 3, options: [LESS_SPICY, NO_CILANTRO] },
      { id: "m3", cat: SIDE, ko: "꿔바로우", pron: "kkwo-ba-ro-u", zh: ["锅包肉", "东北锅包肉"], en: ["Guobaorou", "Crispy sweet and sour pork"], price: 14000, ingredients: ["돼지고기", "감자전분"], pork: true, halal: "no", vegan: "no", spicy: 0 },
      { id: "m4", cat: DRINK, ko: "칭다오 맥주", pron: "chingdao maekju", zh: ["青岛啤酒", ""], en: ["Tsingtao beer", ""], price: 6000, ingredients: ["맥주"], allergens: ["밀"], pork: false, alcohol: true, halal: "no", vegan: "unknown", spicy: 0 },
    ],
  }),
  store({
    id: "s08",
    ko: "카페 온새",
    zh: "温鸟咖啡",
    en: "Cafe Onsae",
    category: "cafe",
    offset: [-200, 230],
    desc: {
      ko: "공부하기 좋은 넓은 카페예요. 샌드위치도 있어요.",
      zh: "适合学习的宽敞咖啡馆，也有三明治。",
      en: "A spacious cafe good for studying. Sandwiches too.",
    },
    hours: CAFE_HOURS,
    menus: [
      { id: "m1", cat: DRINK, ko: "아메리카노", pron: "amerikano", zh: ["美式咖啡", ""], en: ["Americano", ""], price: 3000, ingredients: ["커피"], pork: false, halal: "yes", vegan: "yes", spicy: 0, options: [ICE_LESS] },
      { id: "m2", cat: DRINK, ko: "카페라떼", pron: "kape-latte", zh: ["拿铁", ""], en: ["Cafe latte", ""], price: 3800, ingredients: ["커피", "우유"], allergens: ["우유"], pork: false, halal: "yes", vegan: "no", spicy: 0, options: [ICE_LESS] },
      { id: "m3", cat: DRINK, ko: "유자차", pron: "yuja-cha", zh: ["柚子茶", "热柚子茶"], en: ["Citron tea", "Hot yuja tea"], price: 4000, ingredients: ["유자청"], pork: false, halal: "yes", vegan: "yes", spicy: 0 },
      { id: "m4", cat: MAIN, ko: "햄치즈 샌드위치", pron: "haem-chijeu saendeuwichi", zh: ["火腿芝士三明治", ""], en: ["Ham & cheese sandwich", ""], price: 5500, ingredients: ["햄", "치즈", "빵"], allergens: ["밀", "우유"], pork: true, halal: "no", vegan: "no", spicy: 0 },
    ],
  }),
];
