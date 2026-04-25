"use client";

import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimer } from "./timer-provider";

interface SessionTimerProps {
  sessionId: string;
  durationMin: number;
  subjectName: string;
  topicName: string;
  subjectColorKey?: string | null;
  onComplete?: () => void;
}

export function SessionTimer({
  sessionId,
  durationMin,
  subjectName,
  topicName,
  subjectColorKey,
  onComplete,
}: SessionTimerProps) {
  const timer = useTimer();
  const isCurrent = timer.isCurrentSession(sessionId);

  function handleClick() {
    if (isCurrent) {
      timer.openExisting();
    } else {
      timer.start({
        sessionId,
        durationMin,
        subjectName,
        topicName,
        subjectColorKey,
        onComplete,
      });
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={handleClick}
      aria-label={isCurrent ? "Abrir cronômetro" : "Iniciar sessão de estudo"}
    >
      <Play className="h-3.5 w-3.5" aria-hidden="true" />
    </Button>
  );
}
