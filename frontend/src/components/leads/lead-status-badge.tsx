import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import type { LeadStatus } from "@/types/lead";

const statusLabels: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal_sent: "Proposal",
  won: "Won",
  lost: "Lost",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "shrink-0",
        status === "new" && "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "contacted" && "border-amber-200 bg-amber-50 text-amber-700",
        status === "qualified" && "border-sky-200 bg-sky-50 text-sky-700",
        status === "proposal_sent" && "border-violet-200 bg-violet-50 text-violet-700",
        status === "won" && "border-slate-200 bg-slate-100 text-slate-700",
        status === "lost" && "border-rose-200 bg-rose-50 text-rose-700",
      )}
    >
      {statusLabels[status]}
    </Badge>
  );
}
