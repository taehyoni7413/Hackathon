"use client";

import { useApp } from "@/context/AppContext";

export function LoadingView({ label }: { label?: string }) {
  const { t } = useApp();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-zinc-500">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-brand" />
      <p>{label ?? t("common.loading")}</p>
    </div>
  );
}

export function EmptyView({ label }: { label?: string }) {
  const { t } = useApp();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-zinc-500">
      <span className="text-4xl" aria-hidden>
        🍽️
      </span>
      <p>{label ?? t("common.empty")}</p>
    </div>
  );
}

export function ErrorView({
  label,
  onRetry,
}: {
  label?: string;
  onRetry?: () => void;
}) {
  const { t } = useApp();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <span className="text-4xl" aria-hidden>
        ⚠️
      </span>
      <p className="text-zinc-600">{label ?? t("common.error")}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary">
          {t("common.retry")}
        </button>
      )}
    </div>
  );
}
