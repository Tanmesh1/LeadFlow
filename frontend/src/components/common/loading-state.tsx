import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="w-full">
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-3/4" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
