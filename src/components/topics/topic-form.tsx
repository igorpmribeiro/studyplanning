"use client";

import { useTransition } from "react";
import { createTopic, updateTopic } from "@/actions/topics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { Topic } from "@/types";

interface TopicFormProps {
  subjectId: string;
  topic?: Topic;
  onSuccess?: () => void;
}

export function TopicForm({ subjectId, topic, onSuccess }: TopicFormProps) {
  const [isPending, startTransition] = useTransition();
  const isEditing = !!topic;

  function handleSubmit(formData: FormData) {
    if (!isEditing) {
      formData.set("subjectId", subjectId);
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateTopic(topic.id, formData)
        : await createTopic(formData);

      if (result.success) {
        toast.success(isEditing ? "Subtópico atualizado!" : "Subtópico criado!");
        onSuccess?.();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nome">Nome do Subtópico</Label>
        <Input
          id="nome"
          name="nome"
          placeholder="Ex: Princípios Fundamentais"
          defaultValue={topic?.nome ?? ""}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tempoEstimadoMin">Tempo Estimado (min)</Label>
          <Input
            id="tempoEstimadoMin"
            name="tempoEstimadoMin"
            type="number"
            min={5}
            max={480}
            defaultValue={topic?.tempoEstimadoMin ?? 30}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dificuldade">Dificuldade</Label>
          <select
            id="dificuldade"
            name="dificuldade"
            defaultValue={topic?.dificuldade ?? "media"}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={topic?.status ?? "nao_iniciado"}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="nao_iniciado">Não iniciado</option>
          <option value="em_andamento">Em andamento</option>
          <option value="revisando">Revisando</option>
          <option value="concluido">Concluído</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          name="observacoes"
          placeholder="Notas sobre o subtópico..."
          defaultValue={topic?.observacoes ?? ""}
          rows={2}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? "Salvando..." : isEditing ? "Atualizar Subtópico" : "Criar Subtópico"}
      </Button>
    </form>
  );
}
