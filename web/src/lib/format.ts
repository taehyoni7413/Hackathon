import { translate, type Lang } from "@/i18n";

export function formatPrice(won: number, lang: Lang) {
  return translate(lang, "common.won", { n: won.toLocaleString("ko-KR") });
}

/** 사장님 화면용 한국어 가격 */
export function formatPriceKo(won: number) {
  return `${won.toLocaleString("ko-KR")}원`;
}
