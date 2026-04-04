"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SessionCard } from "./session-card";
import type { PlannedSession, Subject, Topic } from "@/types";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableSessionProps {
  session: PlannedSession;
  subject?: Subject;
  topic?: Topic;
}

export function SortableSession({ session, subject, topic }: SortableSessionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: session.id,
    data: {
      type: "session",
      session,
      diaSemana: session.diaSemana,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "opacity-50 z-50"
      )}
    >
      <div
        className="absolute left-0 top-0 bottom-0 flex items-center pl-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="pl-5">
        <SessionCard session={session} subject={subject} topic={topic} />
      </div>
    </div>
  );
}
