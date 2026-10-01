import type { Lang } from "@/i18n";

/**
 * 음성 인식 언어 목록 (브라우저 Web Speech API용 BCP-47 코드).
 * 브라우저는 언어를 자동으로 알아내지 못하므로 사용자가 "말할 언어"를 고른다.
 * 앱 화면 언어(zh/en/ko)와 별개라서 화면은 한국어여도 중국어로 말할 수 있다.
 */
export const SPEECH_LANGS = [
  { code: "zh-CN", label: "中文" },
  { code: "en-US", label: "English" },
  { code: "ja-JP", label: "日本語" },
  { code: "vi-VN", label: "Tiếng Việt" },
  { code: "mn-MN", label: "Монгол" },
  { code: "uz-UZ", label: "Oʻzbek" },
  { code: "ne-NP", label: "नेपाली" },
  { code: "id-ID", label: "Indonesia" },
  { code: "th-TH", label: "ไทย" },
  { code: "ru-RU", label: "Русский" },
  { code: "fr-FR", label: "Français" },
  { code: "es-ES", label: "Español" },
  { code: "ko-KR", label: "한국어" },
] as const;

export type SpeechLang = (typeof SPEECH_LANGS)[number]["code"];

/** 처음 쓸 때 기본값: 앱 화면 언어에 맞춤 */
export const DEFAULT_SPEECH_LANG: Record<Lang, SpeechLang> = {
  zh: "zh-CN",
  en: "en-US",
  ko: "ko-KR",
};

export function isSpeechLang(v: unknown): v is SpeechLang {
  return SPEECH_LANGS.some((l) => l.code === v);
}
