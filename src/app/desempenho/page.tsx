export const dynamic = "force-dynamic";

import { getOrCreatePlanning } from "@/actions/planning";
import { getQuizStats } from "@/actions/simulado";
import {
  getStudyTimeBySubject,
  getPerformanceOverTime,
  getWeakAreas,
} from "@/actions/desempenho";
import { PerformanceChart } from "@/components/desempenho/performance-chart";
import { StudyTimeChart } from "@/components/desempenho/study-time-chart";
import { WeakAreasCard } from "@/components/desempenho/weak-areas-card";
import { BANCA_LABELS } from "@/lib/constants";
import { Target, TrendingUp, AlertTriangle, Clock } from "lucide-react";

export default async function DesempenhoPage() {
  const planning = await getOrCreatePlanning();

  const [quizStats, studyTime, performanceData, weakAreas] = await Promise.all([
    getQuizStats(planning.id),
    getStudyTimeBySubject(planning.id),
    getPerformanceOverTime(planning.id),
    getWeakAreas(planning.id),
  ]);

  const totalStudyMin = studyTime.reduce((acc, s) => acc + s.minutos, 0);
  const totalStudyHours = Math.floor(totalStudyMin / 60);
  const totalStudyRemainMin = totalStudyMin % 60;

  const hasQuizData = quizStats.totalQuizzes > 0;
  const hasStudyData = studyTime.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Desempenho</h1>
        <p className="text-muted-foreground">
          Acompanhe sua evolução nos estudos e simulados.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Tempo Total de Estudo</p>
            <div className="rounded-lg p-2 bg-blue-50 dark:bg-blue-950">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">
            {totalStudyHours > 0 ? `${totalStudyHours}h` : ""}
            {totalStudyRemainMin > 0 ? `${totalStudyRemainMin}min` : ""}
            {totalStudyMin === 0 ? "0 min" : ""}
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Simulados Realizados</p>
            <div className="rounded-lg p-2 bg-indigo-50 dark:bg-indigo-950">
              <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">{quizStats.totalQuizzes}</p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Acerto Médio</p>
            <div className="rounded-lg p-2 bg-green-50 dark:bg-green-950">
              <Target className="h-4 w-4 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">{quizStats.averageScore}%</p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Questões Respondidas</p>
            <div className="rounded-lg p-2 bg-amber-50 dark:bg-amber-950">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-bold tabular-nums">{quizStats.totalQuestions}</p>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance over time */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Evolução nos Simulados</h2>
          {hasQuizData && performanceData.length > 1 ? (
            <PerformanceChart data={performanceData} />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Complete pelo menos 2 simulados para ver o gráfico de evolução.
            </p>
          )}
        </div>

        {/* Study time by subject */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Tempo por Matéria</h2>
          {hasStudyData ? (
            <StudyTimeChart data={studyTime} />
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Complete sessões de estudo para ver a distribuição de tempo.
            </p>
          )}
        </div>
      </div>

      {/* Performance by banca */}
      {Object.keys(quizStats.byBanca).length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Desempenho por Banca</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(quizStats.byBanca).map(([banca, data]) => (
              <div key={banca} className="rounded-lg border p-4">
                <p className="text-sm font-medium">
                  {BANCA_LABELS[banca as keyof typeof BANCA_LABELS] ?? banca}
                </p>
                <div className="mt-2 flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{data.avg}%</p>
                    <p className="text-xs text-muted-foreground">
                      {data.correct}/{data.total} acertos
                    </p>
                  </div>
                  <div className="h-12 w-12">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle
                        cx="18" cy="18" r="16"
                        fill="none" stroke="currentColor"
                        className="text-muted/20" strokeWidth="3"
                      />
                      <circle
                        cx="18" cy="18" r="16"
                        fill="none" stroke="currentColor"
                        className={data.avg >= 70 ? "text-green-500" : data.avg >= 50 ? "text-amber-500" : "text-red-500"}
                        strokeWidth="3"
                        strokeDasharray={`${data.avg} ${100 - data.avg}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weak areas */}
      {weakAreas.length > 0 && <WeakAreasCard weakAreas={weakAreas} />}

      {/* Performance by subject */}
      {Object.keys(quizStats.bySubject).length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-semibold">Desempenho por Matéria</h2>
          <div className="space-y-3">
            {Object.entries(quizStats.bySubject)
              .sort(([, a], [, b]) => a.avg - b.avg)
              .map(([id, data]) => (
                <div key={id} className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{data.nome}</p>
                    <div className="mt-1 h-2 w-full rounded-full bg-secondary">
                      <div
                        className={`h-2 rounded-full transition-[width] duration-500 ${
                          data.avg >= 70 ? "bg-green-500" : data.avg >= 50 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${data.avg}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold tabular-nums">{data.avg}%</p>
                    <p className="text-xs text-muted-foreground">
                      {data.correct}/{data.total}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
