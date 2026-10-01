/* eslint-disable @next/next/no-img-element -- public 의 로고 이미지를 그대로 사용 */
"use client";

import { CaretLeft } from "@/components/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { OrderRequestItem } from "@/components/OrderRequestItem";
import { EmptyView, ErrorView, LoadingView } from "@/components/StateViews";
import { useApp } from "@/context/AppContext";
import { useStore } from "@/hooks/useStores";
import { pickText, translate } from "@/i18n";
import { getOrderNumber } from "@/lib/api";
import { cartTotal, selectedOptions } from "@/lib/cart";
import { formatPrice, formatPriceKo } from "@/lib/format";

/** 9. 사장님께 보여주기: 본문은 전부 한국어, 각 줄 아래 사용자 언어 번역을 작게 */
export default function ShowOrderPage() {
  const router = useRouter();
  const { lang, t, ready, cart, cartStoreId, placeOrder, orderNo, setOrderNo } = useApp();
  const data = useStore(cartStoreId ?? "");
  const store = data.status === "ok" ? data.store : null;
  const ko = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) =>
    translate("ko", key, vars);

  // 이 화면을 처음 열 때 주문번호 발급 (장바구니가 그대로면 같은 번호 유지)
  useEffect(() => {
    if (!ready || !cart.length || orderNo !== null) return;
    let alive = true;
    getOrderNumber().then((n) => alive && setOrderNo(n));
    return () => {
      alive = false;
    };
  }, [ready, cart.length, orderNo, setOrderNo]);

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
    <main className="flex flex-1 flex-col bg-ink">
      <header className="px-5 pb-5 pt-safe text-white">
        <button
          className="mb-2 min-h-11 text-sm text-white/80"
          onClick={() => router.back()}
          aria-label={t("common.back")}
        >
          <CaretLeft weight="bold" className="mr-0.5 inline align-[-3px]" />{t("common.back")}
        </button>
        <h1 className="font-display text-3xl leading-tight">사장님께 이 화면을 보여주세요</h1>
        {lang !== "ko" && <p className="mt-1 text-white/80">{t("show.hint")}</p>}
      </header>

      {/* 주문서: 사장님이 읽는 한국어는 크게, 손님 언어는 작게 */}
      <section className="mx-3 flex-1 rounded-t-3xl bg-white px-5 pb-6 pt-5">
        <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-zinc-200 pb-3">
          <div className="min-w-0">
            <p className="truncate font-display text-2xl text-ink">{store.name_ko}</p>
            <img src="/logo.png" alt="" aria-hidden className="mt-1 h-7 w-auto" />
          </div>
          {/* 주문번호: 사장님이 이 번호로 부르면 손님 대기 화면에도 같은 번호 */}
          <div className="shrink-0 rounded-2xl bg-brand px-4 py-2 text-center text-white">
            <p className="text-xs font-semibold opacity-90">주문번호</p>
            <p className="font-display text-4xl leading-none">{orderNo ?? "…"}</p>
          </div>
        </div>
        <ul className="divide-y divide-zinc-100">
          {cart.map((item) => {
            const menu = store.menus.find((m) => m.id === item.menu_id);
            if (!menu) return null;
            const userName = menu.translations[lang]?.name ?? menu.name_ko;
            return (
              <li key={item.key} className="space-y-2 py-5">
                <p className="font-display text-4xl leading-tight text-ink">
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
                  {/* 손님이 말하거나 입력한 요청: 한국어 번역을 크게, 원문을 작게 */}
                  {item.custom_requests?.map((r, i) => (
                    <OrderRequestItem key={`custom-${i}`} ko={r.ko} translated={r.text} />
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>

        <div className="border-t-2 border-dashed border-zinc-200 pt-5">
          <p className="font-display text-3xl text-ink">{ko("show.total", { price: formatPriceKo(total) })}</p>
          <p className="mt-1 text-2xl font-bold text-ink">{ko("show.payCounter")}</p>
          {lang !== "ko" && (
            <p className="mt-1 text-sm text-zinc-500">
              {t("show.total", { price: formatPrice(total, lang) })} · {t("show.payCounter")}
            </p>
          )}
        </div>
      </section>

      <footer className="sticky bottom-0 mx-3 bg-white px-2 pt-2 pb-safe">
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
