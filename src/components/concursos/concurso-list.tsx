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
import { ConcursoForm } from "./concurso-form";
import { ConcursoCard } from "./concurso-card";
import { LinkSubjects } from "./link-subjects";
import type { ConcursoWithSubjects, SubjectWithTopics } from "@/types";

interface ConcursoListProps {
  concursos: ConcursoWithSubjects[];
  allSubjects: SubjectWithTopics[];
  planningId: string;
}

export function ConcursoList({ concursos, allSubjects, planningId }: ConcursoListProps) {
  const [open, setOpen] = useState(false);
  const [editingConcurso, setEditingConcurso] = useState<ConcursoWithSubjects | null>(null);
  const [linkingConcurso, setLinkingConcurso] = useState<ConcursoWithSubjects | null>(null);

  function handleEdit(concurso: ConcursoWithSubjects) {
    setEditingConcurso(concurso);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditingConcurso(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {concursos.length} {concursos.length === 1 ? "concurso cadastrado" : "concursos cadastrados"}
        </p>
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else setOpen(true); }}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Concurso
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingConcurso ? "Editar Concurso" : "Novo Concurso"}
              </DialogTitle>
              <DialogDescription>
                {editingConcurso
                  ? "Altere os dados do concurso."
                  : "Cadastre um novo concurso."}
              </DialogDescription>
            </DialogHeader>
            <ConcursoForm
              planningId={planningId}
              concurso={editingConcurso ?? undefined}
              onSuccess={handleClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {concursos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <p className="text-lg font-medium">Nenhum concurso cadastrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre seus concursos para organizar as materias por prova.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {concursos.map((concurso) => (
            <div key={concurso.id}>
              <ConcursoCard concurso={concurso} onEdit={handleEdit} />
              <div className="mt-2 px-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setLinkingConcurso(concurso)}
                >
                  Vincular Materias
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Link subjects dialog */}
      <Dialog
        open={!!linkingConcurso}
        onOpenChange={(isOpen) => { if (!isOpen) setLinkingConcurso(null); }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular Materias</DialogTitle>
            <DialogDescription>
              Selecione as materias que pertencem ao concurso &ldquo;{linkingConcurso?.nome}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          {linkingConcurso && (
            <LinkSubjects
              concursoId={linkingConcurso.id}
              allSubjects={allSubjects}
              linkedSubjectIds={linkingConcurso.subjects.map((s) => s.id)}
              onDone={() => setLinkingConcurso(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
