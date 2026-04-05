"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { addManualSession } from "@/actions/scheduler";
import { toast } from "sonner";
import type { Subject, Topic } from "@/types";

interface AddSessionProps {
  planningId: string;
  dayIndex: number;
  date: string;
  subjects: Subject[];
  topics: Topic[];
}

export function AddSession({ planningId, dayIndex, date, subjects, topics }: AddSessionProps) {
  const [open, setOpen] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [duration, setDuration] = useState(60);
  const [isPending, startTransition] = useTransition();

  // Group topics by subject, filtering out completed ones
  const topicsBySubject = new Map<string, Topic[]>();
  for (const topic of topics) {
    if (topic.status === "concluido") continue;
    const list = topicsBySubject.get(topic.subjectId) ?? [];
    list.push(topic);
    topicsBySubject.set(topic.subjectId, list);
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  function handleSubmit() {
    if (!selectedTopicId) {
      toast.error("Selecione um subtopico");
      return;
    }

    startTransition(async () => {
      const result = await addManualSession(planningId, selectedTopicId, dayIndex, date, duration);
      if (result.success) {
        toast.success("Sessao adicionada!");
        setOpen(false);
        setSelectedTopicId("");
        setDuration(60);
      } else {
        toast.error(result.error);
      }
    });
  }

  // When a topic is selected, set duration to its estimated time
  function handleTopicChange(topicId: string) {
    setSelectedTopicId(topicId);
    const topic = topics.find((t) => t.id === topicId);
    if (topic) setDuration(topic.tempoEstimadoMin);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground" />
      }>
        <Plus className="mr-1 h-3 w-3" />
        Adicionar
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Sessao</DialogTitle>
          <DialogDescription>
            Adicione manualmente uma sessao de estudo para este dia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="topic-select">Subtopico</Label>
            <select
              id="topic-select"
              value={selectedTopicId}
              onChange={(e) => handleTopicChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Selecione...</option>
              {Array.from(topicsBySubject.entries()).map(([subjectId, subjectTopics]) => {
                const subject = subjectMap.get(subjectId);
                return (
                  <optgroup key={subjectId} label={subject?.nome ?? "—"}>
                    {subjectTopics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} ({t.tempoEstimadoMin} min)
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duracao (minutos)</Label>
            <Input
              id="duration"
              type="number"
              min={5}
              max={480}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>

          <Button onClick={handleSubmit} disabled={isPending} className="w-full">
            {isPending ? "Adicionando..." : "Adicionar Sessao"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
