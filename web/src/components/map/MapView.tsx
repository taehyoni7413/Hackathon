"use client";

import dynamic from "next/dynamic";

import type { MapViewProps } from "./types";

/**
 * 지도 진입점. window가 필요한 지도 SDK는 클라이언트에서만 불러온다.
 * 나중에 Leaflet 구현을 추가하면 여기서 골라 쓰면 된다.
 */
const KakaoMapView = dynamic(() => import("./KakaoMapView"), { ssr: false });

export function MapView(props: MapViewProps) {
  return <KakaoMapView {...props} />;
}

export type { MapMarker, MapViewProps } from "./types";
