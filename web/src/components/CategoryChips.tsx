"use client";

import { useApp } from "@/context/AppContext";
import type { MessageKey } from "@/i18n";
import { CATEGORIES, type Category } from "@/types/models";

export type CategoryFilter = Category | "all";

export function CategoryChips({
  value,
  onChange,
}: {
  value: CategoryFilter;
  onChange: (c: CategoryFilter) => void;
}) {
  const { t } = useApp();
  const items: CategoryFilter[] = ["all", ...CATEGORIES];
  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {items.map((c) => {
        const active = c === value;
        return (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold shadow-md transition ${
              active ? "bg-zinc-900 text-white" : "bg-white text-zinc-700"
            }`}
          >
            {t(`cat.${c}` as MessageKey)}
          </button>
        );
      })}
    </div>
  );
}
