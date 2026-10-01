"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 저장소: sessionStorage
 * - 새로고침해도 유지 (주문 중 실수로 새로고침해도 장바구니가 남음)
 * - 링크를 새로 열거나 탭·홈 화면 앱을 닫았다 열면 처음부터 시작
 */
function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function read<T>(key: string): T | undefined {
  try {
    const raw = storage()?.getItem(key) ?? null;
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown) {
  try {
    storage()?.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패해도 앱은 계속 동작
  }
}

/** 예전 버전이 localStorage에 남긴 값 정리 (그대로 두면 계속 남아 있음) */
export function clearLegacyStorage(prefix = "app.") {
  try {
    const ls = window.localStorage;
    for (let i = ls.length - 1; i >= 0; i--) {
      const k = ls.key(i);
      if (k?.startsWith(prefix)) ls.removeItem(k);
    }
  } catch {
    // 무시
  }
}

/**
 * sessionStorage에 저장되는 state. 서버 렌더링과 어긋나지 않도록
 * 첫 렌더는 initial 값을 쓰고, 마운트 후 저장된 값을 복원한다.
 * hydrated가 true가 되기 전에는 저장된 값이 반영되지 않았다는 뜻.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const skipWrite = useRef(true);

  useEffect(() => {
    const stored = read<T>(key);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 후 1회 복원
    if (stored !== undefined) setValue(stored);
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated) return;
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    write(key, value);
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}
