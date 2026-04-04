import { getOrCreatePlanning } from "@/actions/planning";
import { getAvailability } from "@/actions/availability";
import { getSubjects } from "@/actions/subjects";
import { getSessions } from "@/actions/scheduler";
import { db } from "@/db";
import { subjects, topics } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { PlanningClient } from "./planning-client";

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
  const [availability, subjectsWithTopics, sessions] = await Promise.all([
    getAvailability(planning.id),
    getSubjects(planning.id),
    getSessions(planning.id),
  ]);

  const monday = getMonday();
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return formatDate(d);
  });

  // Flat lists for session card display
  const allSubjects = await db
    .select()
    .from(subjects)
    .where(eq(subjects.planningId, planning.id))
    .orderBy(asc(subjects.nome));

  const subjectIds = allSubjects.map((s) => s.id);
  const allTopics =
    subjectIds.length > 0
      ? (await db.select().from(topics).orderBy(asc(topics.nome))).filter((t) =>
          subjectIds.includes(t.subjectId)
        )
      : [];

  return (
    <PlanningClient
      planningId={planning.id}
      availability={availability}
      sessions={sessions}
      subjects={subjectsWithTopics}
      allSubjects={allSubjects}
      allTopics={allTopics}
      weekDates={weekDates}
    />
  );
}
