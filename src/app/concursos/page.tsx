import { getOrCreatePlanning } from "@/actions/planning";
import { getConcursos } from "@/actions/concursos";
import { getSubjects } from "@/actions/subjects";
import { ConcursoList } from "@/components/concursos/concurso-list";

export default async function ConcursosPage() {
  const planning = await getOrCreatePlanning();
  const [concursos, subjects] = await Promise.all([
    getConcursos(planning.id),
    getSubjects(planning.id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Concursos</h1>
        <p className="text-muted-foreground">
          Cadastre seus concursos e vincule as materias a cada prova.
        </p>
      </div>

      <ConcursoList
        concursos={concursos}
        allSubjects={subjects}
        planningId={planning.id}
      />
    </div>
  );
}
