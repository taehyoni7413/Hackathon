import type { Coord } from "@/types/models";

/**
 * 학교 기준 좌표 (데모 모드의 내 위치, 위치 권한 거부 시 기준점, 가짜 식당 좌표 생성 기준).
 *
 * 건국대학교 글로컬캠퍼스 정문 (충북 충주시 충원대로 268).
 * 출처: OpenStreetMap node 4629757791 "건국대학교 글로컬캠퍼스 정문" (© OpenStreetMap 기여자)
 * 백엔드B 실제 가게(충열길 일대)와 약 300~350m 거리.
 */
export const SCHOOL_COORD: Coord = { lat: 36.9515464, lng: 127.9053001 };

/** 도착 판정 반경 (m) */
export const ARRIVAL_RADIUS_M = 80;
/** 도착 실패 시 근처 식당을 찾는 반경 (m) */
export const NEARBY_RADIUS_M = 300;
/** 직선 경로 예상 시간 계산용 도보 속도 (km/h) */
export const WALK_SPEED_KMH = 4;
