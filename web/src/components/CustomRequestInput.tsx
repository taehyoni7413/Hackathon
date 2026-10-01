"use client";

import { Hourglass, Microphone, X } from "@/components/Icon";
import { useCallback, useState } from "react";

import { VoiceOverlay } from "@/components/VoiceOverlay";
import { DEFAULT_SPEECH_LANG, SPEECH_LANGS, type SpeechLang } from "@/config/speech";
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
  // 말할 언어: 처음 언어 선택 화면에서 고른 언어(앱 언어)를 따라간다.
  // 아래 선택 칩으로 바꾸면 이 메뉴 상세에서만 임시로 바뀐다.
  const [overrideLang, setSpeechLang] = useState<SpeechLang | null>(null);
  const speechLang: SpeechLang = overrideLang ?? DEFAULT_SPEECH_LANG[lang];
  const speechLabel = SPEECH_LANGS.find((l) => l.code === speechLang)?.label ?? speechLang;

  const add = useCallback(
    async (raw: string, sourceLang: string) => {
      const text = raw.trim().slice(0, MAX_CHARS);
      if (!text) return;
      setFailed(false);
      setTranslating(true);
      onBusyChange?.(true);
      const ko = await translateRequest(text, sourceLang);
      setTranslating(false);
      onBusyChange?.(false);
      if (!ko) setFailed(true);
      // 번역에 실패해도 원문은 남긴다 (사장님 화면에 원문 그대로 표시)
      onChange([...value, { text, ko: ko ?? text }]);
    },
    [onBusyChange, onChange, value],
  );

  const speech = useSpeechRecognition(speechLang, (text) => void add(text, speechLang));
  const listening = speech.status === "listening" || speech.status === "hearing";

  return (
    <div className="mt-3 space-y-2">
      {value.map((r, i) => (
        <div key={`${r.text}-${i}`} className="flex items-start gap-2 rounded-xl bg-brand-soft p-3">
          <div className="min-w-0 flex-1">
            {/* 말한 언어 원문 → 그 아래 한국어 해석 */}
            <p className="font-medium">“{r.text}”</p>
            {r.ko !== r.text && (
              <p className="mt-1 border-l-2 border-brand pl-2 text-[15px] font-semibold text-zinc-800">
                🇰🇷 {r.ko}
              </p>
            )}
          </div>
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-zinc-500 active:bg-white"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            aria-label={t("cart.remove")}
          >
            <X weight="bold" />
          </button>
        </div>
      ))}

      {translating && <p className="text-sm text-zinc-500"><Hourglass className="mr-1 inline align-[-3px]" />{t("voice.translating")}</p>}
      {failed && <p className="text-sm text-amber-700">{t("voice.translateFail")}</p>}
      {speech.status === "denied" && <p className="text-sm text-red-600">{t("voice.denied")}</p>}
      {speech.status === "error" && <p className="text-sm text-red-600">{t("voice.error")}</p>}

      {typing || !speech.supported ? (
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            // 직접 입력은 어떤 언어로 써도 되므로 언어를 정하지 않고 번역
            void add(draft, "auto");
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
        <>
        {/* 말할 언어: 브라우저 음성 인식은 언어 자동 감지가 안 돼서 직접 고른다 */}
        <p className="pt-1 text-sm font-semibold text-zinc-600">{t("voice.speakLang")}</p>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="radiogroup">
          {[
            // 처음 고른 언어를 맨 앞에
            ...SPEECH_LANGS.filter((l) => l.code === DEFAULT_SPEECH_LANG[lang]),
            ...SPEECH_LANGS.filter((l) => l.code !== DEFAULT_SPEECH_LANG[lang]),
          ].map((l) => {
            const on = l.code === speechLang;
            return (
              <button
                key={l.code}
                role="radio"
                aria-checked={on}
                onClick={() => setSpeechLang(l.code)}
                className={`min-h-11 shrink-0 rounded-full border-2 px-3 text-sm font-semibold ${
                  on ? "border-brand bg-brand text-white" : "border-zinc-200 bg-white text-zinc-700"
                }`}
              >
                {l.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary flex-1 gap-2 border-brand text-brand-dark"
            onClick={() => {
              speech.reset();
              speech.start();
            }}
            disabled={translating}
          >
            <Microphone className="mr-1 inline align-[-3px]" />{t("voice.speak")} · {speechLabel}
          </button>
          <button
            className="btn-secondary px-4"
            onClick={() => setTyping(true)}
            aria-label={t("voice.type")}
          >
            ⌨️
          </button>
        </div>
        </>
      )}

      {listening && (
        <VoiceOverlay
          status={speech.status}
          transcript={speech.transcript}
          langLabel={speechLabel}
          onDone={speech.stop}
          onCancel={speech.cancel}
        />
      )}
    </div>
  );
}
