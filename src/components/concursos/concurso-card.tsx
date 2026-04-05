"use client";

import { useTransition } from "react";
import { CalendarDays, BookOpen, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteConcurso } from "@/actions/concursos";
import { toast } from "sonner";
import type { ConcursoWithSubjects } from "@/types";

const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

interface ConcursoCardProps {
  concurso: ConcursoWithSubjects;
  onEdit: (concurso: ConcursoWithSubjects) => void;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Data não definida";
  return dateFmt.format(new Date(dateStr + "T00:00:00"));
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function ConcursoCard({ concurso, onEdit }: ConcursoCardProps) {
  const [isPending, startTransition] = useTransition();
  const days = daysUntil(concurso.dataProva);
  const totalTopics = concurso.subjects.reduce((acc, s) => acc + s.topics.length, 0);
  const completedTopics = concurso.subjects.reduce(
    (acc, s) => acc + s.topics.filter((t) => t.status === "concluido").length,
    0
  );
  const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  function handleDelete() {
    if (!confirm(`Deseja excluir o concurso "${concurso.nome}"? As matérias não serão excluídas.`)) return;
    startTransition(async () => {
      const result = await deleteConcurso(concurso.id);
      if (result.success) toast.success("Concurso excluído!");
      else toast.error(result.error);
    });
  }

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold truncate">{concurso.nome}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{formatDate(concurso.dataProva)}</span>
            </div>
            {days !== null && (
              <Badge
                variant="secondary"
                className={
                  days <= 30
                    ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                    : days <= 90
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                      : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                }
              >
                {days > 0 ? `${days} dias` : days === 0 ? "Hoje!" : "Realizado"}
              </Badge>
            )}
            <div className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{concurso.subjects.length} {concurso.subjects.length === 1 ? "matéria" : "matérias"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(concurso)} aria-label="Editar concurso">
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Excluir concurso"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Progress */}
      {totalTopics > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Progresso dos subtópicos</span>
            <span className="tabular-nums">{completedTopics}/{totalTopics} ({progressPercent}%)</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary">
            <div
              className="h-2 rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Subjects list */}
      {concurso.subjects.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {concurso.subjects.map((s) => (
            <Badge key={s.id} variant="secondary" className="text-xs">
              {s.nome}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
