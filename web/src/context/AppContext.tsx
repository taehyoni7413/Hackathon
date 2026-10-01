"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import { clearLegacyStorage, usePersistentState } from "@/hooks/usePersistentState";
import {
  DEFAULT_LANG,
  isLang,
  translate,
  type Lang,
  type MessageKey,
} from "@/i18n";
import type { CartItem, CustomRequest } from "@/types/models";

export type Order = {
  store_id: string;
  /** no: 음식 번호 (사장님 주문서·대기 화면에 같은 번호) */
  items: (CartItem & { no?: number })[];
  created_at: string;
};

type AppState = {
  /** 저장값(sessionStorage) 복원이 끝났는지 (끝나기 전엔 저장값이 아직 반영 안 됨) */
  ready: boolean;
  lang: Lang;
  /** 사용자가 언어를 고른 적이 있는지 */
  langChosen: boolean;
  setLang: (l: Lang) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;

  demo: boolean;
  setDemo: (v: boolean) => void;

  cart: CartItem[];
  cartStoreId: string | null;
  addToCart: (item: Omit<CartItem, "key">) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeFromCart: (key: string) => void;
  clearCart: () => void;

  /** 장바구니 음식별 번호 (줄 key → 번호, 사장님께 보여주기 화면에서 발급) */
  dishNos: Record<string, number>;
  setDishNos: (
    v: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>),
  ) => void;

  order: Order | null;
  placeOrder: () => void;
  finishOrder: () => void;

  /** 언어·데모·장바구니·주문을 모두 지우고 처음 상태로 */
  resetAll: () => void;
};

const Ctx = createContext<AppState | null>(null);

function itemKey(menuId: string, optionIds: string[], custom?: CustomRequest[]) {
  // 같은 메뉴라도 말한 요청이 다르면 다른 줄로 담는다
  const said = (custom ?? []).map((c) => c.text);
  return [menuId, ...[...optionIds].sort(), ...said].join("|");
}

export function AppProvider({ children }: { children: ReactNode }) {
  // 예전 버전이 localStorage에 남긴 언어·장바구니가 계속 보이지 않도록 한 번 정리
  useEffect(() => clearLegacyStorage(), []);

  const [storedLang, setStoredLang, langReady] = usePersistentState<string | null>(
    "app.lang",
    null,
  );
  const [demo, setDemo, demoReady] = usePersistentState("app.demo", false);
  const [cart, setCart, cartReady] = usePersistentState<CartItem[]>("app.cart", []);
  const [order, setOrder, orderReady] = usePersistentState<Order | null>(
    "app.order",
    null,
  );

  const [dishNos, setDishNos] = usePersistentState<Record<string, number>>("app.dishNos", {});

  const lang: Lang = isLang(storedLang) ? storedLang : DEFAULT_LANG;

  // 화면 언어를 <html lang>에 반영 → 한국어는 단어 단위 줄바꿈(globals.css :lang(ko))
  useEffect(() => {
    document.documentElement.lang = lang === "zh" ? "zh-CN" : lang;
  }, [lang]);
  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(lang, key, vars),
    [lang],
  );

  const addToCart = useCallback(
    (item: Omit<CartItem, "key">) => {
      const key = itemKey(item.menu_id, item.option_ids, item.custom_requests);
      setCart((prev) => {
        // 다른 식당 메뉴는 섞지 않는다 (확인은 호출하는 화면에서)
        const base = prev.length && prev[0].store_id !== item.store_id ? [] : prev;
        const found = base.find((c) => c.key === key);
        return found
          ? base.map((c) =>
              c.key === key ? { ...c, quantity: c.quantity + item.quantity } : c,
            )
          : [...base, { ...item, key }];
      });
    },
    [setCart],
  );

  const value = useMemo<AppState>(
    () => ({
      ready: langReady && demoReady && cartReady && orderReady,
      lang,
      langChosen: isLang(storedLang),
      setLang: setStoredLang,
      t,
      demo,
      setDemo,
      cart,
      cartStoreId: cart[0]?.store_id ?? null,
      addToCart,
      setQuantity: (key, quantity) =>
        setCart((prev) =>
          quantity <= 0
            ? prev.filter((c) => c.key !== key)
            : prev.map((c) => (c.key === key ? { ...c, quantity } : c)),
        ),
      removeFromCart: (key) => setCart((prev) => prev.filter((c) => c.key !== key)),
      clearCart: () => setCart([]),
      dishNos,
      setDishNos,
      order,
      placeOrder: () => {
        if (!cart.length) return;
        setOrder({
          store_id: cart[0].store_id,
          items: cart.map((c) => ({ ...c, no: dishNos[c.key] })),
          created_at: new Date().toISOString(),
        });
        setCart([]);
        setDishNos({});
      },
      finishOrder: () => setOrder(null),
      resetAll: () => {
        setStoredLang(null);
        setDemo(false);
        setCart([]);
        setOrder(null);
        setDishNos({});
      },
    }),
    [
      langReady, demoReady, cartReady, orderReady, lang, storedLang, setStoredLang,
      t, demo, setDemo, cart, setCart, addToCart, order, setOrder, dishNos, setDishNos,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}
