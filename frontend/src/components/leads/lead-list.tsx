import { Users } from "lucide-react";
import { EmptyState } from "@/components/common/empty-state";
import { LoadingState } from "@/components/common/loading-state";
import { LeadCard } from "@/components/leads/lead-card";
import { getApiErrorMessage } from "@/api/client";
import type { Lead } from "@/types/lead";

type LeadListProps = {
  leads?: Lead[];
  isLoading: boolean;
  error: unknown;
};

export function LeadList({ leads, isLoading, error }: LeadListProps) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to load leads"
        description={getApiErrorMessage(error)}
        icon={Users}
      />
    );
  }

  if (!leads?.length) {
    return (
      <EmptyState
        title="No leads found"
        description="New leads will appear here as soon as they are added."
        icon={Users}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {leads.map((lead) => (
        <LeadCard key={lead.id} lead={lead} />
      ))}
    </div>
  );
}
