"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export type Snap = "collapsed" | "half" | "full";

const COLLAPSED_PX = 132;

export function snapHeight(snap: Snap, viewport: number) {
  if (snap === "collapsed") return COLLAPSED_PX;
  if (snap === "half") return Math.round(viewport * 0.5);
  // 펼침: 위쪽 AI 검색창·카테고리 칩(안전 영역 포함 약 180px)이 가리지 않는 높이까지
  return Math.min(Math.round(viewport * 0.88), viewport - 180);
}

export function useViewportHeight() {
  const [h, setH] = useState(800);
  useEffect(() => {
    // 넓은 화면의 iPhone 틀(globals.css)과 같은 조건이면 틀 높이, 아니면 실제 화면 높이
    const update = () =>
      setH(
        window.matchMedia("(min-width: 640px) and (min-height: 720px)").matches
          ? Math.min(852, window.innerHeight - 48)
          : window.innerHeight,
      );
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return h;
}

/**
 * 손잡이를 끌어 접힘/중간/펼침 3단계로 바뀌는 바텀시트.
 * header는 항상 보이는 영역(손잡이 아래), children은 스크롤 영역, footer는 하단 고정.
 */
export function BottomSheet({
  snap,
  onSnapChange,
  header,
  footer,
  children,
}: {
  snap: Snap;
  onSnapChange: (s: Snap) => void;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const vh = useViewportHeight();
  const [dragH, setDragH] = useState<number | null>(null);
  const start = useRef<{ y: number; h: number } | null>(null);
  const height = dragH ?? snapHeight(snap, vh);

  const onDown = (e: React.PointerEvent) => {
    start.current = { y: e.clientY, h: height };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const next = start.current.h + (start.current.y - e.clientY);
    setDragH(Math.max(COLLAPSED_PX - 40, Math.min(vh * 0.92, next)));
  };
  const onUp = () => {
    if (!start.current) return;
    const moved = dragH === null ? 0 : dragH - start.current.h;
    start.current = null;
    if (dragH === null || Math.abs(moved) < 6) {
      // 탭: 한 단계씩 올리기 (펼침에서는 접기)
      onSnapChange(snap === "collapsed" ? "half" : snap === "half" ? "full" : "collapsed");
    } else {
      const snaps: Snap[] = ["collapsed", "half", "full"];
      const nearest = snaps.reduce((a, b) =>
        Math.abs(snapHeight(a, vh) - dragH) < Math.abs(snapHeight(b, vh) - dragH) ? a : b,
      );
      onSnapChange(nearest);
    }
    setDragH(null);
  };

  return (
    <section
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col rounded-t-3xl bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.12)]"
      style={{
        height,
        transition: dragH === null ? "height 220ms ease" : "none",
      }}
    >
      <div
        className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        role="button"
        aria-label="drag"
      >
        <span className="h-1.5 w-12 rounded-full bg-zinc-300" />
      </div>
      {header && <div className="shrink-0 px-4">{header}</div>}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
      {footer && <div className="shrink-0 border-t border-zinc-100 bg-white px-4 pt-4 pb-safe">{footer}</div>}
    </section>
  );
}
