import type { Metadata, Viewport } from "next";
import "./globals.css";

import { AppProvider } from "@/context/AppContext";
import { DemoBadge } from "@/components/DemoBadge";

export const metadata: Metadata = {
  title: "캠퍼스 밥친구",
  description: "학교 앞 식당, 내 언어로 주문해요",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#ff6a2b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full">
        <AppProvider>
          <div className="app-shell">{children}</div>
          <DemoBadge />
        </AppProvider>
      </body>
    </html>
  );
}
