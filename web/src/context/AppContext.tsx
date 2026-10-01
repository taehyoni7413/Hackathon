"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";

import { usePersistentState } from "@/hooks/usePersistentState";
import {
  DEFAULT_LANG,
  isLang,
  translate,
  type Lang,
  type MessageKey,
} from "@/i18n";
import type { CartItem } from "@/types/models";

export type Order = {
  store_id: string;
  items: CartItem[];
  created_at: string;
};

type AppState = {
  /** localStorage 복원이 끝났는지 (끝나기 전엔 저장값이 아직 반영 안 됨) */
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

  order: Order | null;
  placeOrder: () => void;
  finishOrder: () => void;
};

const Ctx = createContext<AppState | null>(null);

function itemKey(menuId: string, optionIds: string[]) {
  return [menuId, ...[...optionIds].sort()].join("|");
}

export function AppProvider({ children }: { children: ReactNode }) {
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

  const lang: Lang = isLang(storedLang) ? storedLang : DEFAULT_LANG;
  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) =>
      translate(lang, key, vars),
    [lang],
  );

  const addToCart = useCallback(
    (item: Omit<CartItem, "key">) => {
      const key = itemKey(item.menu_id, item.option_ids);
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
      order,
      placeOrder: () => {
        if (!cart.length) return;
        setOrder({
          store_id: cart[0].store_id,
          items: cart,
          created_at: new Date().toISOString(),
        });
        setCart([]);
      },
      finishOrder: () => setOrder(null),
    }),
    [
      langReady, demoReady, cartReady, orderReady, lang, storedLang, setStoredLang,
      t, demo, setDemo, cart, setCart, addToCart, order, setOrder,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}
