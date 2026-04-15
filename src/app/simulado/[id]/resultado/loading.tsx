import { Skeleton } from "@/components/ui/skeleton";

export default function ResultadoLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-32 rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
    </div>
  );
}
