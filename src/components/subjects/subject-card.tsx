"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, BookOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteSubject } from "@/actions/subjects";
import { toast } from "sonner";
import { PRIORIDADE_LABELS, getSubjectColor } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { SubjectWithTopics } from "@/types";

const prioridadeColors = {
  baixa: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  media: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  alta: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
} as const;

interface SubjectCardProps {
  subject: SubjectWithTopics;
  onEdit: (subject: SubjectWithTopics) => void;
}

export function SubjectCard({ subject, onEdit }: SubjectCardProps) {
  const [isPending, startTransition] = useTransition();
  const palette = getSubjectColor(subject.cor);

  function handleDelete() {
    if (!confirm(`Excluir "${subject.nome}"? Todos os subtópicos serão removidos.`)) return;

    startTransition(async () => {
      const result = await deleteSubject(subject.id);
      if (result.success) {
        toast.success("Matéria excluída!");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div
      className={cn(
        "group rounded-xl border border-l-4 bg-card p-5 text-card-foreground shadow-sm transition-shadow hover:shadow-md",
        palette.border
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={cn("h-3 w-3 shrink-0 rounded-full", palette.swatch)}
              aria-hidden="true"
            />
            <h3 className="font-semibold truncate">{subject.nome}</h3>
            <Badge
              variant="secondary"
              className={prioridadeColors[subject.prioridade]}
            >
              {PRIORIDADE_LABELS[subject.prioridade]}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {subject.topics.length} subtópicos
            </span>
            <span>Peso: {subject.peso}</span>
          </div>
          {subject.observacoes && (
            <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
              {subject.observacoes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(subject)}
            className="h-8 w-8"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Link href={`/materias/${subject.id}`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
