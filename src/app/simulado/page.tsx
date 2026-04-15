export const dynamic = "force-dynamic";

import { getOrCreatePlanning } from "@/actions/planning";
import { getSubjects } from "@/actions/subjects";
import { getQuizHistory, getQuizStats } from "@/actions/simulado";
import { QuizConfigForm } from "@/components/simulado/quiz-config-form";
import { RecentQuizzes } from "@/components/simulado/recent-quizzes";
import { BANCA_LABELS, QUIZ_MODE_LABELS } from "@/lib/constants";

export default async function SimuladoPage() {
  const planning = await getOrCreatePlanning();
  const [subjects, history, stats] = await Promise.all([
    getSubjects(planning.id),
    getQuizHistory(planning.id),
    getQuizStats(planning.id),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Simulado</h1>
        <p className="text-muted-foreground">
          Pratique com questões no estilo das bancas de concurso.
        </p>
      </div>

      {/* Stats summary */}
      {stats.totalQuizzes > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Simulados Realizados</p>
            <p className="text-2xl font-bold tabular-nums">{stats.totalQuizzes}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Questões Respondidas</p>
            <p className="text-2xl font-bold tabular-nums">{stats.totalQuestions}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">Acerto Médio</p>
            <p className="text-2xl font-bold tabular-nums">{stats.averageScore}%</p>
          </div>
        </div>
      )}

      {/* Quiz config */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Novo Simulado</h2>
        {subjects.length === 0 ? (
          <p className="text-muted-foreground">
            Cadastre matérias e tópicos primeiro para iniciar um simulado.
          </p>
        ) : (
          <QuizConfigForm planningId={planning.id} subjects={subjects} />
        )}
      </div>

      {/* Recent quizzes */}
      {history.length > 0 && (
        <RecentQuizzes sessions={history.slice(0, 5)} />
      )}
    </div>
  );
}
