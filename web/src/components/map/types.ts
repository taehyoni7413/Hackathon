import type { Category, Coord } from "@/types/models";

export type MapMarker = {
  id: string;
  coord: Coord;
  label: string;
  category: Category;
};

/**
 * 지도 공통 인터페이스. 카카오맵 구현(KakaoMapView)과
 * 나중에 추가할 Leaflet 구현이 같은 props를 받는다.
 */
export type MapViewProps = {
  center: Coord;
  myLocation: Coord | null;
  markers: MapMarker[];
  selectedId?: string | null;
  /** 경로선 좌표 */
  route?: Coord[] | null;
  /** 지도 아래쪽을 가리는 영역(px) — 중심 이동 시 보정용 */
  bottomInset?: number;
  onMarkerClick?: (id: string) => void;
  /** 키가 없거나 SDK 로딩 실패 시 호출 → 화면은 목록 모드로 전환 */
  onUnavailable?: () => void;
};
