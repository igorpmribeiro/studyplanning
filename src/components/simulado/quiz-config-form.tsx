"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BancaSelector } from "./banca-selector";
import { QUIZ_MODE_LABELS } from "@/lib/constants";
import { startQuizSession } from "@/actions/simulado";
import { toast } from "sonner";
import { Loader2, Play } from "lucide-react";
import type { SubjectWithTopics } from "@/types";

export function QuizConfigForm({
  planningId,
  subjects,
}: {
  planningId: string;
  subjects: SubjectWithTopics[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [banca, setBanca] = useState("cespe");
  const [modo, setModo] = useState("misto");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [totalQuestoes, setTotalQuestoes] = useState("10");

  const showSubjectSelector = modo === "por_materia" || modo === "por_topico";
  const showTopicSelector = modo === "por_topico" && selectedSubjects.length > 0;

  const availableTopics = subjects
    .filter((s) => selectedSubjects.includes(s.id))
    .flatMap((s) => s.topics.map((t) => ({ ...t, subjectNome: s.nome })));

  function toggleSubject(id: string) {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
    setSelectedTopics([]);
  }

  function toggleTopic(id: string) {
    setSelectedTopics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    if (modo === "por_materia" && selectedSubjects.length === 0) {
      toast.error("Selecione pelo menos uma matéria.");
      return;
    }
    if (modo === "por_topico" && selectedTopics.length === 0) {
      toast.error("Selecione pelo menos um tópico.");
      return;
    }

    startTransition(async () => {
      const result = await startQuizSession({
        planningId,
        banca,
        modo,
        subjectIds: modo === "por_materia" ? selectedSubjects : undefined,
        topicIds: modo === "por_topico" ? selectedTopics : undefined,
        totalQuestoes: Number(totalQuestoes),
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      // Store questions in sessionStorage for the quiz page to pick up
      sessionStorage.setItem(
        `quiz-${result.data.sessionId}`,
        JSON.stringify(result.data.questions)
      );
      router.push(`/simulado/${result.data.sessionId}`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Banca */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Banca</Label>
        <BancaSelector value={banca} onChange={setBanca} />
      </div>

      {/* Modo */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Modo</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.entries(QUIZ_MODE_LABELS) as [string, string][]).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setModo(key);
                setSelectedSubjects([]);
                setSelectedTopics([]);
              }}
              className={`rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                modo === key
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border bg-card text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Subject Selector */}
      {showSubjectSelector && (
        <div className="space-y-3">
          <Label className="text-base font-semibold">
            {modo === "por_topico" ? "Matéria (selecione para ver tópicos)" : "Matérias"}
          </Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                onClick={() => toggleSubject(subject.id)}
                className={`rounded-lg border-2 px-4 py-3 text-left text-sm transition-all hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selectedSubjects.includes(subject.id)
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <p className="font-medium truncate">{subject.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {subject.topics.length} tópicos
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Topic Selector */}
      {showTopicSelector && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Tópicos</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setSelectedTopics(
                  selectedTopics.length === availableTopics.length
                    ? []
                    : availableTopics.map((t) => t.id)
                )
              }
            >
              {selectedTopics.length === availableTopics.length
                ? "Desmarcar todos"
                : "Selecionar todos"}
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto rounded-lg border p-2">
            {availableTopics.map((topic) => (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleTopic(topic.id)}
                className={`rounded-md border px-3 py-2 text-left text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  selectedTopics.includes(topic.id)
                    ? "border-primary bg-primary/5"
                    : "border-transparent hover:bg-accent"
                }`}
              >
                <p className="font-medium truncate">{topic.nome}</p>
                <p className="text-xs text-muted-foreground">{topic.subjectNome}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantidade e Iniciar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Label className="text-base font-semibold">Questões</Label>
          <Select value={totalQuestoes} onValueChange={(v) => v && setTotalQuestoes(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20, 30, 50].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} questões
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isPending}
          size="lg"
          className="gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Gerando questões...
            </>
          ) : (
            <>
              <Play className="h-4 w-4" aria-hidden="true" />
              Iniciar Simulado
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
