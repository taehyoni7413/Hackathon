/* eslint-disable @next/next/no-img-element -- 원본 메뉴판 사진을 확대해서 보기 위해 img 사용 */
"use client";

import { useState } from "react";

import { useApp } from "@/context/AppContext";

/** 원본 메뉴판 보기: 번역과 원본을 비교할 수 있게 직접 찍은 사진을 확대해서 보여준다 */
export function MenuBoardViewer({ images, onClose }: { images: string[]; onClose: () => void }) {
  const { t } = useApp();
  const [zoom, setZoom] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 text-white" role="dialog" aria-modal>
      <div className="flex items-center justify-between p-3">
        <h2 className="text-lg font-bold">{t("menu.boardTitle")}</h2>
        <button
          className="icon-btn bg-white/15 text-white shadow-none"
          onClick={() => (zoom ? setZoom(null) : onClose())}
          aria-label={t("common.close")}
        >
          ✕
        </button>
      </div>

      {zoom ? (
        // 확대 보기: 스크롤 + 브라우저 핀치 줌
        <div className="flex-1 overflow-auto [touch-action:pan-x_pan-y_pinch-zoom]">
          <img src={zoom} alt={t("menu.boardTitle")} className="w-[200%] max-w-none" />
        </div>
      ) : images.length === 0 ? (
        <p className="flex flex-1 items-center justify-center text-white/70">{t("menu.noBoard")}</p>
      ) : (
        <ul className="flex-1 space-y-3 overflow-y-auto p-3">
          {images.map((src) => (
            <li key={src}>
              <button onClick={() => setZoom(src)} className="block w-full">
                <img src={src} alt={t("menu.boardTitle")} className="w-full rounded-xl" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
