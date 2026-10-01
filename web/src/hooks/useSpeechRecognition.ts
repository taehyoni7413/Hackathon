"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// 브라우저 내장 음성 인식(Web Speech API). 타입 정의가 lib.dom에 없어 필요한 만큼만 선언
type RecognitionResultList = ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onsoundstart: (() => void) | null;
  onspeechstart: (() => void) | null;
  onresult: ((e: { results: RecognitionResultList }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** 말을 시작하지 않으면 이 시간 뒤 자동으로 닫힘 */
const NO_SPEECH_MS = 6000;
/** 한 번에 최대 녹음 시간 */
const MAX_MS = 15000;

export type SpeechStatus = "idle" | "listening" | "hearing" | "denied" | "error";

/**
 * 버튼을 누르면 듣기 시작 → 말이 멈추면 브라우저가 자동 종료 → onFinal(문장).
 * 아무 말도 없으면 조용히 닫힌다(onFinal 호출 안 함).
 */
export function useSpeechRecognition(
  /** 인식할 언어 (BCP-47, 예: "zh-CN"). 브라우저는 언어를 자동 감지하지 못한다 */
  locale: string,
  onFinal: (text: string) => void,
) {
  const [supported, setSupported] = useState(false);
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const rec = useRef<Recognition | null>(null);
  const timers = useRef<number[]>([]);
  const textRef = useRef("");
  const onFinalRef = useRef(onFinal);

  useEffect(() => {
    onFinalRef.current = onFinal;
  }, [onFinal]);

  useEffect(() => {
    // 브라우저 지원 여부는 마운트 후 확인 (서버 렌더링과 어긋나지 않게)
    queueMicrotask(() => setSupported(getCtor() !== null));
    return () => {
      rec.current?.abort();
      timers.current.forEach(clearTimeout);
    };
  }, []);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || rec.current) return;
    const r = new Ctor();
    r.lang = locale;
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    textRef.current = "";
    setTranscript("");

    r.onstart = () => setStatus("listening");
    r.onsoundstart = () => setStatus("hearing");
    r.onspeechstart = () => setStatus("hearing");
    r.onresult = (e) => {
      const text = Array.from(e.results)
        .map((res) => res[0]?.transcript ?? "")
        .join("")
        .trim();
      textRef.current = text;
      setTranscript(text);
      setStatus("hearing");
    };
    r.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") setStatus("denied");
      else if (e.error !== "no-speech" && e.error !== "aborted") setStatus("error");
    };
    r.onend = () => {
      clearTimers();
      rec.current = null;
      const text = textRef.current;
      setStatus((s) => (s === "denied" || s === "error" ? s : "idle"));
      if (text) onFinalRef.current(text);
    };

    rec.current = r;
    try {
      r.start();
    } catch {
      rec.current = null;
      setStatus("error");
      return;
    }
    timers.current.push(
      window.setTimeout(() => {
        if (!textRef.current) rec.current?.abort();
      }, NO_SPEECH_MS),
      window.setTimeout(() => rec.current?.stop(), MAX_MS),
    );
  }, [locale]);

  /** 지금까지 들은 내용으로 끝내기 */
  const stop = useCallback(() => rec.current?.stop(), []);
  /** 결과 버리고 닫기 */
  const cancel = useCallback(() => {
    textRef.current = "";
    rec.current?.abort();
  }, []);
  const reset = useCallback(() => setStatus("idle"), []);

  return { supported, status, transcript, start, stop, cancel, reset };
}
