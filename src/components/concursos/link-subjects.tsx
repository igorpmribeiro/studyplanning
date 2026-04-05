"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { linkSubjectToConcurso } from "@/actions/concursos";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { SubjectWithTopics } from "@/types";

interface LinkSubjectsProps {
  concursoId: string;
  allSubjects: SubjectWithTopics[];
  linkedSubjectIds: string[];
  onDone: () => void;
}

export function LinkSubjects({ concursoId, allSubjects, linkedSubjectIds, onDone }: LinkSubjectsProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(linkedSubjectIds));
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    startTransition(async () => {
      const promises: Promise<unknown>[] = [];

      for (const subject of allSubjects) {
        const shouldBeLinked = selected.has(subject.id);
        const isLinked = linkedSubjectIds.includes(subject.id);

        if (shouldBeLinked && !isLinked) {
          promises.push(linkSubjectToConcurso(subject.id, concursoId));
        } else if (!shouldBeLinked && isLinked) {
          promises.push(linkSubjectToConcurso(subject.id, null));
        }
      }

      await Promise.all(promises);
      toast.success("Matérias atualizadas!");
      onDone();
    });
  }

  return (
    <div className="space-y-4">
      <div className="max-h-64 overflow-y-auto overscroll-contain space-y-1">
        {allSubjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => toggle(subject.id)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors",
              selected.has(subject.id)
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted"
            )}
          >
            <span className="truncate">{subject.nome}</span>
            <span className="text-xs text-muted-foreground">
              {subject.topics.length} subtópicos
            </span>
          </button>
        ))}
      </div>

      <Button onClick={handleSave} disabled={isPending} className="w-full">
        {isPending ? "Salvando..." : "Salvar"}
      </Button>
    </div>
  );
}
