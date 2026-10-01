"use client";

import { useCallback, useState } from "react";

import { VoiceOverlay } from "@/components/VoiceOverlay";
import { useApp } from "@/context/AppContext";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { translateRequest } from "@/lib/api";
import type { CustomRequest } from "@/types/models";

const MAX_CHARS = 200;

/**
 * 자유 요청사항: 🎤 말하기(브라우저 음성 인식) 또는 직접 입력 → 한국어 번역 → 목록에 추가.
 * 번역된 한국어는 사장님 화면에 크게, 원문은 작게 보인다.
 */
export function CustomRequestInput({
  value,
  onChange,
  onBusyChange,
}: {
  value: CustomRequest[];
  onChange: (next: CustomRequest[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const { lang, t } = useApp();
  const [translating, setTranslating] = useState(false);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [failed, setFailed] = useState(false);

  const add = useCallback(
    async (raw: string) => {
      const text = raw.trim().slice(0, MAX_CHARS);
      if (!text) return;
      setFailed(false);
      setTranslating(true);
      onBusyChange?.(true);
      const ko = await translateRequest(text, lang);
      setTranslating(false);
      onBusyChange?.(false);
      if (!ko) setFailed(true);
      // 번역에 실패해도 원문은 남긴다 (사장님 화면에 원문 그대로 표시)
      onChange([...value, { text, ko: ko ?? text }]);
    },
    [lang, onBusyChange, onChange, value],
  );

  const speech = useSpeechRecognition(lang, (text) => void add(text));
  const listening = speech.status === "listening" || speech.status === "hearing";

  return (
    <div className="mt-3 space-y-2">
      {value.map((r, i) => (
        <div key={`${r.text}-${i}`} className="flex items-start gap-2 rounded-xl bg-brand-soft p-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium">“{r.text}”</p>
            {r.ko !== r.text && (
              <p className="mt-0.5 text-sm text-zinc-600">
                {t("voice.toOwner")}: <span className="font-semibold text-zinc-800">{r.ko}</span>
              </p>
            )}
          </div>
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-500 active:bg-white"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            aria-label={t("cart.remove")}
          >
            ✕
          </button>
        </div>
      ))}

      {translating && <p className="text-sm text-zinc-500">⏳ {t("voice.translating")}</p>}
      {failed && <p className="text-sm text-amber-700">{t("voice.translateFail")}</p>}
      {speech.status === "denied" && <p className="text-sm text-red-600">{t("voice.denied")}</p>}
      {speech.status === "error" && <p className="text-sm text-red-600">{t("voice.error")}</p>}

      {typing || !speech.supported ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void add(draft);
            setDraft("");
            setTyping(false);
          }}
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={MAX_CHARS}
            placeholder={t("voice.typePlaceholder")}
            className="min-h-12 min-w-0 flex-1 rounded-xl border-2 border-zinc-200 px-3 focus:border-brand focus:outline-none"
          />
          <button type="submit" className="btn-primary px-4" disabled={!draft.trim() || translating}>
            {t("voice.add")}
          </button>
        </form>
      ) : (
        <div className="flex gap-2">
          <button
            className="btn-secondary flex-1 gap-2 border-brand text-brand-dark"
            onClick={() => {
              speech.reset();
              speech.start();
            }}
            disabled={translating}
          >
            🎤 {t("voice.speak")}
          </button>
          <button
            className="btn-secondary px-4"
            onClick={() => setTyping(true)}
            aria-label={t("voice.type")}
          >
            ⌨️
          </button>
        </div>
      )}

      {listening && (
        <VoiceOverlay
          status={speech.status}
          transcript={speech.transcript}
          onDone={speech.stop}
          onCancel={speech.cancel}
        />
      )}
    </div>
  );
}
