"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SubjectForm } from "./subject-form";
import { SubjectCard } from "./subject-card";
import type { SubjectWithTopics } from "@/types";

interface SubjectListProps {
  subjects: SubjectWithTopics[];
  planningId: string;
}

export function SubjectList({ subjects, planningId }: SubjectListProps) {
  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectWithTopics | null>(null);

  function handleEdit(subject: SubjectWithTopics) {
    setEditingSubject(subject);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditingSubject(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {subjects.length} {subjects.length === 1 ? "matéria cadastrada" : "matérias cadastradas"}
        </p>
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else setOpen(true); }}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Matéria
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? "Editar Matéria" : "Nova Matéria"}
              </DialogTitle>
              <DialogDescription>
                {editingSubject
                  ? "Altere os dados da matéria."
                  : "Cadastre uma nova matéria no seu planejamento."}
              </DialogDescription>
            </DialogHeader>
            <SubjectForm
              planningId={planningId}
              subject={editingSubject ?? undefined}
              onSuccess={handleClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <p className="text-lg font-medium">Nenhuma matéria cadastrada</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Comece adicionando suas matérias de estudo.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              subject={subject}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
}
