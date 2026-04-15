export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList } from "lucide-react";
import { getSubjectById } from "@/actions/subjects";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TopicList } from "@/components/topics/topic-list";
import { PRIORIDADE_LABELS } from "@/lib/constants";

const prioridadeColors = {
  baixa: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  media: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  alta: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
} as const;

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const subject = await getSubjectById(id);

  if (!subject) notFound();

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/materias">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Matérias
          </Button>
        </Link>
      </div>

      {/* Subject Header */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{subject.nome}</h1>
              <Badge
                variant="secondary"
                className={prioridadeColors[subject.prioridade]}
              >
                {PRIORIDADE_LABELS[subject.prioridade]}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
              <span>Peso: {subject.peso}</span>
              <span>{subject.topics.length} subtópicos</span>
            </div>
            {subject.observacoes && (
              <p className="mt-3 text-sm text-muted-foreground">{subject.observacoes}</p>
            )}
          </div>
          {subject.topics.length > 0 && (
            <Button
              render={<Link href={`/simulado?modo=por_materia&subjectId=${subject.id}`} />}
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
            >
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Praticar
            </Button>
          )}
        </div>
      </div>

      {/* Topics */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Subtópicos</h2>
        <TopicList topics={subject.topics} subjectId={subject.id} />
      </div>
    </div>
  );
}
