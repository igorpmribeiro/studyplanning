export const dynamic = "force-dynamic";

import { BookOpen, FileText, CalendarDays, CheckCircle2, Clock, RotateCcw } from "lucide-react";
import { getOrCreatePlanning } from "@/actions/planning";
import { db } from "@/db";
import { subjects, topics, plannedSessions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export default async function HomePage() {
  const planning = await getOrCreatePlanning();

  const [subjectRows, allSessions] = await Promise.all([
    db.query.subjects.findMany({
      where: eq(subjects.planningId, planning.id),
      with: { topics: true },
    }),
    db
      .select()
      .from(plannedSessions)
      .where(eq(plannedSessions.planningId, planning.id)),
  ]);

  const subjectCount = subjectRows.length;

  const topicCount = subjectRows.reduce((acc, s) => acc + s.topics.length, 0);

  const totalSessions = allSessions.length;
  const completedSessions = allSessions.filter((s) => s.status === "concluida").length;
  const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  // Per-subject progress data
  const subjectProgress = subjectRows.map((subject) => {
    const total = subject.topics.length;
    const completed = subject.topics.filter((t) => t.status === "concluido").length;
    const inProgress = subject.topics.filter((t) => t.status === "em_andamento" || t.status === "revisando").length;

    const subjectSessions = allSessions.filter((s) => s.subjectId === subject.id && s.status === "concluida");
    const studyMin = subjectSessions
      .filter((s) => s.tipoSessao === "estudo")
      .reduce((acc, s) => acc + s.duracaoMin, 0);
    const reviewMin = subjectSessions
      .filter((s) => s.tipoSessao === "revisao_1" || s.tipoSessao === "revisao_2")
      .reduce((acc, s) => acc + s.duracaoMin, 0);

    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: subject.id,
      nome: subject.nome,
      total,
      completed,
      inProgress,
      studyMin,
      reviewMin,
      pct,
    };
  }).sort((a, b) => b.pct - a.pct);

  const stats = [
    {
      label: "Total de Matérias",
      value: subjectCount,
      icon: BookOpen,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Total de Subtópicos",
      value: topicCount,
      icon: FileText,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Sessões Planejadas",
      value: totalSessions,
      icon: CalendarDays,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
    {
      label: "Sessões Concluídas",
      value: completedSessions,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950",
    },
  ];

  function formatHours(min: number): string {
    if (min === 0) return "0\u00A0min";
    const h = Math.floor(min / 60);
    const m = min % 60;
    if (h === 0) return `${m}\u00A0min`;
    if (m === 0) return `${h}h`;
    return `${h}h${m}min`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu planejamento de estudos.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} aria-hidden="true" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Weekly Progress */}
      {totalSessions > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Progresso da Semana</h2>
            <span className="text-sm text-muted-foreground tabular-nums">
              {completedSessions} de {totalSessions} sessões ({progressPercent}%)
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-secondary">
            <div
              className="h-3 rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Per-subject progress */}
      {subjectProgress.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Progresso por Matéria</h2>
          <div className="grid gap-3">
            {subjectProgress.map((sp) => (
              <div key={sp.id} className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium truncate">{sp.nome}</h3>
                  <span className="text-xs text-muted-foreground shrink-0 ml-2 tabular-nums">
                    {sp.completed}/{sp.total} concluídos ({sp.pct}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary mb-3">
                  <div
                    className="h-2 rounded-full bg-green-500 transition-[width] duration-500"
                    style={{ width: `${sp.pct}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>Estudo: {formatHours(sp.studyMin)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <RotateCcw className="h-3 w-3" aria-hidden="true" />
                    <span>Revisão: {formatHours(sp.reviewMin)}</span>
                  </div>
                  {sp.inProgress > 0 && (
                    <span>{sp.inProgress} em andamento</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
