"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, RotateCcw, X, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const MOTIVATIONAL_QUOTES = [
  "A disciplina é a ponte entre metas e conquistas.",
  "Cada minuto de estudo te aproxima da aprovacao.",
  "Nao pare quando estiver cansado, pare quando terminar.",
  "O sucesso é a soma de pequenos esforcos repetidos dia após dia.",
  "Voce nao precisa ser perfeito, precisa ser constante.",
  "A dor do estudo é temporaria, a aprovacao é para sempre.",
  "Quem estuda com foco, colhe resultados.",
  "O concurseiro que persiste sempre alcanca.",
  "Hoje é o dia que o futuro aprovado agradecera.",
  "Sua dedicacao de hoje constrói sua vitória de amanha.",
  "Grandes conquistas exigem grandes sacrifícios.",
  "Concentre-se no progresso, nao na perfeicao.",
  "Cada questao estudada é um passo a frente.",
  "A aprovacao esta mais perto do que voce imagina.",
  "Estude como se fosse a última chance. Descanse como se fosse merecido.",
  "Foco, forca e fé: a combinacao do aprovado.",
  "O edital é o caminho; o estudo é o passo.",
  "Voce ja decidiu ser aprovado. Agora é só continuar.",
  "A persistencia realiza o impossível.",
  "Nao conte os dias, faca os dias contarem.",
];

const QUOTE_INTERVAL = 45_000;

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

  useEffect(() => clearTimers, [clearTimers]);

  function handleOpen() {
    setSecondsLeft(durationMin * 60);
    setIsRunning(false);
    setQuoteIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
    setOpen(true);
  }

  function handleStart() {
    if (isFinished) setSecondsLeft(durationMin * 60);
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

  const size = 280;
  const strokeWidth = 10;
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
        title="Iniciar sessao"
      >
        <Play className="h-3.5 w-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogContent
          className="sm:max-w-lg w-full p-0 overflow-hidden"
          showCloseButton={false}
        >
          {/* Header with subject info */}
          <div className="border-b px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold truncate">{subjectName}</h2>
                <p className="text-sm text-muted-foreground truncate">{topicName}</p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {durationMin} min
              </Badge>
            </div>
          </div>

          {/* Timer body */}
          <div className="flex flex-col items-center gap-8 px-6 py-8">
            {/* Circular progress */}
            <div className="relative flex items-center justify-center">
              <svg width={size} height={size} className="-rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-muted/20"
                />
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
              <div className="absolute flex flex-col items-center gap-1">
                {isFinished ? (
                  <>
                    <Trophy className="h-10 w-10 text-green-500 mb-1" />
                    <span className="text-5xl font-bold tabular-nums text-green-500">
                      00:00
                    </span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Sessao concluída!
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-5xl font-bold tabular-nums">
                      {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                    </span>
                    <span className={cn(
                      "text-sm font-medium",
                      isRunning ? "text-primary" : "text-muted-foreground"
                    )}>
                      {isRunning ? "Foco total!" : "Pronto para comecar?"}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Motivational quote */}
            <div className="min-h-[4rem] max-w-sm text-center px-2">
              <p className="text-base italic text-muted-foreground leading-relaxed">
                &ldquo;{MOTIVATIONAL_QUOTES[quoteIndex]}&rdquo;
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3">
              {isFinished ? (
                <>
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Recomecar
                  </Button>
                  <Button onClick={handleFinish} className="px-8">
                    <Trophy className="mr-2 h-4 w-4" />
                    Concluir Sessao
                  </Button>
                </>
              ) : isRunning ? (
                <>
                  <Button variant="outline" size="lg" onClick={handlePause}>
                    <Pause className="mr-2 h-5 w-5" />
                    Pausar
                  </Button>
                  <Button variant="ghost" onClick={handleClose}>
                    <X className="mr-2 h-4 w-4" />
                    Fechar
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" onClick={handleStart} className="px-8">
                    <Play className="mr-2 h-5 w-5" />
                    {secondsLeft < totalSeconds ? "Continuar" : "Iniciar Estudo"}
                  </Button>
                  {secondsLeft < totalSeconds && (
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Reiniciar
                    </Button>
                  )}
                  <Button variant="ghost" onClick={handleClose}>
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
