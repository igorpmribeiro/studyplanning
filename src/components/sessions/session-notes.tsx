"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { saveSessionNotes } from "@/actions/scheduler";
import { toast } from "sonner";
import { StickyNote } from "lucide-react";

export function SessionNotes({
  sessionId,
  initialNotes,
}: {
  sessionId: string;
  initialNotes: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await saveSessionNotes(sessionId, notes);
      if (result.success) {
        toast.success("Anotação salva");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const hasNotes = !!initialNotes;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 shrink-0 ${hasNotes ? "text-amber-500" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"} transition-opacity`}
            aria-label={hasNotes ? "Ver anotações" : "Adicionar anotação"}
          />
        }
      >
        <StickyNote className="h-3.5 w-3.5" aria-hidden="true" />
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Anotações da Sessão</DialogTitle>
        <div className="mt-2 space-y-4">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anote dúvidas, insights ou observações sobre esta sessão..."
            rows={4}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <DialogClose render={<Button variant="outline" size="sm" />}>
              Cancelar
            </DialogClose>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
