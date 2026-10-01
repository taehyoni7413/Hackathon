import type { MetadataRoute } from "next";

/** 웹앱 매니페스트: 홈 화면에 설치하면 주소창 없이 앱처럼 실행된다 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "캠퍼스 밥친구 · 校园饭友 · Campus Bapchingu",
    short_name: "밥친구",
    description: "학교 앞 식당, 내 언어로 주문해요 · 用你的语言点餐 · Order in your language",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ff6a2b",
    theme_color: "#ff6a2b",
    lang: "ko",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
