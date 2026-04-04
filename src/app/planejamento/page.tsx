import { getOrCreatePlanning } from "@/actions/planning";
import { getAvailability } from "@/actions/availability";
import { getSessions } from "@/actions/scheduler";
import { db } from "@/db";
import { subjects, topics } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { AvailabilityForm } from "@/components/availability/availability-form";
import { WeeklyView } from "@/components/sessions/weekly-view";
import { GenerateButton } from "./generate-button";

function getMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export default async function PlanejamentoPage() {
  const planning = await getOrCreatePlanning();
  const availability = await getAvailability(planning.id);
  const sessions = await getSessions(planning.id);

  // Calculate week dates for drag and drop
  const monday = getMonday();
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return formatDate(d);
  });

  // Load subjects and topics for display in session cards
  const allSubjects = await db
    .select()
    .from(subjects)
    .where(eq(subjects.planningId, planning.id))
    .orderBy(asc(subjects.nome));

  const subjectIds = allSubjects.map((s) => s.id);
  const allTopics =
    subjectIds.length > 0
      ? await db.select().from(topics).orderBy(asc(topics.nome))
      : [];

  // Filter topics belonging to this planning's subjects
  const relevantTopics = allTopics.filter((t) =>
    subjectIds.includes(t.subjectId)
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planejamento</h1>
        <p className="text-muted-foreground">
          Configure sua disponibilidade e gere seu cronograma semanal.
        </p>
      </div>

      {/* Disponibilidade Semanal */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Disponibilidade Semanal</h2>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <AvailabilityForm planningId={planning.id} availability={availability} />
        </div>
      </section>

      {/* Gerar Planejamento */}
      <section className="flex items-center gap-3">
        <GenerateButton planningId={planning.id} hasSessions={sessions.length > 0} />
      </section>

      {/* Cronograma Semanal */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cronograma Semanal</h2>
        <WeeklyView
          sessions={sessions}
          subjects={allSubjects}
          topics={relevantTopics}
          weekDates={weekDates}
        />
      </section>
    </div>
  );
}
