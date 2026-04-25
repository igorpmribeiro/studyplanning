"use client";

import { useTransition } from "react";
import { Check, CalendarClock, AlertTriangle, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { markReviewCompleted } from "@/actions/revisoes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ReviewQueueItem } from "@/actions/revisoes";

interface ReviewCardProps {
  planningId: string;
  item: ReviewQueueItem;
}

function formatPtDate(d: Date): string {
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusFromDays(days: number): {
  label: string;
  className: string;
  icon: typeof CalendarClock;
} {
  if (days < 0) {
    return {
      label: `Atrasada há ${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"}`,
      className:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900",
      icon: AlertTriangle,
    };
  }
  if (days === 0) {
    return {
      label: "Vence hoje",
      className:
        "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
      icon: CalendarClock,
    };
  }
  if (days <= 3) {
    return {
      label: `Em ${days} dia${days === 1 ? "" : "s"}`,
      className:
        "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
      icon: CalendarClock,
    };
  }
  return {
    label: `Em ${days} dias`,
    className:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-900",
    icon: CalendarClock,
  };
}

export function ReviewCard({ planningId, item }: ReviewCardProps) {
  const [isPending, startTransition] = useTransition();
  const status = statusFromDays(item.daysUntilDue);
  const StatusIcon = status.icon;
  const isOverdue = item.daysUntilDue < 0;

  const tipoLabel = item.tipoRevisao === "revisao_1" ? "Revisão 1" : "Revisão 2";
  const tipoColor =
    item.tipoRevisao === "revisao_1"
      ? "border-l-green-500"
      : "border-l-purple-500";

  function handleComplete() {
    startTransition(async () => {
      const result = await markReviewCompleted(planningId, item.topicId, item.tipoRevisao);
      if (result.success) {
        toast.success(
          item.tipoRevisao === "revisao_1"
            ? "Revisão 1 concluída! Revisão 2 agendada."
            : "Revisão 2 concluída! Subtópico finalizado."
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-l-4 bg-card p-4 shadow-sm transition-colors",
        tipoColor,
        isOverdue && "ring-1 ring-red-200 dark:ring-red-900"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {tipoLabel}
            </Badge>
            <Badge variant="secondary" className={cn("text-xs", status.className)}>
              <StatusIcon className="mr-1 h-3 w-3" aria-hidden="true" />
              {status.label}
            </Badge>
          </div>

          <div>
            <p className="text-sm font-medium leading-tight">{item.topicNome}</p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              {item.subjectNome}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <dt className="font-medium">Estudo concluído</dt>
            <dd className="text-right tabular-nums">{formatPtDate(item.studyCompletedAt)}</dd>
            {item.revisao1CompletedAt && (
              <>
                <dt className="font-medium">Revisão 1</dt>
                <dd className="text-right tabular-nums">{formatPtDate(item.revisao1CompletedAt)}</dd>
              </>
            )}
            <dt className="font-medium">Vence em</dt>
            <dd className="text-right tabular-nums">{formatPtDate(item.dueDate)}</dd>
          </dl>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleComplete}
          disabled={isPending}
          aria-label="Marcar revisão como concluída"
          title="Marcar revisão como concluída"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
