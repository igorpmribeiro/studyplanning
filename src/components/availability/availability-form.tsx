"use client";

import { useTransition } from "react";
import { upsertAvailability } from "@/actions/availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { DIA_SEMANA_LABELS } from "@/lib/constants";
import type { WeeklyAvailability } from "@/types";

interface AvailabilityFormProps {
  planningId: string;
  availability: WeeklyAvailability | null;
}

const dayFields = [
  { key: "segundaMin", day: 0 },
  { key: "tercaMin", day: 1 },
  { key: "quartaMin", day: 2 },
  { key: "quintaMin", day: 3 },
  { key: "sextaMin", day: 4 },
  { key: "sabadoMin", day: 5 },
  { key: "domingoMin", day: 6 },
] as const;

export function AvailabilityForm({ planningId, availability }: AvailabilityFormProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    formData.set("planningId", planningId);

    startTransition(async () => {
      const result = await upsertAvailability(formData);
      if (result.success) {
        toast.success("Disponibilidade salva!");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {dayFields.map(({ key, day }) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={key} className="text-xs">
              {DIA_SEMANA_LABELS[day]}
            </Label>
            <div className="relative">
              <Input
                id={key}
                name={key}
                type="number"
                min={0}
                max={1440}
                defaultValue={availability?.[key] ?? 0}
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                min
              </span>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={isPending} variant="outline" size="sm">
        {isPending ? "Salvando..." : "Salvar Disponibilidade"}
      </Button>
    </form>
  );
}
