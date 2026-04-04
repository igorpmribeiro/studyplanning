import { BookOpen, FileText, CalendarDays, CheckCircle2 } from "lucide-react";
import { getOrCreatePlanning } from "@/actions/planning";
import { db } from "@/db";
import { subjects, topics, plannedSessions } from "@/db/schema";
import { eq, count } from "drizzle-orm";

export default async function HomePage() {
  const planning = await getOrCreatePlanning();

  const [subjectCount] = await db
    .select({ count: count() })
    .from(subjects)
    .where(eq(subjects.planningId, planning.id));

  const subjectIds = (
    await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.planningId, planning.id))
  ).map((s) => s.id);

  // Count topics belonging to this planning's subjects
  const allTopics = await db.select({ id: topics.id, subjectId: topics.subjectId }).from(topics);
  const topicCount = allTopics.filter((t) => subjectIds.includes(t.subjectId)).length;

  const [sessionCount] = await db
    .select({ count: count() })
    .from(plannedSessions)
    .where(eq(plannedSessions.planningId, planning.id));

  const [completedCount] = await db
    .select({ count: count() })
    .from(plannedSessions)
    .where(eq(plannedSessions.planningId, planning.id));

  // Get actual completed count
  const allSessions = await db
    .select({ status: plannedSessions.status })
    .from(plannedSessions)
    .where(eq(plannedSessions.planningId, planning.id));

  const totalSessions = allSessions.length;
  const completedSessions = allSessions.filter((s) => s.status === "concluida").length;
  const progressPercent = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

  const stats = [
    {
      label: "Total de Matérias",
      value: subjectCount.count,
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
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      {totalSessions > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Progresso da Semana</h2>
            <span className="text-sm text-muted-foreground">
              {completedSessions} de {totalSessions} sessões ({progressPercent}%)
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-secondary">
            <div
              className="h-3 rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
