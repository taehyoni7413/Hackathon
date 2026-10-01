/**
 * 넓은 화면에서만 보이는 iPhone 틀 장식: 상태 표시줄(9:41·신호·배터리), 다이내믹 아일랜드, 홈 바.
 * 휴대폰에서는 .device-chrome 이 숨겨져 실제 기기 화면을 그대로 쓴다. (globals.css 의 @media)
 */
export function DeviceChrome() {
  return (
    <div className="device-chrome pointer-events-none" aria-hidden>
      {/* 상태 표시줄: 배경 색에 따라 글자색이 바뀌도록 difference 혼합 */}
      <div className="absolute inset-x-0 top-0 z-[200] flex h-[54px] items-center justify-between px-9 pt-1 text-[16px] font-semibold text-white mix-blend-difference">
        <span>9:41</span>
        <span className="flex items-center gap-1.5">
          <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor">
            <rect x="0" y="8" width="3" height="4" rx="1" />
            <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
            <rect x="10" y="3" width="3" height="9" rx="1" />
            <rect x="15" y="0" width="3" height="12" rx="1" />
          </svg>
          <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
            <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.3 10.3 0 0 0 8 .4 10.3 10.3 0 0 0 .8 3.3L2 4.6a8.5 8.5 0 0 1 6-2.4Zm0 3.6c1.3 0 2.5.5 3.4 1.3l1.2-1.3A6.7 6.7 0 0 0 8 4a6.7 6.7 0 0 0-4.6 1.8l1.2 1.3c.9-.8 2.1-1.3 3.4-1.3Zm0 3.6c.4 0 .8.2 1.1.4L8 11.6 6.9 9.8c.3-.2.7-.4 1.1-.4Z" />
          </svg>
          <svg width="27" height="13" viewBox="0 0 27 13" fill="none">
            <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
            <rect x="2" y="2" width="20" height="9" rx="2" fill="currentColor" />
            <path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity="0.4" />
          </svg>
        </span>
      </div>
      {/* 다이내믹 아일랜드 */}
      <div className="absolute left-1/2 top-[11px] z-[201] h-[35px] w-[124px] -translate-x-1/2 rounded-full bg-black" />
      {/* 홈 바 */}
      <div className="absolute bottom-2 left-1/2 z-[200] h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black/80 mix-blend-difference" />
    </div>
  );
}
