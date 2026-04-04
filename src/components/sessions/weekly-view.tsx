"use client";

import { SessionCard } from "./session-card";
import { DIA_SEMANA_SHORT } from "@/lib/constants";
import type { PlannedSession, Subject, Topic } from "@/types";

interface WeeklyViewProps {
  sessions: PlannedSession[];
  subjects: Subject[];
  topics: Topic[];
}

export function WeeklyView({ sessions, subjects, topics }: WeeklyViewProps) {
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const topicMap = new Map(topics.map((t) => [t.id, t]));

  const sessionsByDay: Record<number, PlannedSession[]> = {};
  for (let i = 0; i < 7; i++) sessionsByDay[i] = [];
  for (const session of sessions) {
    sessionsByDay[session.diaSemana]?.push(session);
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
        <p className="text-lg font-medium">Nenhuma sessão planejada</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Clique em &quot;Gerar Planejamento&quot; para criar seu cronograma semanal.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 7 }, (_, dayIndex) => {
        const daySessions = sessionsByDay[dayIndex] ?? [];
        const totalMin = daySessions.reduce((acc, s) => acc + s.duracaoMin, 0);
        const completedCount = daySessions.filter((s) => s.status === "concluida").length;

        return (
          <div key={dayIndex} className="rounded-xl border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">{DIA_SEMANA_SHORT[dayIndex]}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{totalMin} min</span>
                {daySessions.length > 0 && (
                  <span>
                    {completedCount}/{daySessions.length}
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-2 p-3">
              {daySessions.length === 0 ? (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  Sem sessões
                </p>
              ) : (
                daySessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    subject={subjectMap.get(session.subjectId)}
                    topic={topicMap.get(session.topicId)}
                  />
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
