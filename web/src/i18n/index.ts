import en from "./en.json";
import ko from "./ko.json";
import zh from "./zh.json";

/**
 * 지원 언어 목록. 언어 추가 = JSON 파일 1개 + 아래에 한 줄.
 * 언어 선택 화면에 이 순서로 나온다. 처음 선택값은 DEFAULT_LANG.
 */
export const LANGS = [
  // greeting: 언어 선택 화면에서 그 언어로 건네는 인사
  { code: "ko", label: "한국어", greeting: "안녕하세요", dict: ko },
  { code: "zh", label: "简体中文", greeting: "你好", dict: zh },
  { code: "en", label: "English", greeting: "Hello", dict: en },
] as const;

export type Lang = (typeof LANGS)[number]["code"];
export type MessageKey = keyof typeof ko;

export const DEFAULT_LANG: Lang = "ko";
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
