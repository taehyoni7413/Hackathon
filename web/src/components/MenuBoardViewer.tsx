/* eslint-disable @next/next/no-img-element -- 원본 메뉴판 사진을 확대해서 보기 위해 img 사용 */
"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import {
  ArrowCounterClockwise,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  X,
} from "@/components/Icon";
import { useApp } from "@/context/AppContext";

const MIN = 1;
const MAX = 5;
const DOUBLE_TAP_SCALE = 2.5;

type View = { scale: number; x: number; y: number };
const RESET: View = { scale: 1, x: 0, y: 0 };

/**
 * 원본 메뉴판 보기: 사진을 화면 가운데에 두고 확대해서 읽는다.
 * 앱은 페이지 확대(핀치)를 막아 두었으므로 여기서 직접 처리:
 * 두 번 탭/클릭 확대·축소, 두 손가락 확대, 끌어서 이동, PC 휠 확대, ＋/− 버튼.
 */
export function MenuBoardViewer({ images, onClose }: { images: string[]; onClose: () => void }) {
  const { t } = useApp();
  const [index, setIndex] = useState(0);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white" role="dialog" aria-modal>
      <div className="flex items-center justify-between px-3 pb-2 pt-safe">
        <h2 className="font-display text-2xl">{t("menu.boardTitle")}</h2>
        <button
          className="icon-btn bg-white/15 text-white shadow-none"
          onClick={onClose}
          aria-label={t("common.close")}
        >
          <X weight="bold" />
        </button>
      </div>

      {images.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-white/70">{t("menu.noBoard")}</p>
      ) : (
        <>
          {/* 사진이 바뀌면 확대 상태를 새로 시작 */}
          <ZoomableImage key={images[index]} src={images[index]} alt={t("menu.boardTitle")} />
          {images.length > 1 && (
            <div className="flex justify-center gap-2 pb-2">
              {images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setIndex(i)}
                  className={`h-2.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2.5 bg-white/40"}`}
                  aria-label={`${i + 1}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const { t } = useApp();
  const box = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(RESET);
  const [animate, setAnimate] = useState(true);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ dist: number; scale: number; x: number; y: number; mx: number; my: number } | null>(null);
  const lastTap = useRef(0);

  /** 확대해도 사진이 화면 밖으로 너무 나가지 않게 이동 범위 제한 */
  const clamp = (v: View): View => {
    const el = box.current;
    if (!el || v.scale <= 1) return RESET;
    const maxX = (el.clientWidth * (v.scale - 1)) / 2;
    const maxY = (el.clientHeight * (v.scale - 1)) / 2;
    return {
      scale: v.scale,
      x: Math.max(-maxX, Math.min(maxX, v.x)),
      y: Math.max(-maxY, Math.min(maxY, v.y)),
    };
  };

  /** (cx, cy) 지점을 기준으로 배율 변경 — 누른 곳이 그대로 손가락 아래에 남도록 */
  const zoomAt = (next: number, cx: number, cy: number, from: View = view) => {
    const el = box.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = cx - r.left - r.width / 2;
    const py = cy - r.top - r.height / 2;
    const scale = Math.max(MIN, Math.min(MAX, next));
    const k = scale / from.scale;
    setView(clamp({ scale, x: px - (px - from.x) * k, y: py - (py - from.y) * k }));
  };

  const center = () => {
    const r = box.current?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 0, y: 0 };
  };

  const onDown = (e: ReactPointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setAnimate(false);
    const pts = [...pointers.current.values()];
    if (pts.length === 2) {
      const [a, b] = pts;
      gesture.current = {
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        scale: view.scale,
        x: view.x,
        y: view.y,
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
      };
    } else {
      gesture.current = { dist: 0, scale: view.scale, x: view.x, y: view.y, mx: e.clientX, my: e.clientY };
    }
  };

  const onMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];
    if (pts.length >= 2 && g.dist > 0) {
      // 두 손가락: 거리 비율만큼 확대 + 가운데 지점 이동만큼 끌기
      const [a, b] = pts;
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const base = { scale: g.scale, x: g.x + (mx - g.mx), y: g.y + (my - g.my) };
      zoomAt((g.scale * Math.hypot(a.x - b.x, a.y - b.y)) / g.dist, mx, my, base);
    } else if (pts.length === 1 && view.scale > 1) {
      setView(clamp({ scale: view.scale, x: g.x + (e.clientX - g.mx), y: g.y + (e.clientY - g.my) }));
    }
  };

  const onUp = (e: ReactPointerEvent) => {
    const g = gesture.current;
    const moved = g ? Math.hypot(e.clientX - g.mx, e.clientY - g.my) > 8 : true;
    pointers.current.delete(e.pointerId);
    setAnimate(true);
    if (pointers.current.size > 0) {
      // 두 손가락 중 하나만 뗐으면 남은 손가락으로 계속 끌기
      const [p] = [...pointers.current.values()];
      gesture.current = { dist: 0, scale: view.scale, x: view.x, y: view.y, mx: p.x, my: p.y };
      return;
    }
    gesture.current = null;
    if (moved) return;
    // 두 번 탭/클릭: 확대 ↔ 원래 크기
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      if (view.scale > 1) setView(RESET);
      else zoomAt(DOUBLE_TAP_SCALE, e.clientX, e.clientY);
    } else {
      lastTap.current = now;
    }
  };

  const zoomed = view.scale > 1.01;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={box}
        className={`relative flex min-h-0 flex-1 touch-none select-none items-center justify-center overflow-hidden px-3 ${
          zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"
        }`}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        onWheel={(e) => {
          setAnimate(false);
          zoomAt(view.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.clientX, e.clientY);
        }}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-full max-w-full rounded-lg object-contain"
          style={{
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            transition: animate ? "transform 0.2s ease-out" : "none",
          }}
        />
      </div>

      {/* 안내 + 확대 버튼 (PC 발표 화면에서도 쓰기 쉽게) */}
      <div className="flex items-center justify-between gap-3 px-4 pb-safe pt-3">
        <p className="text-sm text-white/70">{zoomed ? `${Math.round(view.scale * 100)}%` : t("menu.zoomHint")}</p>
        <div className="flex gap-2">
          <button
            className="icon-btn bg-white/15 text-white shadow-none disabled:opacity-30"
            onClick={() => {
              const c = center();
              zoomAt(view.scale / 1.5, c.x, c.y);
            }}
            disabled={!zoomed}
            aria-label={t("menu.zoomOut")}
          >
            <MagnifyingGlassMinus />
          </button>
          <button
            className="icon-btn bg-white/15 text-white shadow-none disabled:opacity-30"
            onClick={() => {
              const c = center();
              zoomAt(view.scale * 1.5, c.x, c.y);
            }}
            disabled={view.scale >= MAX}
            aria-label={t("menu.zoomIn")}
          >
            <MagnifyingGlassPlus />
          </button>
          <button
            className="icon-btn bg-white/15 text-white shadow-none disabled:opacity-30"
            onClick={() => setView(RESET)}
            disabled={!zoomed}
            aria-label={t("menu.zoomReset")}
          >
            <ArrowCounterClockwise />
          </button>
        </div>
      </div>
    </div>
  );
}
