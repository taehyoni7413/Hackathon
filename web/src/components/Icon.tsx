"use client";

/**
 * 앱 아이콘: Phosphor Icons(MIT) duotone — 굵은 외곽선 + 옅은 면, BUK 로고의 선 굵은 일러스트와 어울림.
 * 이모지 대신 이 파일에서만 가져다 쓴다 (모양을 한 곳에서 바꿀 수 있게).
 */
import { IconContext, type IconProps } from "@phosphor-icons/react";
import type { ReactNode } from "react";

export {
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowUp,
  BeerStein,
  BowlSteam,
  Camera,
  CaretLeft,
  Check,
  Compass,
  CreditCard,
  DeviceMobile,
  ForkKnife,
  GearSix,
  Hourglass,
  Info,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  MapPin,
  MapTrifold,
  Microphone,
  Pepper,
  SealCheck,
  ShoppingCartSimple,
  Sparkle,
  Warning,
  X,
} from "@phosphor-icons/react";

/** 아이콘 기본값: duotone, 글자 크기에 맞춤, 글자색 따라감 */
export function IconProvider({ children }: { children: ReactNode }) {
  return (
    <IconContext.Provider value={{ weight: "duotone", size: "1.25em", color: "currentColor", mirrored: false }}>
      {children}
    </IconContext.Provider>
  );
}

/** 돼지고기 표시 (Phosphor 에 없어 같은 스타일로 그림: 옅은 면 + 굵은 선) */
export function Pig({ size = "1.25em", className }: Pick<IconProps, "size" | "className">) {
  return (
    <svg viewBox="0 0 256 256" width={size} height={size} className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="128" cy="140" r="84" fill="currentColor" fillOpacity={0.2} stroke="none" />
      <path d="M68 84 52 40l52 22M188 84l16-44-52 22" />
      <circle cx="128" cy="140" r="84" />
      <ellipse cx="128" cy="164" rx="36" ry="26" />
      <path d="M116 164v2M140 164v2" strokeWidth={20} />
      <path d="M92 116v4M164 116v4" strokeWidth={20} />
    </svg>
  );
}
