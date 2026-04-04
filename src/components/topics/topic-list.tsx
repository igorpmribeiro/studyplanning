"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Clock, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TopicForm } from "./topic-form";
import { deleteTopic } from "@/actions/topics";
import { toast } from "sonner";
import { DIFICULDADE_LABELS, STATUS_LABELS } from "@/lib/constants";
import type { Topic } from "@/types";

const dificuldadeColors = {
  baixa: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  media: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  alta: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
} as const;

const statusColors = {
  nao_iniciado: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  em_andamento: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  revisando: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  concluido: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
} as const;

interface TopicListProps {
  topics: Topic[];
  subjectId: string;
}

export function TopicList({ topics, subjectId }: TopicListProps) {
  const [open, setOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [deletingId, startDeleteTransition] = useTransition();

  function handleEdit(topic: Topic) {
    setEditingTopic(topic);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setEditingTopic(null);
  }

  function handleDelete(topic: Topic) {
    if (!confirm(`Excluir "${topic.nome}"?`)) return;

    startDeleteTransition(async () => {
      const result = await deleteTopic(topic.id);
      if (result.success) {
        toast.success("Subtópico excluído!");
      } else {
        toast.error(result.error);
      }
    });
  }

  const totalMinutes = topics.reduce((acc, t) => acc + t.tempoEstimadoMin, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{topics.length} subtópicos</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {totalMinutes} min total
          </span>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); else setOpen(true); }}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Subtópico
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTopic ? "Editar Subtópico" : "Novo Subtópico"}
              </DialogTitle>
              <DialogDescription>
                {editingTopic
                  ? "Altere os dados do subtópico."
                  : "Cadastre um novo subtópico nesta matéria."}
              </DialogDescription>
            </DialogHeader>
            <TopicForm
              subjectId={subjectId}
              topic={editingTopic ?? undefined}
              onSuccess={handleClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
          <p className="font-medium">Nenhum subtópico cadastrado</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Adicione os subtópicos desta matéria.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {topics.map((topic) => (
            <div
              key={topic.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{topic.nome}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {topic.tempoEstimadoMin} min
                  </span>
                  <Badge variant="secondary" className={`text-xs ${dificuldadeColors[topic.dificuldade]}`}>
                    <BarChart3 className="mr-1 h-3 w-3" />
                    {DIFICULDADE_LABELS[topic.dificuldade]}
                  </Badge>
                  <Badge variant="secondary" className={`text-xs ${statusColors[topic.status]}`}>
                    {STATUS_LABELS[topic.status]}
                  </Badge>
                </div>
                {topic.observacoes && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                    {topic.observacoes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(topic)} className="h-8 w-8">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(topic)}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
