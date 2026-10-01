import type { Coord } from "@/types/models";

/**
 * 학교 기준 좌표 (데모 모드의 내 위치, 위치 권한 거부 시 기준점, 가짜 식당 좌표 생성 기준).
 *
 * ⚠️ 임시값이며 검증되지 않았습니다.
 *    팀이 카카오맵에서 확인한 건국대 글로컬캠퍼스 정문 좌표로 교체할 것.
 */
export const SCHOOL_COORD: Coord = { lat: 36.9709, lng: 127.871 };

/** 도착 판정 반경 (m) */
export const ARRIVAL_RADIUS_M = 80;
/** 도착 실패 시 근처 식당을 찾는 반경 (m) */
export const NEARBY_RADIUS_M = 300;
/** 직선 경로 예상 시간 계산용 도보 속도 (km/h) */
export const WALK_SPEED_KMH = 4;
