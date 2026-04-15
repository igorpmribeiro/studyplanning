"use client";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";

export function QuizNavigation({
  currentIndex,
  totalQuestions,
  answeredCount,
  isCurrentAnswered,
  onPrev,
  onNext,
  onFinish,
}: {
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
  isCurrentAnswered: boolean;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
}) {
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);
  const isLast = currentIndex === totalQuestions - 1;
  const allAnswered = answeredCount === totalQuestions;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <Progress value={progressPercent} className="flex-1" />
        <span className="text-sm font-medium tabular-nums text-muted-foreground">
          {answeredCount}/{totalQuestions}
        </span>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrev}
          disabled={currentIndex === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Anterior
        </Button>

        <div className="flex gap-2">
          {allAnswered && (
            <Button onClick={onFinish} size="sm" className="gap-1">
              <Flag className="h-4 w-4" aria-hidden="true" />
              Finalizar
            </Button>
          )}

          {!isLast && isCurrentAnswered && (
            <Button variant="outline" size="sm" onClick={onNext} className="gap-1">
              Próxima
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      {/* Question dots */}
      <div className="flex flex-wrap gap-1.5 justify-center">
        {Array.from({ length: totalQuestions }, (_, i) => {
          const isCurrent = i === currentIndex;
          let bg = "bg-muted";
          if (isCurrent) bg = "bg-primary";
          else if (i < answeredCount || (i < totalQuestions && answeredCount > i))
            bg = "bg-primary/40";

          return (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-colors ${bg}`}
              aria-label={`Questão ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
