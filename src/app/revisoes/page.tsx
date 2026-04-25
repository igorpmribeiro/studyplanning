export const dynamic = "force-dynamic";

import { CalendarCheck2, AlertTriangle, CalendarClock, BookMarked } from "lucide-react";
import { getOrCreatePlanning } from "@/actions/planning";
import { getReviewQueue } from "@/actions/revisoes";
import { ReviewCard } from "@/components/revisoes/review-card";

export default async function RevisoesPage() {
  const planning = await getOrCreatePlanning();
  const queue = await getReviewQueue(planning.id);

  const overdue = queue.filter((q) => q.daysUntilDue < 0);
  const dueToday = queue.filter((q) => q.daysUntilDue === 0);
  const upcoming = queue.filter((q) => q.daysUntilDue > 0);

  const stats = [
    {
      label: "Atrasadas",
      value: overdue.length,
      icon: AlertTriangle,
      color: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950",
    },
    {
      label: "Vencem hoje",
      value: dueToday.length,
      icon: CalendarCheck2,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      label: "Próximas",
      value: upcoming.length,
      icon: CalendarClock,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Revisões</h1>
        <p className="text-muted-foreground">
          Tópicos prontos para revisão. Revisão&nbsp;1 acontece 10 dias após o estudo,
          Revisão&nbsp;2 acontece 30 dias após o estudo.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
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

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <BookMarked className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <p className="text-lg font-medium">Nenhuma revisão pendente</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Quando você concluir o estudo de um subtópico, ele aparecerá aqui após
            o período de espera.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {overdue.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" aria-hidden="true" />
                Atrasadas
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {overdue.map((item) => (
                  <ReviewCard key={item.topicId} planningId={planning.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {dueToday.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CalendarCheck2 className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                Vencem hoje
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {dueToday.map((item) => (
                  <ReviewCard key={item.topicId} planningId={planning.id} item={item} />
                ))}
              </div>
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CalendarClock className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                Próximas
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((item) => (
                  <ReviewCard key={item.topicId} planningId={planning.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
