"use client";

import { cn } from "@/lib/utils";
import { BANCA_LABELS } from "@/lib/constants";
import { Scale, FileText, BookOpen, GraduationCap, Shuffle } from "lucide-react";

const BANCA_CONFIG = {
  cespe: {
    label: BANCA_LABELS.cespe,
    description: "Certo ou Errado",
    icon: Scale,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-950",
    border: "border-blue-200 dark:border-blue-800",
    activeBorder: "border-blue-500 dark:border-blue-400",
    activeBg: "bg-blue-50 dark:bg-blue-950/50",
  },
  fcc: {
    label: BANCA_LABELS.fcc,
    description: "Múltipla Escolha (A-E)",
    icon: FileText,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950",
    border: "border-emerald-200 dark:border-emerald-800",
    activeBorder: "border-emerald-500 dark:border-emerald-400",
    activeBg: "bg-emerald-50 dark:bg-emerald-950/50",
  },
  fgv: {
    label: BANCA_LABELS.fgv,
    description: "Múltipla Escolha (A-E)",
    icon: BookOpen,
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-950",
    border: "border-purple-200 dark:border-purple-800",
    activeBorder: "border-purple-500 dark:border-purple-400",
    activeBg: "bg-purple-50 dark:bg-purple-950/50",
  },
  vunesp: {
    label: BANCA_LABELS.vunesp,
    description: "Múltipla Escolha (A-E)",
    icon: GraduationCap,
    color: "text-orange-600 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-950",
    border: "border-orange-200 dark:border-orange-800",
    activeBorder: "border-orange-500 dark:border-orange-400",
    activeBg: "bg-orange-50 dark:bg-orange-950/50",
  },
  generica: {
    label: BANCA_LABELS.generica,
    description: "Múltipla Escolha (A-E)",
    icon: Shuffle,
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-50 dark:bg-gray-950",
    border: "border-gray-200 dark:border-gray-800",
    activeBorder: "border-gray-500 dark:border-gray-400",
    activeBg: "bg-gray-50 dark:bg-gray-950/50",
  },
} as const;

type BancaKey = keyof typeof BANCA_CONFIG;

export function BancaSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (banca: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {(Object.entries(BANCA_CONFIG) as [BancaKey, (typeof BANCA_CONFIG)[BancaKey]][]).map(
        ([key, config]) => {
          const isActive = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all",
                "hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? `${config.activeBorder} ${config.activeBg} shadow-sm`
                  : `${config.border} bg-card`
              )}
            >
              <div className={cn("rounded-lg p-2.5", config.bg)}>
                <config.icon className={cn("h-5 w-5", config.color)} aria-hidden="true" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{config.label}</p>
                <p className="text-xs text-muted-foreground">{config.description}</p>
              </div>
            </button>
          );
        }
      )}
    </div>
  );
}
