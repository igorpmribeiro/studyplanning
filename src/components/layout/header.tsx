"use client";

import { usePathname } from "next/navigation";
import { MobileSidebar } from "./mobile-sidebar";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/materias": "Matérias",
  "/planejamento": "Planejamento",
};

export function Header() {
  const pathname = usePathname();

  const title =
    pageTitles[pathname] ??
    (pathname.startsWith("/materias/") ? "Detalhes da Matéria" : "");

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
      <MobileSidebar />
      <h2 className="text-lg font-semibold">{title}</h2>
    </header>
  );
}
