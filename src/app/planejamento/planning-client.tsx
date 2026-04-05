"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AvailabilityForm } from "@/components/availability/availability-form";
import { SubjectSelector } from "@/components/subjects/subject-selector";
import { SubjectForm } from "@/components/subjects/subject-form";
import { WeeklyView } from "@/components/sessions/weekly-view";
import { GenerateButton } from "./generate-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type {
  WeeklyAvailability,
  PlannedSession,
  Subject,
  SubjectWithTopics,
  Topic,
} from "@/types";

interface PlanningClientProps {
  planningId: string;
  availability: WeeklyAvailability | null;
  sessions: PlannedSession[];
  subjects: SubjectWithTopics[];
  allSubjects: Subject[];
  allTopics: Topic[];
  weekDates: string[];
}

export function PlanningClient({
  planningId,
  availability,
  sessions,
  subjects,
  allSubjects,
  allTopics,
  weekDates,
}: PlanningClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    subjects.map((s) => s.id)
  );
  const [addOpen, setAddOpen] = useState(false);

  function handleToggle(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function handleSelectAll() {
    setSelectedIds(subjects.map((s) => s.id));
  }

  function handleDeselectAll() {
    setSelectedIds([]);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Planejamento</h1>
        <p className="text-muted-foreground">
          Configure sua disponibilidade, selecione as matérias e gere seu cronograma semanal.
        </p>
      </div>

      {/* Disponibilidade Semanal */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Disponibilidade Semanal</h2>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <AvailabilityForm planningId={planningId} availability={availability} />
        </div>
      </section>

      {/* Seleção de Matérias */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Matérias da Semana</h2>
            <p className="text-sm text-muted-foreground">
              Selecione quais matérias deseja focar nesta semana.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger render={<Button size="sm" variant="outline" />}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Matéria</DialogTitle>
                  <DialogDescription>
                    Cadastre uma nova matéria no seu planejamento.
                  </DialogDescription>
                </DialogHeader>
                <SubjectForm
                  planningId={planningId}
                  onSuccess={() => setAddOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <SubjectSelector
            subjects={subjects}
            selectedIds={selectedIds}
            onToggle={handleToggle}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
          />
        </div>
      </section>

      {/* Gerar Planejamento */}
      <section className="flex items-center gap-3">
        <GenerateButton
          planningId={planningId}
          hasSessions={sessions.length > 0}
          selectedSubjectIds={selectedIds}
        />
        {selectedIds.length === 0 && (
          <p className="text-sm text-destructive">
            Selecione pelo menos uma matéria.
          </p>
        )}
      </section>

      {/* Cronograma Semanal */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cronograma Semanal</h2>
        <WeeklyView
          planningId={planningId}
          sessions={sessions}
          subjects={allSubjects}
          topics={allTopics}
          weekDates={weekDates}
        />
      </section>
    </div>
  );
}
