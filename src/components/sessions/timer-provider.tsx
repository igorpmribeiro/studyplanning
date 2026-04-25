"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Play, Pause, RotateCcw, X, Trophy, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getSubjectColor } from "@/lib/constants";

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

const QUOTE_INTERVAL = 45_000;

interface TimerSessionInfo {
  sessionId: string;
  subjectName: string;
  topicName: string;
  subjectColorKey?: string | null;
}

interface StartArgs extends TimerSessionInfo {
  durationMin: number;
  onComplete?: () => void;
}

interface TimerContextValue {
  active: boolean;
  dialogOpen: boolean;
  session: TimerSessionInfo | null;
  totalSeconds: number;
  secondsLeft: number;
  isRunning: boolean;
  isFinished: boolean;
  start: (opts: StartArgs) => void;
  openExisting: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  addMinutes: (minutes: number) => void;
  finish: () => void;
  closeDialog: () => void;
  cancel: () => void;
  isCurrentSession: (sessionId: string) => boolean;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useTimer must be used within TimerProvider");
  return ctx;
}

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<TimerSessionInfo | null>(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
  );

  const startTimestampRef = useRef<number | null>(null);
  const startSecondsRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const quoteIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);

  const isFinished = totalSeconds > 0 && secondsLeft <= 0;
  const active = session !== null && totalSeconds > 0;

  // Tick interval — wall-clock based so it survives background tabs
  useEffect(() => {
    if (isRunning && !isFinished) {
      startTimestampRef.current = Date.now();
      startSecondsRef.current = secondsLeft;

      intervalRef.current = setInterval(() => {
        if (startTimestampRef.current === null) return;
        const elapsed = Math.floor((Date.now() - startTimestampRef.current) / 1000);
        const remaining = Math.max(0, startSecondsRef.current - elapsed);
        setSecondsLeft(remaining);
        if (remaining <= 0) setIsRunning(false);
      }, 500);
    } else {
      startTimestampRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, isFinished]);

  // Rotating motivational quotes
  useEffect(() => {
    if (isRunning) {
      quoteIntervalRef.current = setInterval(() => {
        setQuoteIndex((p) => (p + 1) % MOTIVATIONAL_QUOTES.length);
      }, QUOTE_INTERVAL);
    } else if (quoteIntervalRef.current) {
      clearInterval(quoteIntervalRef.current);
      quoteIntervalRef.current = null;
    }
    return () => {
      if (quoteIntervalRef.current) clearInterval(quoteIntervalRef.current);
      quoteIntervalRef.current = null;
    };
  }, [isRunning]);

  const start = useCallback(
    ({ sessionId, subjectName, topicName, subjectColorKey, durationMin, onComplete }: StartArgs) => {
      onCompleteRef.current = onComplete ?? null;
      setSession({ sessionId, subjectName, topicName, subjectColorKey });
      const total = durationMin * 60;
      setTotalSeconds(total);
      setSecondsLeft(total);
      setIsRunning(false);
      setDialogOpen(true);
      setQuoteIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length));
    },
    []
  );

  const openExisting = useCallback(() => setDialogOpen(true), []);
  const closeDialog = useCallback(() => setDialogOpen(false), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const resume = useCallback(() => {
    if (totalSeconds > 0 && secondsLeft > 0) setIsRunning(true);
  }, [totalSeconds, secondsLeft]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(totalSeconds);
  }, [totalSeconds]);

  const addMinutes = useCallback((minutes: number) => {
    if (minutes <= 0) return;
    const additional = minutes * 60;
    setTotalSeconds((t) => t + additional);
    setSecondsLeft((s) => s + additional);
    // Re-baseline running counter so the next tick reflects the bump
    if (isRunning && startTimestampRef.current !== null) {
      startSecondsRef.current += additional;
    }
  }, [isRunning]);

  const cancel = useCallback(() => {
    setIsRunning(false);
    setDialogOpen(false);
    setSession(null);
    setTotalSeconds(0);
    setSecondsLeft(0);
    onCompleteRef.current = null;
  }, []);

  const finish = useCallback(() => {
    const cb = onCompleteRef.current;
    setIsRunning(false);
    setDialogOpen(false);
    setSession(null);
    setTotalSeconds(0);
    setSecondsLeft(0);
    onCompleteRef.current = null;
    cb?.();
  }, []);

  const isCurrentSession = useCallback(
    (sessionId: string) => session?.sessionId === sessionId,
    [session]
  );

  const value: TimerContextValue = {
    active,
    dialogOpen,
    session,
    totalSeconds,
    secondsLeft,
    isRunning,
    isFinished,
    start,
    openExisting,
    pause,
    resume,
    reset,
    addMinutes,
    finish,
    closeDialog,
    cancel,
    isCurrentSession,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
      <TimerDialog quoteIndex={quoteIndex} />
      {active && !dialogOpen && <TimerMiniBar />}
    </TimerContext.Provider>
  );
}

// ─── Timer Dialog ───────────────────────────────────────────

