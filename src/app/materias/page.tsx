import { getOrCreatePlanning } from "@/actions/planning";
import { getSubjects } from "@/actions/subjects";
import { SubjectList } from "@/components/subjects/subject-list";

export default async function MateriasPage() {
  const planning = await getOrCreatePlanning();
  const subjects = await getSubjects(planning.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Matérias</h1>
        <p className="text-muted-foreground">
          Cadastre e organize suas matérias e subtópicos.
        </p>
      </div>

      <SubjectList subjects={subjects} planningId={planning.id} />
    </div>
  );
}
