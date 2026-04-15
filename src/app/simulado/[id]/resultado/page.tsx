export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getQuizSession } from "@/actions/simulado";
import { db } from "@/db";
import { subjects } from "@/db/schema";
import { inArray } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BANCA_LABELS, QUIZ_MODE_LABELS } from "@/lib/constants";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  ArrowLeft,
  RotateCcw,
  ChevronDown,
} from "lucide-react";

function formatTime(seconds: number | null): string {
  if (!seconds) return "-";
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  if (min === 0) return `${sec}s`;
  return `${min}min${sec > 0 ? ` ${sec}s` : ""}`;
}

export default async function ResultadoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getQuizSession(id);

  if (!session || !session.completedAt) {
    notFound();
  }

  const pct =
    session.totalQuestoes > 0
      ? Math.round((session.acertos / session.totalQuestoes) * 100)
      : 0;

  // Group answers by subject
  const subjectIds = [...new Set(session.answers.map((a) => a.question.subjectId))];
  let subjectNames: Record<string, string> = {};
  if (subjectIds.length > 0) {
    const rows = await db
      .select({ id: subjects.id, nome: subjects.nome })
      .from(subjects)
      .where(inArray(subjects.id, subjectIds));
    subjectNames = Object.fromEntries(rows.map((r) => [r.id, r.nome]));
  }

  const bySubject: Record<string, { nome: string; total: number; correct: number }> = {};
  for (const a of session.answers) {
    const sid = a.question.subjectId;
    if (!bySubject[sid]) {
      bySubject[sid] = { nome: subjectNames[sid] ?? "Desconhecida", total: 0, correct: 0 };
    }
    bySubject[sid].total += 1;
    if (a.correto === 1) bySubject[sid].correct += 1;
  }

  // Score color
  let scoreColor = "text-red-600 dark:text-red-400";
  let scoreBg = "bg-red-50 dark:bg-red-950/30";
  if (pct >= 80) {
    scoreColor = "text-green-600 dark:text-green-400";
    scoreBg = "bg-green-50 dark:bg-green-950/30";
  } else if (pct >= 60) {
    scoreColor = "text-amber-600 dark:text-amber-400";
    scoreBg = "bg-amber-50 dark:bg-amber-950/30";
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resultado</h1>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary">
              {BANCA_LABELS[session.banca as keyof typeof BANCA_LABELS]}
            </Badge>
            <Badge variant="outline">
              {QUIZ_MODE_LABELS[session.modo as keyof typeof QUIZ_MODE_LABELS]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Score card */}
      <div className={`rounded-2xl border-2 p-8 text-center shadow-sm ${scoreBg}`}>
        <div className="mb-2 flex justify-center">
          <Trophy className={`h-10 w-10 ${scoreColor}`} aria-hidden="true" />
        </div>
        <p className={`text-5xl font-bold tabular-nums ${scoreColor}`}>{pct}%</p>
        <p className="mt-2 text-muted-foreground">
          {session.acertos} acertos de {session.totalQuestoes} questões
        </p>
        <div className="mt-3 flex items-center justify-center gap-6 text-sm">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            {session.acertos} acertos
          </span>
          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <XCircle className="h-4 w-4" aria-hidden="true" />
            {session.erros} erros
          </span>
          {session.tempoSegundos && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" aria-hidden="true" />
              {formatTime(session.tempoSegundos)}
            </span>
          )}
        </div>
      </div>

      {/* By subject breakdown */}
      {Object.keys(bySubject).length > 1 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Por Matéria</h2>
          <div className="grid gap-2">
            {Object.entries(bySubject).map(([sid, data]) => {
              const subjPct = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
              return (
                <div
                  key={sid}
                  className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div>
                    <p className="text-sm font-medium">{data.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {data.correct}/{data.total} acertos
                    </p>
                  </div>
                  <span className="text-lg font-bold tabular-nums">{subjPct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Questions review */}
      <div className="space-y-3">
        <h2 className="font-semibold">Revisão das Questões</h2>
        <div className="space-y-4">
          {session.answers.map((answer, i) => {
            const q = answer.question;
            const isCorrect = answer.correto === 1;
            const alternativas = q.alternativas
              ? (JSON.parse(q.alternativas) as string[])
              : null;

            return (
              <details
                key={answer.id}
                className="group rounded-xl border bg-card shadow-sm"
              >
                <summary className="flex cursor-pointer items-center justify-between p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl">
                  <div className="flex items-center gap-3">
                    {isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" aria-hidden="true" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
                    )}
                    <span className="text-sm font-medium">
                      Questão {i + 1}
                    </span>
                  </div>
                  <ChevronDown
                    className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <div className="border-t px-4 pb-4 pt-3 space-y-3">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {q.enunciado}
                  </p>

                  {alternativas ? (
                    <div className="space-y-1">
                      {alternativas.map((alt, j) => {
                        const letter = ["a", "b", "c", "d", "e"][j];
                        const isUserAnswer = answer.respostaUsuario === letter;
                        const isCorrectAnswer = q.respostaCorreta === letter;
                        let style = "";
                        if (isCorrectAnswer) style = "text-green-700 dark:text-green-400 font-medium";
                        else if (isUserAnswer && !isCorrect) style = "text-red-700 dark:text-red-400 line-through";

                        return (
                          <p key={letter} className={`text-sm ${style}`}>
                            <span className="font-bold mr-1">
                              {letter.toUpperCase()})
                            </span>
                            {alt}
                            {isUserAnswer && " (sua resposta)"}
                          </p>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm">
                      Sua resposta:{" "}
                      <span className={isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                        {answer.respostaUsuario === "certo" ? "Certo" : "Errado"}
                      </span>
                      {!isCorrect && (
                        <span className="text-muted-foreground">
                          {" "}(gabarito: {q.respostaCorreta === "certo" ? "Certo" : "Errado"})
                        </span>
                      )}
                    </p>
                  )}

                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Explicação</p>
                    <p className="text-sm leading-relaxed">{q.explicacao}</p>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button render={<Link href="/simulado" />} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar
        </Button>
        <Button render={<Link href="/simulado" />} className="gap-2">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Novo Simulado
        </Button>
      </div>
    </div>
  );
}
