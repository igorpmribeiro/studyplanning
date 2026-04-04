"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { changeSessionTopic } from "@/actions/scheduler";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PlannedSession, Subject, Topic } from "@/types";

interface EditSessionTopicProps {
  session: PlannedSession;
  subjects: Subject[];
  topics: Topic[];
}

export function EditSessionTopic({ session, subjects, topics: allTopics }: EditSessionTopicProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Get available topics from the same subject
  const subjectTopics = allTopics.filter(
    (t) => t.subjectId === session.subjectId && t.status !== "concluido"
  );

  // Also group topics from other subjects
  const otherSubjectTopics = allTopics.filter(
    (t) => t.subjectId !== session.subjectId && t.status !== "concluido"
  );

  function handleSelect(topicId: string) {
    startTransition(async () => {
      const result = await changeSessionTopic(session.id, topicId);
      if (result.success) {
        toast.success("Subtópico alterado!");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // Group other topics by subject
  const otherBySubject = new Map<string, Topic[]>();
  for (const t of otherSubjectTopics) {
    const list = otherBySubject.get(t.subjectId) ?? [];
    list.push(t);
    otherBySubject.set(t.subjectId, list);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        <Pencil className="h-3 w-3" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[70vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Trocar Subtópico</DialogTitle>
            <DialogDescription>
              Selecione o subtópico para esta sessão.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Same subject topics */}
            {subjectTopics.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {subjectMap.get(session.subjectId)?.nome ?? "Mesma matéria"}
                </p>
                <div className="space-y-1">
                  {subjectTopics.map((t) => (
                    <button
                      key={t.id}
                      disabled={isPending || t.id === session.topicId}
                      onClick={() => handleSelect(t.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent",
                        t.id === session.topicId && "border-primary bg-primary/5 opacity-60"
                      )}
                    >
                      <span className="truncate">{t.nome}</span>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {t.tempoEstimadoMin} min
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Other subjects */}
            {Array.from(otherBySubject.entries()).map(([subjectId, topicList]) => (
              <div key={subjectId}>
                <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {subjectMap.get(subjectId)?.nome ?? "Outra matéria"}
                </p>
                <div className="space-y-1">
                  {topicList.map((t) => (
                    <button
                      key={t.id}
                      disabled={isPending}
                      onClick={() => handleSelect(t.id)}
                      className="flex w-full items-center justify-between rounded-lg border p-3 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <span className="truncate">{t.nome}</span>
                      <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                        {t.tempoEstimadoMin} min
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
