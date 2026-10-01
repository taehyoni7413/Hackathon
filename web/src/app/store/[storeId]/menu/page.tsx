"use client";

import { Camera, ShoppingCartSimple } from "@/components/Icon";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { AiNotice, DietBadges } from "@/components/DietBadges";
import { MenuBoardViewer } from "@/components/MenuBoardViewer";
import { MenuDetailSheet } from "@/components/MenuDetailSheet";
import { SmartImage, defaultImage } from "@/components/SmartImage";
import { EmptyView, ErrorView, LoadingView } from "@/components/StateViews";
import { useApp } from "@/context/AppContext";
import { useStore } from "@/hooks/useStores";
import { pickText } from "@/i18n";
import { cartTotal } from "@/lib/cart";
import { formatPrice } from "@/lib/format";
import type { Menu } from "@/types/models";

/** 7. 메뉴 (티오더 스타일) */
export default function MenuPage() {
  const { storeId } = useParams<{ storeId: string }>();
  const router = useRouter();
  const { lang, t, cart, cartStoreId, addToCart, clearCart } = useApp();
  const data = useStore(storeId);
  const [boardOpen, setBoardOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<Menu | null>(null);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const sections = useRef<Record<string, HTMLElement | null>>({});

  const store = data.status === "ok" ? data.store : null;

  const groups = useMemo(() => {
    const map = new Map<string, Menu[]>();
    store?.menus.forEach((m) => map.set(m.menu_category, [...(map.get(m.menu_category) ?? []), m]));
    return [...map.entries()];
  }, [store]);

  if (data.status === "loading") return <LoadingView />;
  if (data.status === "error") return <ErrorView onRetry={data.reload} />;
  if (!store) return <ErrorView />;

  const name = pickText(store.name, lang, store.name_ko);
  const myCart = cartStoreId === store.id ? cart : [];
  const count = myCart.reduce((s, c) => s + c.quantity, 0);

  return (
    <main className="flex flex-1 flex-col pb-28">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <div className="flex items-center gap-2 px-2 pt-2">
          <button
            className="icon-btn shadow-none"
            onClick={() => router.push(`/map?store=${store.id}`)}
            aria-label={t("common.back")}
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold">{name}</h1>
            {name !== store.name_ko && <p className="truncate text-xs text-zinc-500">{store.name_ko}</p>}
          </div>
          {/* 원본 메뉴판 사진이 없는 가게(예: Appro)는 버튼을 숨긴다 */}
          {store.menu_board_images.length > 0 && (
            <button
              className="min-h-11 shrink-0 rounded-full bg-zinc-900 px-3 text-sm font-semibold text-white"
              onClick={() => setBoardOpen(true)}
            >
              <Camera className="mr-1 inline align-[-3px]" />{t("menu.viewBoard")}
            </button>
          )}
        </div>
        {/* 카테고리 탭 */}
        <nav className="flex gap-1 overflow-x-auto px-2 [scrollbar-width:none]">
          {groups.map(([cat, menus]) => {
            const label = pickText(menus[0].menu_category_name, lang, cat);
            const active = (activeCat ?? groups[0]?.[0]) === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setActiveCat(cat);
                  sections.current[cat]?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={`min-h-11 shrink-0 border-b-2 px-3 text-sm font-semibold ${
                  active ? "border-brand text-brand-dark" : "border-transparent text-zinc-500"
                }`}
              >
                {label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="px-4 pt-3">
        <AiNotice />
      </div>

      {groups.length === 0 ? (
        <EmptyView label={t("menu.empty")} />
      ) : (
        groups.map(([cat, menus]) => (
          <section
            key={cat}
            ref={(el) => {
              sections.current[cat] = el;
            }}
            className="scroll-mt-28 px-4 pt-5"
          >
            <h2 className="mb-1 font-display text-2xl text-ink">{pickText(menus[0].menu_category_name, lang, cat)}</h2>
            <ul className="divide-y divide-zinc-100">
              {menus.map((m) => {
                const tr = m.translations[lang];
                return (
                  <li key={m.id}>
                    <button onClick={() => setOpenMenu(m)} className="flex w-full items-start gap-4 py-4 text-left">
                      <SmartImage
                        src={m.image_url}
                        fallback={defaultImage(store.category)}
                        alt={tr?.name ?? m.name_ko}
                        className="h-28 w-28 shrink-0 rounded-2xl bg-rice object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[17px] font-bold leading-snug text-ink">{tr?.name ?? m.name_ko}</p>
                        {(tr?.name ?? m.name_ko) !== m.name_ko && (
                          <p className="text-sm text-zinc-500">{m.name_ko}</p>
                        )}
                        {tr?.description && (
                          <p className="mt-1 line-clamp-2 text-sm leading-snug text-zinc-600">{tr.description}</p>
                        )}
                        <p className="mt-1.5 font-display text-xl text-ink">{formatPrice(m.price, lang)}</p>
                        <div className="mt-1.5">
                          <DietBadges menu={m} />
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}

      {/* 장바구니 버튼 */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-[480px] px-4 pt-4 pb-safe">
          <Link href="/cart" className="btn-primary w-full shadow-lg">
            <ShoppingCartSimple className="mr-1.5" />{t("menu.cartBtn", { n: count, price: formatPrice(cartTotal(store.menus, myCart), lang) })}
          </Link>
        </div>
      )}

      {boardOpen && <MenuBoardViewer images={store.menu_board_images} onClose={() => setBoardOpen(false)} />}

      {openMenu && (
        <MenuDetailSheet
          menu={openMenu}
          fallbackImage={defaultImage(store.category)}
          onClose={() => setOpenMenu(null)}
          onAdd={(quantity, option_ids, custom_requests) => {
            if (cartStoreId && cartStoreId !== store.id) {
              if (!window.confirm(t("cart.replaceStore"))) return;
              clearCart();
            }
            addToCart({ store_id: store.id, menu_id: openMenu.id, quantity, option_ids, custom_requests });
            setOpenMenu(null);
          }}
        />
      )}
    </main>
  );
}
