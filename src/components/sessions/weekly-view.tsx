"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { DroppableDay } from "./droppable-day";
import { SessionCard } from "./session-card";
import { moveSession } from "@/actions/scheduler";
import { toast } from "sonner";
import type { PlannedSession, Subject, Topic } from "@/types";

interface WeeklyViewProps {
  sessions: PlannedSession[];
  subjects: Subject[];
  topics: Topic[];
  weekDates: string[];
}

export function WeeklyView({ sessions: initialSessions, subjects, topics, weekDates }: WeeklyViewProps) {
  const [sessions, setSessions] = useState(initialSessions);
  const [activeSession, setActiveSession] = useState<PlannedSession | null>(null);
  const [overDayIndex, setOverDayIndex] = useState<number | null>(null);

  // Sync local state when server re-renders with new data
  useEffect(() => {
    setSessions(initialSessions);
  }, [initialSessions]);
  const [, startTransition] = useTransition();

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const topicMap = new Map(topics.map((t) => [t.id, t]));

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sessionsByDay = useCallback((): Record<number, PlannedSession[]> => {
    const map: Record<number, PlannedSession[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    for (const session of sessions) {
      map[session.diaSemana]?.push(session);
    }
    // Sort by ordemNoDia within each day
    for (const day of Object.values(map)) {
      day.sort((a, b) => a.ordemNoDia - b.ordemNoDia);
    }
    return map;
  }, [sessions]);

  function findDayIndex(id: string): number | null {
    // Check if it's a day container
    if (id.startsWith("day-")) return parseInt(id.replace("day-", ""));
    // Find which day this session belongs to
    const session = sessions.find((s) => s.id === id);
    return session ? session.diaSemana : null;
  }

  function handleDragStart(event: DragStartEvent) {
    const session = sessions.find((s) => s.id === event.active.id);
    setActiveSession(session ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event;
    if (!over) {
      setOverDayIndex(null);
      return;
    }
    const dayIdx = findDayIndex(over.id as string);
    setOverDayIndex(dayIdx);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveSession(null);
    setOverDayIndex(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const sourceDayIndex = active.data.current?.diaSemana as number | undefined;
    const targetDayIndex = findDayIndex(overId);

    if (sourceDayIndex === undefined || targetDayIndex === null) return;

    const currentByDay = sessionsByDay();

    // Build new sessions array
    let updatedSessions = [...sessions];
    const movedSession = updatedSessions.find((s) => s.id === activeId);
    if (!movedSession) return;

    if (sourceDayIndex === targetDayIndex) {
      // Reorder within same day
      const daySessions = [...currentByDay[targetDayIndex]];
      const oldIndex = daySessions.findIndex((s) => s.id === activeId);
      const overSession = daySessions.find((s) => s.id === overId);
      const newIndex = overSession
        ? daySessions.findIndex((s) => s.id === overId)
        : daySessions.length - 1;

      if (oldIndex === newIndex) return;

      // Reorder
      daySessions.splice(oldIndex, 1);
      daySessions.splice(newIndex, 0, movedSession);

      // Update ordemNoDia
      const newOrder = daySessions.map((s, i) => {
        const updated = updatedSessions.find((us) => us.id === s.id)!;
        return { ...updated, ordemNoDia: i + 1 };
      });

      updatedSessions = updatedSessions.map((s) => {
        const reordered = newOrder.find((n) => n.id === s.id);
        return reordered ?? s;
      });

      setSessions(updatedSessions);

      // Persist
      startTransition(async () => {
        const result = await moveSession(
          activeId,
          targetDayIndex,
          weekDates[targetDayIndex],
          daySessions.map((s) => s.id)
        );
        if (!result.success) toast.error("Erro ao mover sessão");
      });
    } else {
      // Move to different day
      // Remove from source day
      const sourceSessions = currentByDay[sourceDayIndex].filter(
        (s) => s.id !== activeId
      );
      // Add to target day
      const targetSessions = [...currentByDay[targetDayIndex]];

      // Find insertion index
      const overInTarget = targetSessions.findIndex((s) => s.id === overId);
      const insertIndex = overInTarget >= 0 ? overInTarget : targetSessions.length;
      targetSessions.splice(insertIndex, 0, movedSession);

      // Update the moved session
      updatedSessions = updatedSessions.map((s) => {
        if (s.id === activeId) {
          return {
            ...s,
            diaSemana: targetDayIndex,
            data: weekDates[targetDayIndex],
          };
        }
        return s;
      });

      // Update order for source day
      sourceSessions.forEach((s, i) => {
        updatedSessions = updatedSessions.map((us) =>
          us.id === s.id ? { ...us, ordemNoDia: i + 1 } : us
        );
      });

      // Update order for target day
      targetSessions.forEach((s, i) => {
        updatedSessions = updatedSessions.map((us) =>
          us.id === s.id ? { ...us, ordemNoDia: i + 1 } : us
        );
      });

      setSessions(updatedSessions);

      // Persist — send target day order
      startTransition(async () => {
        const result = await moveSession(
          activeId,
          targetDayIndex,
          weekDates[targetDayIndex],
          targetSessions.map((s) => s.id)
        );
        if (!result.success) toast.error("Erro ao mover sessão");
        // Also reorder source day
        if (sourceSessions.length > 0) {
          await moveSession(
            sourceSessions[0].id,
            sourceDayIndex,
            weekDates[sourceDayIndex],
            sourceSessions.map((s) => s.id)
          );
        }
      });
    }
  }

  const byDay = sessionsByDay();

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 7 }, (_, dayIndex) => (
          <DroppableDay
            key={dayIndex}
            dayIndex={dayIndex}
            sessions={byDay[dayIndex]}
            subjectMap={subjectMap}
            topicMap={topicMap}
            allSubjects={subjects}
            allTopics={topics}
            isOver={overDayIndex === dayIndex}
          />
        ))}
      </div>

      <DragOverlay>
        {activeSession && (
          <div className="w-64 opacity-90">
            <SessionCard
              session={activeSession}
              subject={subjectMap.get(activeSession.subjectId)}
              topic={topicMap.get(activeSession.topicId)}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
