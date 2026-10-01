"use client";

import { Check, DeviceMobile } from "@/components/Icon";
import { useEffect, useState } from "react";

import { useApp } from "@/context/AppContext";

type InstallEvent = Event & { prompt: () => Promise<void> };

/**
 * 홈 화면에 추가. 안드로이드 크롬은 설치 창을 띄우고,
 * iOS 사파리는 설치 API가 없어서 공유 → 홈 화면에 추가 안내를 보여준다.
 */
export function InstallButton() {
  const { t } = useApp();
  const [deferred, setDeferred] = useState<InstallEvent | null>(null);
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallEvent);
    };
    const onInstalled = () => setStandalone(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // 브라우저 환경 감지는 마운트 후 한 번
    queueMicrotask(() => {
      setStandalone(isStandalone);
      setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    });
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (standalone) {
    return <p className="text-sm text-zinc-500"><Check className="mr-1 inline align-[-3px]" />{t("settings.installed")}</p>;
  }

  if (deferred) {
    return (
      <button
        className="btn-secondary w-full"
        onClick={async () => {
          await deferred.prompt();
          setDeferred(null);
        }}
      >
        <DeviceMobile className="mr-1 inline align-[-3px]" />{t("settings.install")}
      </button>
    );
  }

  if (ios) {
    return (
      <div>
        <button className="btn-secondary w-full" onClick={() => setShowIosHelp((v) => !v)}>
          <DeviceMobile className="mr-1 inline align-[-3px]" />{t("settings.install")}
        </button>
        {showIosHelp && (
          <p className="mt-2 rounded-xl bg-zinc-50 p-3 text-sm text-zinc-700">{t("settings.installIos")}</p>
        )}
      </div>
    );
  }

  return <p className="text-sm text-zinc-500">{t("settings.installHint")}</p>;
}
