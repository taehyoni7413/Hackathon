"use client";

import { Hourglass } from "@/components/Icon";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { DishNo } from "@/components/DishNo";
import { SmartImage, defaultImage } from "@/components/SmartImage";
import { EmptyView, ErrorView, LoadingView } from "@/components/StateViews";
import { useApp } from "@/context/AppContext";
import { useStore } from "@/hooks/useStores";

/** 10. 대기: 사장님이 메뉴 이름을 부를 때 알아들을 수 있게 한국어 이름을 크게 */
export default function WaitingPage() {
  const router = useRouter();
  const { lang, t, ready, order, finishOrder } = useApp();
  const data = useStore(order?.store_id ?? "");
  const store = data.status === "ok" ? data.store : null;

  if (!ready || (order && data.status === "loading")) return <LoadingView />;
  if (data.status === "error") return <ErrorView onRetry={data.reload} />;
  if (!order || !store) {
    return (
      <main className="flex flex-1 flex-col">
        <EmptyView label={t("show.empty")} />
        <div className="p-4">
          <Link href="/map" className="btn-secondary w-full">{t("done.backMap")}</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col bg-rice">
      <header className="px-5 pb-4 pt-safe text-center">
        <p className="mt-6 flex justify-center text-6xl text-brand" aria-hidden><Hourglass /></p>
        <h1 className="mt-3 font-display text-3xl text-ink">{t("wait.title")}</h1>
        <p className="mt-2 text-zinc-600">{t("wait.hint")}</p>
      </header>

      <ul className="flex-1 space-y-4 px-5">
        {order.items.map((item) => {
          const menu = store.menus.find((m) => m.id === item.menu_id);
          if (!menu) return null;
          return (
            <li key={item.key} className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm">
              {/* 음식 번호: 사장님 주문서와 같은 번호 */}
              <DishNo n={item.no} />
              <SmartImage
                src={menu.image_url}
                fallback={defaultImage(store.category)}
                alt={menu.name_ko}
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0">
                <p lang="ko" className="font-display text-3xl leading-tight text-ink">{menu.name_ko}</p>
                {/* 한국어 화면이면 발음·번역 없이 수량만 */}
                {lang !== "ko" && (
                  <p className="text-base font-semibold text-brand-dark">{menu.pronunciation}</p>
                )}
                <p className="text-sm text-zinc-500">
                  {lang !== "ko" && `${menu.translations[lang]?.name ?? menu.name_ko} `}× {item.quantity}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="sticky bottom-0 bg-rice px-4 pt-4 pb-safe">
        <button
          className="btn-primary w-full"
          onClick={() => {
            finishOrder();
            router.push("/done");
          }}
        >
          {t("wait.received")}
        </button>
      </footer>
    </main>
  );
}
