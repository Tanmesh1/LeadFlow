import { Badge } from "@/components/ui/badge";
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
  const variant = status === "won" || status === "lost" ? "secondary" : "default";

  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}
