"use client";

import { useRef, useTransition } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importFromSpreadsheet } from "@/actions/import";
import { toast } from "sonner";

interface ImportButtonProps {
  planningId: string;
}

export function ImportButton({ planningId }: ImportButtonProps) {
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      const result = await importFromSpreadsheet(planningId, formData);

      if (result.success) {
        toast.success(
          `Importação concluída! ${result.data.materias} matérias e ${result.data.subtopicos} subtópicos importados.`,
          {
            description: result.data.details.join(" | "),
            duration: 6000,
          }
        );
      } else {
        toast.error(result.error);
      }

      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isPending}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isPending ? "Importando..." : "Importar Planilha"}
      </Button>
    </>
  );
}