function TimerDialog({ quoteIndex }: { quoteIndex: number }) {
  const t = useTimer();
  if (!t.session) return null;

  const palette = getSubjectColor(t.session.subjectColorKey);
  const minutes = Math.floor(t.secondsLeft / 60);
  const seconds = t.secondsLeft % 60;
  const totalMinutes = Math.round(t.totalSeconds / 60);

  const size = 280;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = t.totalSeconds > 0 ? ((t.totalSeconds - t.secondsLeft) / t.totalSeconds) * 100 : 0;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <Dialog open={t.dialogOpen} onOpenChange={(o) => !o && t.closeDialog()}>
      <DialogContent className="sm:max-w-lg w-full p-0 overflow-hidden" showCloseButton={false}>
        {/* Header */}
        <div className="border-b px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl",
                palette.swatch,
                "text-white"
              )}
            >
              <Play className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold truncate">{t.session.subjectName}</h2>
              <p className="text-sm text-muted-foreground truncate">{t.session.topicName}</p>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {totalMinutes}&nbsp;min
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={t.closeDialog}
              aria-label="Minimizar cronômetro"
              title="Minimizar (continua rodando)"
            >
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-6 px-6 py-8">
          {/* Circular progress */}
          <div className="relative flex items-center justify-center">
            <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
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
                  "transition-[stroke-dashoffset,color] duration-1000",
                  t.isFinished ? "text-green-500" : t.isRunning ? "text-primary" : "text-muted-foreground"
                )}
              />
            </svg>
            <div className="absolute flex flex-col items-center gap-1" aria-live="polite">
              {t.isFinished ? (
                <>
                  <Trophy className="h-10 w-10 text-green-500 mb-1" aria-hidden="true" />
                  <span className="text-5xl font-bold tabular-nums text-green-500">00:00</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Sessão concluída!
                  </span>
                </>
              ) : (
                <>
                  <span className="text-5xl font-bold tabular-nums">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </span>
                  <span className={cn("text-sm font-medium", t.isRunning ? "text-primary" : "text-muted-foreground")}>
                    {t.isRunning ? "Foco total!" : "Pronto para começar?"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Motivational quote */}
          <div className="min-h-[3.5rem] max-w-sm text-center px-2">
            <p className="text-base italic text-muted-foreground leading-relaxed text-pretty">
              &ldquo;{MOTIVATIONAL_QUOTES[quoteIndex]}&rdquo;
            </p>
          </div>

          {/* Add-time chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Adicionar tempo:</span>
            {[5, 10, 15].map((m) => (
              <Button
                key={m}
                variant="outline"
                size="sm"
                onClick={() => t.addMinutes(m)}
                className="h-7 px-2.5 text-xs"
              >
                <Plus className="mr-1 h-3 w-3" aria-hidden="true" />
                {m}&nbsp;min
              </Button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {t.isFinished ? (
              <>
                <Button variant="outline" onClick={t.reset}>
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                  Recomeçar
                </Button>
                <Button onClick={t.finish} className="px-8">
                  <Trophy className="mr-2 h-4 w-4" aria-hidden="true" />
                  Concluir Sessão
                </Button>
              </>
            ) : t.isRunning ? (
              <>
                <Button variant="outline" size="lg" onClick={t.pause}>
                  <Pause className="mr-2 h-5 w-5" aria-hidden="true" />
                  Pausar
                </Button>
                <Button variant="ghost" onClick={t.closeDialog}>
                  <ChevronDown className="mr-2 h-4 w-4" aria-hidden="true" />
                  Minimizar
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" onClick={t.resume} className="px-8">
                  <Play className="mr-2 h-5 w-5" aria-hidden="true" />
                  {t.secondsLeft < t.totalSeconds ? "Continuar" : "Iniciar Estudo"}
                </Button>
                {t.secondsLeft < t.totalSeconds && (
                  <Button variant="outline" onClick={t.reset}>
                    <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                    Reiniciar
                  </Button>
                )}
                <Button variant="ghost" onClick={t.cancel}>
                  <X className="mr-2 h-4 w-4" aria-hidden="true" />
                  Cancelar
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Mini Bar (when dialog is closed but timer is active) ──

function TimerMiniBar() {
  const t = useTimer();
  if (!t.session) return null;

  const palette = getSubjectColor(t.session.subjectColorKey);
  const minutes = Math.floor(t.secondsLeft / 60);
  const seconds = t.secondsLeft % 60;
  const progress = t.totalSeconds > 0 ? ((t.totalSeconds - t.secondsLeft) / t.totalSeconds) * 100 : 0;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(360px,calc(100vw-2rem))] rounded-xl border bg-card shadow-lg overflow-hidden">
      {/* Top progress bar */}
      <div className="h-1 w-full bg-muted">
        <div
          className={cn("h-full transition-all", palette.swatch, t.isFinished && "bg-green-500")}
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="flex items-center gap-3 p-3">
        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", palette.swatch)} aria-hidden="true" />
        <button
          type="button"
          onClick={t.openExisting}
          className="flex min-w-0 flex-1 flex-col items-start text-left focus:outline-none"
          aria-label="Abrir cronômetro"
        >
          <span className="text-sm font-medium truncate w-full">{t.session.subjectName}</span>
          <span className="text-xs text-muted-foreground truncate w-full">
            {t.session.topicName}
          </span>
        </button>
        <span
          className={cn(
            "text-base font-bold tabular-nums",
            t.isFinished ? "text-green-500" : t.isRunning ? "text-primary" : "text-muted-foreground"
          )}
        >
          {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
        </span>
        {t.isFinished ? (
          <Button size="sm" onClick={t.finish} className="h-8 px-2">
            <Trophy className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="outline"
            onClick={t.isRunning ? t.pause : t.resume}
            className="h-8 w-8 shrink-0"
            aria-label={t.isRunning ? "Pausar" : "Continuar"}
          >
            {t.isRunning ? (
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </Button>
        )}
        <Button
          size="icon"
          variant="ghost"
          onClick={t.openExisting}
          className="h-8 w-8 shrink-0"
          aria-label="Expandir"
        >
          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={t.cancel}
          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
          aria-label="Cancelar cronômetro"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
