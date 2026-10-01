"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { SmartImage, defaultImage } from "@/components/SmartImage";
import { EmptyView, ErrorView, LoadingView } from "@/components/StateViews";
import { useApp } from "@/context/AppContext";
import { useStore } from "@/hooks/useStores";
import { pickText } from "@/i18n";
import { cartTotal, lineTotal, selectedOptions } from "@/lib/cart";
import { formatPrice } from "@/lib/format";

/** 8. 장바구니 (결제 없음 — 결제는 매장에서) */
export default function CartPage() {
  const router = useRouter();
  const { lang, t, ready, cart, cartStoreId, setQuantity, removeFromCart } = useApp();
  const data = useStore(cartStoreId ?? "");
  const store = data.status === "ok" ? data.store : null;

  const header = (
    <header className="sticky top-0 z-10 flex items-center gap-2 bg-white px-2 py-2 shadow-sm">
      <button className="icon-btn shadow-none" onClick={() => router.back()} aria-label={t("common.back")}>
        ←
      </button>
      <h1 className="text-lg font-bold">{t("cart.title")}</h1>
    </header>
  );

  if (!ready || (cartStoreId && data.status === "loading")) {
    return <>{header}<LoadingView /></>;
  }
  if (data.status === "error") return <>{header}<ErrorView onRetry={data.reload} /></>;
  if (!cart.length || !store) {
    return (
      <main className="flex flex-1 flex-col">
        {header}
        <EmptyView label={t("cart.empty")} />
        <div className="p-4">
          <Link href="/map" className="btn-secondary w-full">{t("done.backMap")}</Link>
        </div>
      </main>
    );
  }

  const total = cartTotal(store.menus, cart);

  return (
    <main className="flex flex-1 flex-col">
      {header}
      <p className="px-4 pt-3 font-semibold text-zinc-600">
        {pickText(store.name, lang, store.name_ko)}
      </p>

      <ul className="flex-1 divide-y divide-zinc-100 px-4">
        {cart.map((item) => {
          const menu = store.menus.find((m) => m.id === item.menu_id);
          if (!menu) return null;
          const name = menu.translations[lang]?.name ?? menu.name_ko;
          return (
            <li key={item.key} className="flex gap-3 py-4">
              <SmartImage
                src={menu.image_url}
                fallback={defaultImage(store.category)}
                alt={name}
                className="h-16 w-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{name}</p>
                <p className="text-xs text-zinc-500">{menu.name_ko}</p>
                {selectedOptions(menu, item.option_ids).map((o) => (
                  <p key={o.id} className="text-sm text-zinc-600">
                    · {pickText(o.translations, lang, o.name_ko)}
                  </p>
                ))}
                {item.custom_requests?.map((r, i) => (
                  <p key={i} className="text-sm text-zinc-600">
                    · 🎤 “{r.text}”
                  </p>
                ))}
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      className="icon-btn h-11 w-11 border border-zinc-200 shadow-none"
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                      aria-label="-"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold">{item.quantity}</span>
                    <button
                      className="icon-btn h-11 w-11 border border-zinc-200 shadow-none"
                      onClick={() => setQuantity(item.key, item.quantity + 1)}
                      aria-label="+"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-semibold">{formatPrice(lineTotal(menu, item), lang)}</span>
                </div>
                <button
                  className="mt-1 min-h-11 text-sm text-zinc-500 underline"
                  onClick={() => removeFromCart(item.key)}
                >
                  {t("cart.remove")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="sticky bottom-0 border-t border-zinc-100 bg-white px-4 pt-4 pb-safe">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>{t("cart.total")}</span>
          <span>{formatPrice(total, lang)}</span>
        </div>
        <p className="mt-1 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          💳 {t("cart.payNotice")}
        </p>
        <Link href="/show-order" className="btn-primary mt-3 w-full">
          {t("cart.showOwner")}
        </Link>
      </footer>
    </main>
  );
}
