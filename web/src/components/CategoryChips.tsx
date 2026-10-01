"use client";

import { useEffect, useRef } from "react";

import { useApp } from "@/context/AppContext";
import type { MessageKey } from "@/i18n";
import { CATEGORIES, type Category } from "@/types/models";

export type CategoryFilter = Category | "all";

/**
 * 카테고리 칩: 옆으로 넘기는 한 줄 (오른쪽 설정 버튼은 고정, 칩만 움직임).
 * 휴대폰은 손가락으로, PC(발표 화면의 iPhone 틀)는 마우스로 끌거나 휠로 넘긴다.
 */
export function CategoryChips({
  value,
  onChange,
}: {
  value: CategoryFilter;
  onChange: (c: CategoryFilter) => void;
}) {
  const { t } = useApp();
  const items: CategoryFilter[] = ["all", ...CATEGORIES];
  const scroller = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);

  // 고른 칩이 가려져 있으면 보이게
  useEffect(() => {
    scroller.current
      ?.querySelector<HTMLElement>(`[data-cat="${value}"]`)
      ?.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
  }, [value]);

  return (
    <div
      ref={scroller}
      className="flex snap-x gap-2 overflow-x-auto scroll-px-4 px-4 pb-1 [mask-image:linear-gradient(to_right,black_85%,transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      // 마우스 끌기 (터치는 브라우저 기본 스크롤)
      onPointerDown={(e) => {
        if (e.pointerType !== "mouse") return;
        drag.current = { x: e.clientX, left: e.currentTarget.scrollLeft, moved: false };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const dx = e.clientX - d.x;
        if (Math.abs(dx) > 4) d.moved = true;
        e.currentTarget.scrollLeft = d.left - dx;
      }}
      onPointerUp={() => {
        // 끌었으면 바로 뒤 클릭(칩 선택)은 무시
        setTimeout(() => (drag.current = null), 0);
      }}
      onPointerLeave={() => (drag.current = null)}
      onClickCapture={(e) => {
        if (drag.current?.moved) e.stopPropagation();
      }}
      // 마우스 휠(세로)을 가로로
      onWheel={(e) => {
        if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY;
      }}
    >
      {items.map((c) => {
        const active = c === value;
        return (
          <button
            key={c}
            data-cat={c}
            onClick={() => onChange(c)}
            className={`min-h-11 shrink-0 snap-start rounded-full px-4 text-sm font-semibold shadow-md transition active:scale-95 ${
              active ? "bg-ink text-white" : "bg-white text-ink"
            }`}
          >
            {t(`cat.${c}` as MessageKey)}
          </button>
        );
      })}
      {/* 마지막 칩이 흐림 표시에 가리지 않도록 끝 여백 */}
      <span className="w-6 shrink-0" aria-hidden />
    </div>
  );
}
