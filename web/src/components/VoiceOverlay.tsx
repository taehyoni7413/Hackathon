"use client";

import { Microphone } from "@/components/Icon";
import { useApp } from "@/context/AppContext";
import type { SpeechStatus } from "@/hooks/useSpeechRecognition";

/**
 * 시리처럼 듣는 화면. 말하는 동안 구슬이 크게 움직이고, 들은 내용이 실시간으로 보인다.
 * 소리가 없으면 훅이 자동으로 종료하고 이 화면도 사라진다.
 */
export function VoiceOverlay({
  status,
  transcript,
  langLabel,
  onDone,
  onCancel,
}: {
  status: SpeechStatus;
  transcript: string;
  /** 지금 듣고 있는 언어 이름 (예: 中文) */
  langLabel: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const { t } = useApp();
  const hearing = status === "hearing";

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col items-center justify-end bg-black/70 backdrop-blur-sm"
      onClick={onCancel}
      role="dialog"
      aria-modal
      aria-live="polite"
    >
      <div
        className="flex w-full max-w-[480px] flex-col items-center px-6 pb-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="min-h-16 text-center text-2xl font-semibold leading-snug text-white">
          {transcript || <span className="text-white/60">{t("voice.hint")}</span>}
        </p>

        <button
          onClick={onDone}
          className="relative my-10 flex h-36 w-36 items-center justify-center"
          aria-label={t("voice.done")}
        >
          <span className="siri-core absolute inset-0" data-hearing={hearing}>
            <span className="siri-orb absolute inset-0 rounded-full" />
          </span>
          <span className="relative h-20 w-20 rounded-full bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.6)]" />
          <span className="absolute text-4xl text-ink" aria-hidden>
            <Microphone weight="fill" />
          </span>
        </button>

        <p className="mb-4 text-sm text-white/70">
          <span className="mr-2 rounded-full bg-white/15 px-2 py-0.5 font-semibold text-white">
            {langLabel}
          </span>
          {hearing ? t("voice.hearing") : t("voice.listening")}
        </p>
        <button className="btn-secondary mb-2 w-full bg-white/10 text-white border-white/30" onClick={onCancel}>
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}
