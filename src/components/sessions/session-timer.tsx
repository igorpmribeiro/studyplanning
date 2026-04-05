"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const MOTIVATIONAL_QUOTES = [
  "A disciplina é a ponte entre metas e conquistas.",
  "Cada minuto de estudo te aproxima da aprovação.",
  "Não pare quando estiver cansado, pare quando terminar.",
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Você não precisa ser perfeito, precisa ser constante.",
  "A dor do estudo é temporária, a aprovação é para sempre.",
  "Quem estuda com foco, colhe resultados.",
  "O concurseiro que persiste sempre alcança.",
  "Hoje é o dia que o futuro aprovado agradecerá.",
  "Sua dedicação de hoje constrói sua vitória de amanhã.",
  "Grandes conquistas exigem grandes sacrifícios.",
  "Concentre-se no progresso, não na perfeição.",
  "Cada questão estudada é um passo à frente.",
  "A aprovação está mais perto do que você imagina.",
  "Estude como se fosse a última chance. Descanse como se fosse merecido.",
  "Foco, força e fé: a combinação do aprovado.",
  "O edital é o caminho; o estudo é o passo.",
  "Você já decidiu ser aprovado. Agora é só continuar.",
  "A persistência realiza o impossível.",
  "Não conte os dias, faça os dias contarem.",
];

const QUOTE_INTERVAL = 45_000; // change quote every 45 seconds

interface SessionTimerProps {
  durationMin: number;
  subjectName: string;
  topicName: string;
  onComplete?: () => void;
}

export function SessionTimer({
  durationMin,
  subjectName,
  topicName,
  onComplete,
}: SessionTimerProps) {
  const [open, setOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(durationMin * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  );
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quoteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalSeconds = durationMin * 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const isFinished = secondsLeft <= 0;

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (quoteIntervalRef.current) {
      clearInterval(quoteIntervalRef.current);
      quoteIntervalRef.current = null;
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isRunning && !isFinished) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isFinished]);

  // Quote rotation
  useEffect(() => {
    if (isRunning) {
      quoteIntervalRef.current = setInterval(() => {
        setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
      }, QUOTE_INTERVAL);
    } else {
      if (quoteIntervalRef.current) {
        clearInterval(quoteIntervalRef.current);
        quoteIntervalRef.current = null;
      }
    }
    return () => {
      if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
    };
  }, [isRunning]);

  // Cleanup on unmount
  useEffect(() => clearTimers, [clearTimers]);

  function handleOpen() {
    setSecondsLeft(durationMin * 60);
    setIsRunning(false);
    setQuoteIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
    setOpen(true);
  }

  function handleStart() {
    if (isFinished) {
      setSecondsLeft(durationMin * 60);
    }
    setIsRunning(true);
  }

  function handlePause() {
    setIsRunning(false);
  }

  function handleReset() {
    setIsRunning(false);
    setSecondsLeft(durationMin * 60);
  }

  function handleFinish() {
    clearTimers();
    setIsRunning(false);
    setOpen(false);
    onComplete?.();
  }

  function handleClose() {
    clearTimers();
    setIsRunning(false);
    setOpen(false);
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  // SVG circle dimensions
  const size = 200;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0"
        onClick={handleOpen}
        title="Iniciar sessão"
      >
        <Play className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{subjectName}</DialogTitle>
            <DialogDescription>{topicName}</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            {/* Circular progress with timer */}
            <div className="relative flex items-center justify-center">
              <svg width={size} height={size} className="-rotate-90">
                {/* Background circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-muted/30"
                />
                {/* Progress circle */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000",
                    isFinished
                      ? "text-green-500"
                      : isRunning
                        ? "text-primary"
                        : "text-muted-foreground"
                  )}
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-4xl font-bold tabular-nums">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isFinished ? "Concluído!" : isRunning ? "Em andamento" : "Pausado"}
                </span>
              </div>
            </div>

            {/* Motivational quote */}
            <div className="min-h-[3rem] px-4 text-center">
              <p className="text-sm italic text-muted-foreground leading-relaxed">
                &ldquo;{MOTIVATIONAL_QUOTES[quoteIndex]}&rdquo;
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {isFinished ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Recomeçar
                  </Button>
                  <Button size="sm" onClick={handleFinish}>
                    Concluir Sessão
                  </Button>
                </>
              ) : isRunning ? (
                <>
                  <Button variant="outline" size="sm" onClick={handlePause}>
                    <Pause className="mr-2 h-4 w-4" />
                    Pausar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleClose}>
                    <X className="mr-2 h-4 w-4" />
                    Fechar
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" onClick={handleStart}>
                    <Play className="mr-2 h-4 w-4" />
                    {secondsLeft < totalSeconds ? "Continuar" : "Iniciar"}
                  </Button>
                  {secondsLeft < totalSeconds && (
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reiniciar
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={handleClose}>
                    <X className="mr-2 h-4 w-4" />
                    Fechar
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
