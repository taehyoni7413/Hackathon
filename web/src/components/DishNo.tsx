/** 음식 번호 표시 (사장님 주문서·손님 대기 화면 공통). 번호를 아직 못 받았으면 … */
export function DishNo({ n }: { n?: number }) {
  return (
    <span
      className="inline-flex h-12 min-w-12 shrink-0 items-center justify-center rounded-2xl bg-brand px-2 font-display text-3xl leading-none text-white shadow-sm"
      aria-label={n !== undefined ? `#${n}` : undefined}
    >
      {n ?? "…"}
    </span>
  );
}
