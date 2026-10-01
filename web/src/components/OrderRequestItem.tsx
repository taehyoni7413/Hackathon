import type { ReactNode } from "react";

/**
 * 사장님께 보여줄 요청사항 한 줄 (예: "— 덜 맵게 해주세요").
 * 나중에 사장님 답변 버튼([가능해요] [안 돼요] [재료가 들어있어요])과
 * 답변 번역을 actions 자리에 붙일 예정이라 독립 컴포넌트로 둔다.
 */
export function OrderRequestItem({
  ko,
  translated,
  actions,
}: {
  /** 사장님이 읽을 한국어 요청 문장 */
  ko: string;
  /** 사용자 언어 번역 (확인용, 작게) */
  translated?: string;
  actions?: ReactNode;
}) {
  return (
    <li className="rounded-xl border-l-4 border-brand bg-brand-soft py-2 pl-3 pr-2">
      <p className="text-2xl font-bold leading-snug text-ink">{ko}</p>
      {translated && translated !== ko && (
        <p className="text-sm text-zinc-500">{translated}</p>
      )}
      {actions}
    </li>
  );
}
