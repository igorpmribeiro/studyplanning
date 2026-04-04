"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateSchedule } from "@/actions/scheduler";
import { toast } from "sonner";

interface GenerateButtonProps {
  planningId: string;
  hasSessions: boolean;
  selectedSubjectIds?: string[];
}

export function GenerateButton({ planningId, hasSessions, selectedSubjectIds }: GenerateButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleGenerate() {
    if (hasSessions && !confirm("Isso substituirá as sessões pendentes. Continuar?")) return;

    startTransition(async () => {
      const result = await generateSchedule(planningId, undefined, selectedSubjectIds);
      if (result.success) {
        toast.success(`Planejamento gerado! ${result.data.length} sessões criadas.`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Button onClick={handleGenerate} disabled={isPending}>
      {hasSessions ? (
        <>
          <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "Regenerando..." : "Regenerar Planejamento"}
        </>
      ) : (
        <>
          <CalendarDays className="mr-2 h-4 w-4" />
          {isPending ? "Gerando..." : "Gerar Planejamento"}
        </>
      )}
    </Button>
  );
}
