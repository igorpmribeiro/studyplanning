"use client";

import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { SortableSession } from "./sortable-session";
import { DIA_SEMANA_SHORT } from "@/lib/constants";
import type { PlannedSession, Subject, Topic } from "@/types";
import { cn } from "@/lib/utils";

interface DroppableDayProps {
  dayIndex: number;
  sessions: PlannedSession[];
  subjectMap: Map<string, Subject>;
  topicMap: Map<string, Topic>;
  allSubjects: Subject[];
  allTopics: Topic[];
  isOver: boolean;
}

export function DroppableDay({
  dayIndex,
  sessions,
  subjectMap,
  topicMap,
  allSubjects,
  allTopics,
  isOver,
}: DroppableDayProps) {
  const { setNodeRef } = useDroppable({
    id: `day-${dayIndex}`,
    data: { type: "day", dayIndex },
  });

  const totalMin = sessions.reduce((acc, s) => acc + s.duracaoMin, 0);
  const completedCount = sessions.filter((s) => s.status === "concluida").length;
  const sessionIds = sessions.map((s) => s.id);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-sm transition-colors",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{DIA_SEMANA_SHORT[dayIndex]}</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{totalMin} min</span>
          {sessions.length > 0 && (
            <span>
              {completedCount}/{sessions.length}
            </span>
          )}
        </div>
      </div>
      <div ref={setNodeRef} className="min-h-[80px] space-y-2 p-3">
        <SortableContext items={sessionIds} strategy={verticalListSortingStrategy}>
          {sessions.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Sem sessões
            </p>
          ) : (
            sessions.map((session) => (
              <SortableSession
                key={session.id}
                session={session}
                subject={subjectMap.get(session.subjectId)}
                topic={topicMap.get(session.topicId)}
                allSubjects={allSubjects}
                allTopics={allTopics}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
