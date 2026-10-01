"use client";

import { useEffect, useState } from "react";

import { InstallButton } from "@/components/InstallButton";
import { useApp } from "@/context/AppContext";
import { LANGS } from "@/i18n";
import { api, type DataSource } from "@/lib/api";

/** 설정: 언어 변경, 데모 모드, 백엔드 연결 상태(기존 "백엔드 연결됨" 표시 유지) */
export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { lang, setLang, demo, setDemo, t } = useApp();
  const [backend, setBackend] = useState<boolean | null>(null);
  const [source, setSource] = useState<DataSource | null>(null);

  useEffect(() => {
    api.health().then(() => setBackend(true)).catch(() => setBackend(false));
    api.dataSource().then(setSource).catch(() => setSource(null));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-[480px] rounded-t-3xl bg-white px-5 pt-5 pb-safe"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("settings.title")}</h2>
          <button className="icon-btn shadow-none" onClick={onClose} aria-label={t("common.close")}>
            ✕
          </button>
        </div>

        <p className="mb-2 font-semibold">{t("settings.language")}</p>
        <div className="grid grid-cols-3 gap-2">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`min-h-12 rounded-xl border-2 text-sm font-semibold ${
                lang === l.code ? "border-brand bg-brand-soft text-brand-dark" : "border-zinc-200"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        <label className="mt-6 flex min-h-12 cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block font-semibold">{t("settings.demo")}</span>
            <span className="block text-sm text-zinc-500">{t("settings.demoDesc")}</span>
          </span>
          <input
            type="checkbox"
            className="h-7 w-12 shrink-0 cursor-pointer accent-brand"
            checked={demo}
            onChange={(e) => setDemo(e.target.checked)}
          />
        </label>

        <p className="mb-2 mt-6 font-semibold">{t("settings.app")}</p>
        <InstallButton />

        <div className="mt-6 flex items-center justify-between text-sm">
          <span className="font-semibold">{t("settings.backend")}</span>
          <span
            className={`rounded-full px-3 py-1 ${
              backend === null
                ? "bg-zinc-100 text-zinc-500"
                : backend
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
            }`}
          >
            {backend === null
              ? t("settings.backendChecking")
              : backend
                ? t("settings.backendOk")
                : t("settings.backendOff")}
          </span>
        </div>
        {source && (
          <p className="mt-2 text-right text-xs text-zinc-400">
            {t("settings.dataSource", { source })}
          </p>
        )}
      </div>
    </div>
  );
}
