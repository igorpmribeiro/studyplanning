"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BANCA_LABELS, QUIZ_MODE_LABELS } from "@/lib/constants";
import { Clock, CheckCircle2, XCircle } from "lucide-react";
import type { QuizSession } from "@/types";

function formatTime(seconds: number | null): string {
  if (!seconds) return "-";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}min${sec > 0 ? ` ${sec}s` : ""}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function RecentQuizzes({ sessions }: { sessions: QuizSession[] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Simulados Recentes</h2>
        <Link
          href="/simulado/historico"
          className="text-sm text-primary hover:underline"
        >
          Ver todos
        </Link>
      </div>
      <div className="grid gap-3">
        {sessions.map((session) => {
          const pct =
            session.totalQuestoes > 0
              ? Math.round((session.acertos / session.totalQuestoes) * 100)
              : 0;
          const isCompleted = session.completedAt !== null;

          return (
            <Link
              key={session.id}
              href={
                isCompleted
                  ? `/simulado/${session.id}/resultado`
                  : `/simulado/${session.id}`
              }
              className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50"
            >
              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {BANCA_LABELS[session.banca as keyof typeof BANCA_LABELS]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {QUIZ_MODE_LABELS[session.modo as keyof typeof QUIZ_MODE_LABELS]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{formatDate(session.createdAt)}</span>
                    {session.tempoSegundos && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {formatTime(session.tempoSegundos)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isCompleted ? (
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {session.acertos}
                  </span>
                  <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                    {session.erros}
                  </span>
                  <span className="font-bold tabular-nums">{pct}%</span>
                </div>
              ) : (
                <Badge variant="outline" className="text-xs">
                  Em andamento
                </Badge>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
