"use client";

import { useTransition } from "react";
import { Check, Undo2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { completeSession, uncompleteSession, deleteSession } from "@/actions/scheduler";
import { EditSessionTopic } from "./edit-session-topic";
import { SessionTimer } from "./session-timer";
import { SessionNotes } from "./session-notes";
import { toast } from "sonner";
import { TIPO_SESSAO_LABELS } from "@/lib/constants";
import type { PlannedSession, Subject, Topic } from "@/types";
import { cn } from "@/lib/utils";

const tipoColors = {
  estudo: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800",
  revisao_1: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-300 dark:border-green-800",
  revisao_2: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-800",
} as const;

const tipoBorderColors = {
  estudo: "border-l-blue-500",
  revisao_1: "border-l-green-500",
  revisao_2: "border-l-purple-500",
} as const;

interface SessionCardProps {
  session: PlannedSession;
  subject?: Subject;
  topic?: Topic;
  allSubjects?: Subject[];
  allTopics?: Topic[];
}

export function SessionCard({ session, subject, topic, allSubjects, allTopics }: SessionCardProps) {
  const [isPending, startTransition] = useTransition();
  const isCompleted = session.status === "concluida";

  function handleToggle() {
    startTransition(async () => {
      const result = isCompleted
        ? await uncompleteSession(session.id)
        : await completeSession(session.id);

      if (result.success) {
        const messages: Record<string, string> = {
          estudo: "Estudo concluído! Revisão 1 agendada para daqui 10 dias.",
          revisao_1: "Revisão 1 concluída! Revisão 2 agendada para daqui 35 dias.",
          revisao_2: "Revisão 2 concluída! Subtópico marcado como concluído.",
        };
        toast.success(
          isCompleted
            ? "Sessão reaberta \u2014 tópico voltou a Em Andamento"
            : messages[session.tipoSessao] ?? "Sessão concluída!"
        );
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteSession(session.id);
      if (result.success) {
        toast.success("Sessão removida do cronograma");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div
      className={cn(
        "group rounded-lg border border-l-4 p-3 transition-colors",
        tipoBorderColors[session.tipoSessao],
        isCompleted && "opacity-60"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm font-medium truncate", isCompleted && "line-through")}>
            {subject?.nome ?? "\u2014"}
          </p>
          <div className="flex items-center gap-1">
            <p className={cn("text-xs text-muted-foreground truncate", isCompleted && "line-through")}>
              {topic?.nome ?? "\u2014"}
            </p>
            {!isCompleted && allSubjects && allTopics && (
              <EditSessionTopic
                session={session}
                subjects={allSubjects}
                topics={allTopics}
              />
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="secondary" className={cn("text-xs", tipoColors[session.tipoSessao])}>
              {TIPO_SESSAO_LABELS[session.tipoSessao]}
            </Badge>
            <span className="text-xs text-muted-foreground">{session.duracaoMin}&nbsp;min</span>
            {topic && session.duracaoMin < topic.tempoEstimadoMin && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-800">
                Parcial
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 shrink-0">
          {!isCompleted && (
            <SessionTimer
              durationMin={session.duracaoMin}
              subjectName={subject?.nome ?? "\u2014"}
              topicName={topic?.nome ?? "\u2014"}
              onComplete={handleToggle}
            />
          )}
          <Button
            variant={isCompleted ? "ghost" : "outline"}
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={handleToggle}
            disabled={isPending}
            aria-label={isCompleted ? "Reabrir sessão" : "Concluir sessão"}
          >
            {isCompleted ? (
              <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </Button>
          <SessionNotes sessionId={session.id} initialNotes={session.notas} />
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
            onClick={handleDelete}
            disabled={isPending}
            aria-label="Remover sessão do cronograma"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
