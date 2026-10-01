import { WALK_SPEED_KMH } from "@/config/location";
import type { Coord, OpenHours, Weekday } from "@/types/models";

/** 두 좌표 사이 거리 (m), haversine */
export function distanceM(a: Coord, b: Coord): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 도보 예상 시간 (초) */
export function walkSeconds(meters: number): number {
  return (meters / 1000 / WALK_SPEED_KMH) * 3600;
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`;
}

export function formatMinutes(seconds: number): number {
  return Math.max(1, Math.round(seconds / 60));
}

/** 기준점에서 북쪽/동쪽으로 미터만큼 이동한 좌표 (가짜 데이터 생성용) */
export function offsetCoord(base: Coord, northM: number, eastM: number): Coord {
  const dLat = northM / 111320;
  const dLng = eastM / (111320 * Math.cos((base.lat * Math.PI) / 180));
  return {
    lat: +(base.lat + dLat).toFixed(6),
    lng: +(base.lng + dLng).toFixed(6),
  };
}

const WEEKDAYS: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** 지금 영업 중인지. 자정을 넘기는 영업(예: 17:00~02:00)도 처리 */
export function isOpenNow(hours: OpenHours | null, now = new Date()): boolean {
  if (!hours) return false;
  const today = hours[WEEKDAYS[now.getDay()]];
  if (!today) return false;
  const toMin = (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  };
  const cur = now.getHours() * 60 + now.getMinutes();
  const open = toMin(today.open);
  const close = toMin(today.close);
  return close > open ? cur >= open && cur < close : cur >= open || cur < close;
}

export function todayHours(hours: OpenHours | null, now = new Date()) {
  return hours ? hours[WEEKDAYS[now.getDay()]] : null;
}
