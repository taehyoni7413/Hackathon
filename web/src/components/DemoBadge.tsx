"use client";

import { useApp } from "@/context/AppContext";

/** 데모 모드일 때 화면 구석에 작게 표시 */
export function DemoBadge() {
  const { demo } = useApp();
  if (!demo) return null;
  return (
    <div className="pointer-events-none fixed bottom-2 left-2 z-[100] rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
      DEMO
    </div>
  );
}
