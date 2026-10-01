import type { Metadata, Viewport } from "next";
import "./globals.css";

import { AppProvider } from "@/context/AppContext";
import { DemoBadge } from "@/components/DemoBadge";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "BUK",
  description: "학교 앞 식당, 내 언어로 주문해요",
  applicationName: "BUK",
  // iOS 홈 화면에 추가했을 때 전체 화면 앱처럼 실행
  appleWebApp: {
    capable: true,
    title: "BUK",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
  // 구형 iOS는 이 태그가 있어야 홈 화면 실행 시 주소창이 사라진다
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // 노치·홈 바 영역까지 쓰고 safe-area 여백으로 피한다
  viewportFit: "cover",
  themeColor: "#ec8a33",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <AppProvider>
          <div className="app-shell">{children}</div>
          <DemoBadge />
        </AppProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
