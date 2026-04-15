export const dynamic = "force-dynamic";

import Link from "next/link";
import { getOrCreatePlanning } from "@/actions/planning";
import { getQuizHistory } from "@/actions/simulado";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BANCA_LABELS, QUIZ_MODE_LABELS } from "@/lib/constants";
import { ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";

function formatTime(seconds: number | null): string {
  if (!seconds) return "-";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min === 0) return `${sec}s`;
  return `${min}min${sec > 0 ? ` ${sec}s` : ""}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export default async function HistoricoPage() {
  const planning = await getOrCreatePlanning();
  const sessions = await getQuizHistory(planning.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Histórico de Simulados</h1>
          <p className="text-muted-foreground">
            {sessions.length} simulado{sessions.length !== 1 ? "s" : ""} realizado{sessions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/simulado" />} variant="outline" size="sm" className="gap-1">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
          Nenhum simulado realizado ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const pct =
              session.totalQuestoes > 0
                ? Math.round((session.acertos / session.totalQuestoes) * 100)
                : 0;
            const isCompleted = session.completedAt !== null;

            let scoreBadge = "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
            if (pct >= 80) scoreBadge = "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
            else if (pct >= 60) scoreBadge = "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";

            return (
              <Link
                key={session.id}
                href={
                  isCompleted
                    ? `/simulado/${session.id}/resultado`
                    : `/simulado/${session.id}`
                }
                className="flex items-center justify-between rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent/50"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {BANCA_LABELS[session.banca as keyof typeof BANCA_LABELS]}
                    </Badge>
                    <Badge variant="outline">
                      {QUIZ_MODE_LABELS[session.modo as keyof typeof QUIZ_MODE_LABELS]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {session.totalQuestoes} questões
                    </span>
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

                {isCompleted ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        {session.acertos}
                      </span>
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        {session.erros}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-bold tabular-nums ${scoreBadge}`}
                    >
                      {pct}%
                    </span>
                  </div>
                ) : (
                  <Badge variant="outline">Em andamento</Badge>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
