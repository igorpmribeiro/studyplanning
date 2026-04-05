"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createConcurso, updateConcurso } from "@/actions/concursos";
import { toast } from "sonner";
import type { Concurso } from "@/types";

interface ConcursoFormProps {
  planningId: string;
  concurso?: Concurso;
  onSuccess?: () => void;
}

export function ConcursoForm({ planningId, concurso, onSuccess }: ConcursoFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    if (!concurso) formData.set("planningId", planningId);

    startTransition(async () => {
      const result = concurso
        ? await updateConcurso(concurso.id, formData)
        : await createConcurso(formData);

      if (result.success) {
        toast.success(concurso ? "Concurso atualizado!" : "Concurso cadastrado!");
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Concurso</Label>
        <Input
          id="nome"
          name="nome"
          placeholder="Ex: TJ-SP 2026"
          defaultValue={concurso?.nome ?? ""}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dataProva">Data da Prova</Label>
        <Input
          id="dataProva"
          name="dataProva"
          type="date"
          defaultValue={concurso?.dataProva ?? ""}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Salvando\u2026" : concurso ? "Salvar" : "Cadastrar"}
      </Button>
    </form>
  );
}
