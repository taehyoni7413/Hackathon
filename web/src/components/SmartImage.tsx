/* eslint-disable @next/next/no-img-element -- 팀이 넣는 정적 이미지 경로를 그대로 쓰고, 없으면 기본 이미지로 대체 */
"use client";

import { useState } from "react";

import type { Category } from "@/types/models";

export function defaultImage(category?: Category | "store") {
  return `/defaults/${category ?? "store"}.svg`;
}

/** src가 없거나 로딩에 실패하면 카테고리 기본 이미지를 보여준다 */
export function SmartImage({
  src,
  fallback,
  alt,
  className,
}: {
  src: string | null | undefined;
  fallback: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={!src || failed ? fallback : src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
