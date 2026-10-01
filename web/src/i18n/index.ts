import en from "./en.json";
import ko from "./ko.json";
import zh from "./zh.json";

/**
 * 지원 언어 목록. 언어 추가 = JSON 파일 1개 + 아래에 한 줄.
 * 첫 번째 항목이 언어 선택 화면에서 강조된다.
 */
export const LANGS = [
  { code: "zh", label: "简体中文", dict: zh },
  { code: "en", label: "English", dict: en },
  { code: "ko", label: "한국어", dict: ko },
] as const;

export type Lang = (typeof LANGS)[number]["code"];
export type MessageKey = keyof typeof ko;

export const DEFAULT_LANG: Lang = "zh";
const FALLBACK: Lang[] = ["en", "ko"];

const dicts = Object.fromEntries(LANGS.map((l) => [l.code, l.dict])) as Record<
  Lang,
  Partial<Record<MessageKey, string>>
>;

export function isLang(v: unknown): v is Lang {
  return LANGS.some((l) => l.code === v);
}

/** 문구 번역. {name} 형태 자리표시자를 vars로 채운다. 없는 키는 en → ko 순으로 폴백 */
export function translate(
  lang: Lang,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  let s =
    dicts[lang][key] ??
    FALLBACK.map((l) => dicts[l][key]).find(Boolean) ??
    key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  }
  return s;
}

/** 데이터의 언어별 문자열 선택. 없으면 en → ko → 첫 값 */
export function pickText(
  value: Partial<Record<Lang, string>> | undefined,
  lang: Lang,
  fallback = "",
): string {
  if (!value) return fallback;
  return (
    value[lang] ??
    FALLBACK.map((l) => value[l]).find(Boolean) ??
    Object.values(value).find(Boolean) ??
    fallback
  );
}
