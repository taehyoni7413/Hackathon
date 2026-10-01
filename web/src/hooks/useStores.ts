"use client";

import { useCallback, useEffect, useState } from "react";

import { api, type DataSource } from "@/lib/api";
import type { StoreWithMenus } from "@/types/models";

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ok"; stores: StoreWithMenus[]; source: DataSource };

export function useStores() {
  const [state, setState] = useState<State>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const [stores, source] = await Promise.all([api.getStores(), api.dataSource()]);
      setState({ status: "ok", stores, source });
    } catch {
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 데이터 불러오기
    void load();
  }, [load]);

  return { ...state, reload: load };
}

export function useStore(id: string) {
  const [state, setState] = useState<
    { status: "loading" } | { status: "error" } | { status: "ok"; store: StoreWithMenus | null }
  >({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      setState({ status: "ok", store: await api.getStore(id) });
    } catch {
      setState({ status: "error" });
    }
  }, [id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 데이터 불러오기
    void load();
  }, [load]);

  return { ...state, reload: load };
}
