export const dynamic = "force-dynamic";

import Link from "next/link";
import { BookOpen, FileText, CalendarDays, CheckCircle2, Clock, RotateCcw, ClipboardList, Target, Flame } from "lucide-react";
import { getOrCreatePlanning } from "@/actions/planning";
import { getQuizStats } from "@/actions/simulado";
import { getStudyDays, getWeakAreas } from "@/actions/desempenho";
import { db } from "@/db";
import { subjects, topics, plannedSessions } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export default async function HomePage() {
  const planning = await getOrCreatePlanning();

  const [subjectRows, allSessions, quizStats, studyDays, weakAreas] = await Promise.all([
    db.query.subjects.findMany({
      where: eq(subjects.planningId, planning.id),
      with: { topics: true },
    }),
    db
      .select()
      .from(plannedSessions)
      .where(eq(plannedSessions.planningId, planning.id)),
    getQuizStats(planning.id),
    getStudyDays(planning.id),
    getWeakAreas(planning.id),
  ]);

  // Calculate streak
  function calcStreak(days: string[]): number {
    if (days.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0, 10);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    // days is sorted DESC - check if streak is current
    if (days[0] !== todayStr && days[0] !== yesterdayStr) return 0;

    let streak = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);
      const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  const streak = calcStreak(studyDays);

  // Build recommendations
  type Recommendation = { label: string; reason: string; type: "weak" | "pending" | "new" };
  const recommendations: Recommendation[] = [];

  // 1. Weak areas from quizzes
  for (const area of weakAreas.slice(0, 2)) {
    recommendations.push({
      label: `${area.topicNome}`,
      reason: `Acertou ${area.pct}% nos simulados (${area.subjectNome})`,
      type: "weak",
    });
  }

  // 2. Topics in "revisando" status (need review)
  const reviewingTopics = subjectRows
    .flatMap((s) => s.topics.filter((t) => t.status === "revisando").map((t) => ({ ...t, subjectNome: s.nome })))
    .slice(0, 2);
  for (const t of reviewingTopics) {
    if (!recommendations.some((r) => r.label === t.nome)) {
      recommendations.push({
        label: t.nome,
        reason: `Em revisão (${t.subjectNome})`,
        type: "pending",
      });
    }
  }

  // 3. High-priority not started topics
  const notStarted = subjectRows
    .filter((s) => s.prioridade === "alta")
    .flatMap((s) => s.topics.filter((t) => t.status === "nao_iniciado").map((t) => ({ ...t, subjectNome: s.nome })))
    .slice(0, 2);
  for (const t of notStarted) {
    if (!recommendations.some((r) => r.label === t.nome)) {
      recommendations.push({
        label: t.nome,
        reason: `Não iniciado, matéria prioritária (${t.subjectNome})`,
        type: "new",
      });
    }
  }

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
    {
      label: "Simulados",
      value: quizStats.totalQuizzes,
      icon: ClipboardList,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950",
    },
    {
      label: "Acerto Médio",
      value: `${quizStats.averageScore}%`,
      icon: Target,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950",
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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

      {/* Streak */}
      {streak > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950">
              <Flame className="h-5 w-5 text-orange-500" aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {streak} dia{streak !== 1 ? "s" : ""} de sequência
              </p>
              <p className="text-sm text-muted-foreground">
                Continue estudando para manter sua sequência!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">O que estudar agora?</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommendations.slice(0, 3).map((rec) => {
              const colors = {
                weak: "border-l-red-500 bg-red-50/50 dark:bg-red-950/20",
                pending: "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20",
                new: "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20",
              };
              const labels = { weak: "Ponto fraco", pending: "Revisão pendente", new: "Novo tópico" };
              return (
                <div key={rec.label} className={`rounded-lg border border-l-4 p-4 ${colors[rec.type]}`}>
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {labels[rec.type]}
                  </span>
                  <p className="mt-1 text-sm font-medium truncate">{rec.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{rec.reason}</p>
                </div>
              );
            })}
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
