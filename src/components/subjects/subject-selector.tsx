"use client";

import { Badge } from "@/components/ui/badge";
import { PRIORIDADE_LABELS, getSubjectColor } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { SubjectWithTopics } from "@/types";

const prioridadeColors = {
  baixa: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  media: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  alta: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
} as const;

interface SubjectSelectorProps {
  subjects: SubjectWithTopics[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

export function SubjectSelector({
  subjects,
  selectedIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}: SubjectSelectorProps) {
  // Filter out fully-completed subjects
  const availableSubjects = subjects.filter(
    (s) => s.topics.some((t) => t.status !== "concluido")
  );
  const completedSubjects = subjects.filter(
    (s) => s.topics.length > 0 && s.topics.every((t) => t.status === "concluido")
  );
  const allSelected = selectedIds.length === availableSubjects.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedIds.length} de {availableSubjects.length} selecionadas
        </p>
        <button
          type="button"
          onClick={allSelected ? onDeselectAll : onSelectAll}
          className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
        >
          {allSelected ? "Desmarcar todas" : "Selecionar todas"}
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {availableSubjects.map((subject) => {
          const isSelected = selectedIds.includes(subject.id);
          const topicCount = subject.topics.filter(
            (t) => t.status !== "concluido"
          ).length;

          return (
            <button
              key={subject.id}
              type="button"
              onClick={() => onToggle(subject.id)}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border hover:border-muted-foreground/30 opacity-60"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}
              >
                {isSelected && (
                  <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 shrink-0 rounded-full",
                      getSubjectColor(subject.cor).swatch
                    )}
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium truncate">{subject.nome}</p>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={cn("text-xs", prioridadeColors[subject.prioridade])}
                  >
                    {PRIORIDADE_LABELS[subject.prioridade]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {topicCount} subtópicos
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {availableSubjects.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nenhuma matéria disponível. Adicione matérias ou verifique seus subtópicos.
        </p>
      )}

      {completedSubjects.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-1.5">
            Matérias concluídas ({completedSubjects.length}):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {completedSubjects.map((s) => (
              <Badge key={s.id} variant="secondary" className="text-xs opacity-60 line-through">
                {s.nome}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
