"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { OrderRequestItem } from "@/components/OrderRequestItem";
import { EmptyView, ErrorView, LoadingView } from "@/components/StateViews";
import { useApp } from "@/context/AppContext";
import { useStore } from "@/hooks/useStores";
import { pickText, translate } from "@/i18n";
import { cartTotal, selectedOptions } from "@/lib/cart";
import { formatPrice, formatPriceKo } from "@/lib/format";

/** 9. 사장님께 보여주기: 본문은 전부 한국어, 각 줄 아래 사용자 언어 번역을 작게 */
export default function ShowOrderPage() {
  const router = useRouter();
  const { lang, t, ready, cart, cartStoreId, placeOrder } = useApp();
  const data = useStore(cartStoreId ?? "");
  const store = data.status === "ok" ? data.store : null;
  const ko = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
    translate("ko", key, vars);

  if (!ready || (cartStoreId && data.status === "loading")) return <LoadingView />;
  if (data.status === "error") return <ErrorView onRetry={data.reload} />;
  if (!cart.length || !store) {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyView label={t("show.empty")} />
        <div className="p-4">
          <Link href="/map" className="btn-secondary w-full">{t("done.backMap")}</Link>
        </div>
      </main>
    );
  }

  const total = cartTotal(store.menus, cart);

  return (
    <main className="flex flex-1 flex-col bg-white">
      <header className="bg-brand px-5 pb-5 pt-safe text-white">
        <button
          className="mb-2 min-h-11 text-sm text-white/90"
          onClick={() => router.back()}
          aria-label={t("common.back")}
        >
          ← {t("common.back")}
        </button>
        <h1 className="text-3xl font-extrabold leading-tight">사장님께 이 화면을 보여주세요</h1>
        {lang !== "ko" && <p className="mt-1 text-white/90">{t("show.hint")}</p>}
      </header>

      <section className="flex-1 space-y-6 px-5 py-6">
        <p className="text-xl font-semibold text-zinc-500">{store.name_ko}</p>
        <ul className="space-y-6">
          {cart.map((item) => {
            const menu = store.menus.find((m) => m.id === item.menu_id);
            if (!menu) return null;
            const userName = menu.translations[lang]?.name ?? menu.name_ko;
            return (
              <li key={item.key} className="space-y-2">
                <p className="text-3xl font-extrabold text-zinc-900">
                  {ko("show.item", { name: menu.name_ko, n: item.quantity })}
                </p>
                {lang !== "ko" && (
                  <p className="text-sm text-zinc-500">
                    {t("show.item", { name: userName, n: item.quantity })}
                  </p>
                )}
                <ul className="space-y-2">
                  {selectedOptions(menu, item.option_ids).map((o) => (
                    <OrderRequestItem
                      key={o.id}
                      ko={o.name_ko}
                      translated={lang !== "ko" ? pickText(o.translations, lang) : undefined}
                    />
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>

        <div className="border-t-2 border-dashed border-zinc-200 pt-5">
          <p className="text-2xl font-bold">{ko("show.total", { price: formatPriceKo(total) })}</p>
          <p className="text-2xl font-bold">{ko("show.payCounter")}</p>
          {lang !== "ko" && (
            <p className="mt-1 text-sm text-zinc-500">
              {t("show.total", { price: formatPrice(total, lang) })} · {t("show.payCounter")}
            </p>
          )}
        </div>
      </section>

      <footer className="sticky bottom-0 bg-white px-4 pt-4 pb-safe">
        <button
          className="btn-primary w-full"
          onClick={() => {
            placeOrder();
            router.push("/waiting");
          }}
        >
          {t("show.done")}
        </button>
      </footer>
    </main>
  );
}
