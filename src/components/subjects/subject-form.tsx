"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { createSubject, updateSubject } from "@/actions/subjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  SUBJECT_COLORS,
  SUBJECT_COLOR_KEYS,
  type SubjectColorKey,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Subject } from "@/types";

interface SubjectFormProps {
  planningId: string;
  subject?: Subject;
  onSuccess?: () => void;
}

export function SubjectForm({ planningId, subject, onSuccess }: SubjectFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!subject;
  const [color, setColor] = useState<SubjectColorKey>(
    (subject?.cor as SubjectColorKey | undefined) ?? "blue"
  );

  function handleSubmit(formData: FormData) {
    if (!isEditing) {
      formData.set("planningId", planningId);
    }
    formData.set("cor", color);

    startTransition(async () => {
      const result = isEditing
        ? await updateSubject(subject.id, formData)
        : await createSubject(formData);

      if (result.success) {
        toast.success(isEditing ? "Matéria atualizada!" : "Matéria criada!");
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome da Matéria</Label>
        <Input
          id="nome"
          name="nome"
          placeholder="Ex: Direito Constitucional"
          defaultValue={subject?.nome ?? ""}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Cor</Label>
        <div className="flex flex-wrap gap-2">
          {SUBJECT_COLOR_KEYS.map((key) => {
            const palette = SUBJECT_COLORS[key];
            const selected = color === key;
            return (
              <button
                key={key}
                type="button"
                aria-label={palette.label}
                aria-pressed={selected}
                onClick={() => setColor(key)}
                className={cn(
                  "relative h-8 w-8 rounded-full transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  palette.swatch,
                  selected && "ring-2 ring-ring ring-offset-2"
                )}
                title={palette.label}
              >
                {selected && (
                  <Check className="absolute inset-0 m-auto h-4 w-4 text-white" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          A cor é usada no cronograma e nos cards para diferenciar matérias.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prioridade">Prioridade</Label>
          <select
            id="prioridade"
            name="prioridade"
            defaultValue={subject?.prioridade ?? "media"}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="peso">Peso (1-10)</Label>
          <Input
            id="peso"
            name="peso"
            type="number"
            min={1}
            max={10}
            defaultValue={subject?.peso ?? 5}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          placeholder="Notas sobre a matéria..."
          defaultValue={subject?.observacoes ?? ""}
          rows={3}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Salvando..." : isEditing ? "Atualizar Matéria" : "Criar Matéria"}
      </Button>
    </form>
  );
}
