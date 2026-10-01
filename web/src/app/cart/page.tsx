"use client";

import { CaretLeft, CreditCard, Microphone } from "@/components/Icon";
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
    <header className="app-bar flex items-center gap-2 px-2 pb-2 pt-safe">
      <button className="icon-btn shadow-none" onClick={() => router.back()} aria-label={t("common.back")}>
        <CaretLeft weight="bold" />
      </button>
      <h1 className="font-display text-2xl text-ink">{t("cart.title")}</h1>
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
                className="h-20 w-20 shrink-0 rounded-2xl bg-rice object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[17px] font-bold text-ink">{name}</p>
                {name !== menu.name_ko && <p className="text-xs text-zinc-500">{menu.name_ko}</p>}
                {selectedOptions(menu, item.option_ids).map((o) => (
                  <p key={o.id} className="text-sm text-zinc-600">
                    · {pickText(o.translations, lang, o.name_ko)}
                  </p>
                ))}
                {item.custom_requests?.map((r, i) => (
                  <p key={i} className="text-sm text-zinc-600">
                    · <Microphone className="inline align-[-2px]" /> “{r.text}”
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
                  <span className="font-display text-lg text-ink">{formatPrice(lineTotal(menu, item), lang)}</span>
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

      <footer className="sticky bottom-0 border-t border-black/5 bg-white/90 px-4 pt-4 pb-safe backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-ink">{t("cart.total")}</span>
          <span className="font-display text-3xl text-ink">{formatPrice(total, lang)}</span>
        </div>
        <p className="mt-2 rounded-xl bg-rice px-3 py-2 text-sm text-ink">
          <CreditCard className="mr-1 inline align-[-3px]" />{t("cart.payNotice")}
        </p>
        <Link href="/show-order" className="btn-primary mt-3 w-full">
          {t("cart.showOwner")}
        </Link>
      </footer>
    </main>
  );
}
