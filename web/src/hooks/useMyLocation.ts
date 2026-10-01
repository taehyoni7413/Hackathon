"use client";

import { useCallback, useEffect, useState } from "react";

import { SCHOOL_COORD } from "@/config/location";
import { useApp } from "@/context/AppContext";
import type { Coord } from "@/types/models";

export type LocationStatus = "loading" | "ok" | "denied" | "demo";

/** 브라우저 현재 위치 1회 조회. 실패하면 null */
export function getCurrentCoord(timeoutMs = 8000): Promise<Coord | null> {
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 10000 },
    );
  });
}

/**
 * 내 위치. 데모 모드면 학교 좌표 고정,
 * 권한 거부·실패 시 학교 좌표 + status "denied" (화면에서 안내 문구 표시)
 */
export function useMyLocation() {
  const { demo, ready } = useApp();
  const [coord, setCoord] = useState<Coord>(SCHOOL_COORD);
  const [status, setStatus] = useState<LocationStatus>("loading");

  const refresh = useCallback(async (): Promise<Coord> => {
    if (demo) {
      setCoord(SCHOOL_COORD);
      setStatus("demo");
      return SCHOOL_COORD;
    }
    setStatus("loading");
    const c = await getCurrentCoord();
    setCoord(c ?? SCHOOL_COORD);
    setStatus(c ? "ok" : "denied");
    return c ?? SCHOOL_COORD;
  }, [demo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 위치 조회는 외부 시스템 동기화
    if (ready) void refresh();
  }, [ready, refresh]);

  return { coord, status, refresh };
}
