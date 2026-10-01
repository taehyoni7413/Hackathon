"use client";

import { useEffect, useRef, useState } from "react";

function read<T>(key: string): T | undefined {
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? undefined : (JSON.parse(raw) as T);
  } catch {
    return undefined;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 저장 실패해도 앱은 계속 동작
  }
}

/**
 * localStorage에 저장되는 state. 서버 렌더링과 어긋나지 않도록
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
