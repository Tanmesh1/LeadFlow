import { CalendarClock, Clock3, MessageSquare } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LeadStatusBadge } from "@/components/leads/lead-status-badge";
import { cn } from "@/utils/cn";
import { formatDateTime, formatRelativeTime } from "@/utils/date";
import type { Lead } from "@/types/lead";

type LeadCardProps = {
  lead: Lead;
};

export function LeadCard({ lead }: LeadCardProps) {
  const activityAt = lead.lastDiscussionAt ?? lead.updatedAt ?? lead.createdAt;

  return (
    <Card
      className={cn(
        "h-full transition-colors",
        lead.isOverdue && "border-destructive/40 bg-destructive/5",
      )}
    >
      <CardHeader className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="truncate">{lead.name}</CardTitle>
            <CardDescription className="mt-1 truncate">
              {lead.company || lead.source || "Unassigned account"}
            </CardDescription>
          </div>
          <LeadStatusBadge status={lead.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-5 pt-0">
        <div className="rounded-md bg-background/70 p-3">
          <div className="flex items-start gap-2 text-sm">
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="line-clamp-3 leading-6 text-foreground">
              {lead.lastDiscussion || "No discussion logged yet."}
            </p>
          </div>
        </div>

        <div className="grid gap-2 text-sm text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            <Clock3 className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{formatRelativeTime(activityAt)}</span>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
            <span className={lead.isOverdue ? "font-medium text-destructive" : ""}>
              {lead.isOverdue ? "Overdue: " : "Next: "}
              {formatDateTime(lead.nextFollowUp)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
