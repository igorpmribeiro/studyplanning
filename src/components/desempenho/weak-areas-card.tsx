import { AlertTriangle } from "lucide-react";

export function WeakAreasCard({
  weakAreas,
}: {
  weakAreas: {
    topicNome: string;
    subjectNome: string;
    total: number;
    correct: number;
    pct: number;
  }[];
}) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-4 w-4 text-amber-500" aria-hidden="true" />
        <h2 className="font-semibold">Pontos Fracos</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Tópicos com menor taxa de acerto nos simulados (mín. 2 questões).
      </p>
      <div className="space-y-3">
        {weakAreas.map((area) => (
          <div key={area.topicNome} className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{area.topicNome}</p>
              <p className="text-xs text-muted-foreground truncate">{area.subjectNome}</p>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold tabular-nums ${
                area.pct >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
              }`}>
                {area.pct}%
              </p>
              <p className="text-xs text-muted-foreground">
                {area.correct}/{area.total}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
