"use client";

import { usePathname } from "next/navigation";
import { MobileSidebar } from "./mobile-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/concursos": "Concursos",
  "/materias": "Matérias",
  "/planejamento": "Planejamento",
  "/revisoes": "Revisões",
  "/simulado": "Simulado",
  "/desempenho": "Desempenho",
};

interface HeaderProps {
  badges?: { revisoes?: number };
}

export function Header({ badges }: HeaderProps) {
  const pathname = usePathname();

  const title =
    pageTitles[pathname] ??
    (pathname.startsWith("/materias/") ? "Detalhes da Matéria" : "");

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <MobileSidebar badges={badges} />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <ThemeToggle />
    </header>
  );
}
