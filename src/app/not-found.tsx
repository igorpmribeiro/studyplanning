import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="mt-4 text-lg font-medium">Página não encontrada</p>
      <p className="mt-1 text-sm text-muted-foreground">
        A página que você procura não existe.
      </p>
      <Link href="/" className="mt-6">
        <Button>Voltar ao início</Button>
      </Link>
    </div>
  );
}
