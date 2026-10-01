/* eslint-disable @typescript-eslint/no-explicit-any -- 카카오맵 SDK는 타입 정의가 없음 */
"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

import type { MapViewProps } from "./types";

declare global {
  interface Window {
    kakao?: any;
  }
}

const KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;
const LOAD_TIMEOUT_MS = 8000;

const CATEGORY_EMOJI: Record<string, string> = {
  korean: "🍚",
  chinese: "🥟",
  japanese: "🍣",
  western: "🍔",
  fusion: "🍽️",
  snack: "🍢",
  cafe: "☕",
};

/** 카카오맵 구현. autoload=false로 SDK를 받은 뒤 kakao.maps.load() 콜백에서 지도 생성 */
export default function KakaoMapView({
  center,
  myLocation,
  markers,
  selectedId,
  route,
  bottomInset = 0,
  onMarkerClick,
  onUnavailable,
}: MapViewProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const meOverlay = useRef<any>(null);
  const line = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const failed = useRef(false);

  const fail = () => {
    if (failed.current) return;
    failed.current = true;
    onUnavailable?.();
  };

  // 키 없음 / 일정 시간 안에 로딩 안 됨 → 목록 모드
  useEffect(() => {
    if (!KEY) {
      fail();
      return;
    }
    const id = setTimeout(() => {
      if (!map.current) fail();
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 지도 생성
  useEffect(() => {
    if (!ready || !el.current || map.current) return;
    const k = window.kakao;
    try {
      map.current = new k.maps.Map(el.current, {
        center: new k.maps.LatLng(center.lat, center.lng),
        level: 4,
      });
    } catch {
      fail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // 중심 이동 (바텀시트에 가려지는 만큼 위로 보정)
  useEffect(() => {
    if (!map.current) return;
    const k = window.kakao;
    const proj = map.current.getProjection();
    const pt = proj.pointFromCoords(new k.maps.LatLng(center.lat, center.lng));
    const shifted = proj.coordsFromPoint(new k.maps.Point(pt.x, pt.y + bottomInset / 2));
    map.current.panTo(shifted);
  }, [center.lat, center.lng, bottomInset, ready]);

  // 식당 마커
  useEffect(() => {
    if (!map.current) return;
    const k = window.kakao;
    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = markers.map((m) => {
      const node = document.createElement("button");
      const active = m.id === selectedId;
      // 가까운 가게끼리 겹치지 않게 작게. 선택한 가게만 크게 (확대하면 자연히 떨어진다)
      node.className = `flex items-center gap-0.5 whitespace-nowrap rounded-full font-semibold shadow-md ${
        active
          ? "border-2 border-white bg-brand px-2.5 py-1 text-sm text-white"
          : "border-[1.5px] border-brand bg-white px-2 py-0.5 text-xs text-ink"
      }`;
      node.style.minHeight = active ? "34px" : "26px";
      node.textContent = `${CATEGORY_EMOJI[m.category] ?? "🍽️"} ${m.label}`;
      node.onclick = () => onMarkerClick?.(m.id);
      const o = new k.maps.CustomOverlay({
        position: new k.maps.LatLng(m.coord.lat, m.coord.lng),
        content: node,
        yAnchor: 1.2,
        zIndex: active ? 10 : 1,
      });
      o.setMap(map.current);
      return o;
    });
  }, [markers, selectedId, onMarkerClick, ready]);

  // 내 위치
  useEffect(() => {
    if (!map.current) return;
    const k = window.kakao;
    meOverlay.current?.setMap(null);
    if (!myLocation) return;
    const dot = document.createElement("div");
    dot.className = "h-4 w-4 rounded-full border-[3px] border-white bg-blue-500 shadow-[0_0_0_6px_rgba(59,130,246,0.25)]";
    meOverlay.current = new k.maps.CustomOverlay({
      position: new k.maps.LatLng(myLocation.lat, myLocation.lng),
      content: dot,
      zIndex: 20,
    });
    meOverlay.current.setMap(map.current);
  }, [myLocation, ready]);

  // 경로선
  useEffect(() => {
    if (!map.current) return;
    const k = window.kakao;
    line.current?.setMap(null);
    if (!route || route.length < 2) return;
    const path = route.map((c) => new k.maps.LatLng(c.lat, c.lng));
    line.current = new k.maps.Polyline({
      path,
      strokeWeight: 6,
      strokeColor: "#ec8a33",
      strokeOpacity: 0.9,
    });
    line.current.setMap(map.current);
    const bounds = new k.maps.LatLngBounds();
    path.forEach((p: any) => bounds.extend(p));
    map.current.setBounds(bounds, 60, 40, 60 + bottomInset, 40);
  }, [route, bottomInset, ready]);

  if (!KEY) return null;

  return (
    <>
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KEY}&autoload=false`}
        strategy="afterInteractive"
        onReady={() => window.kakao?.maps?.load(() => setReady(true))}
        onError={fail}
      />
      <div ref={el} className="absolute inset-0" />
    </>
  );
}
