import { Bell, CalendarClock, Clock3, MessageSquare } from "lucide-react";
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
  onClick?: (lead: Lead) => void;
};

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const activityAt = lead.lastDiscussionAt ?? lead.updatedAt ?? lead.createdAt;

  return (
    <Card
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Open ${lead.name} timeline`}
      onClick={() => onClick?.(lead)}
      onKeyDown={(event) => {
        if (!onClick) {
          return;
        }

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(lead);
        }
      }}
      className={cn(
        "group h-full overflow-hidden transition-all duration-200",
        onClick &&
          "cursor-pointer hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        lead.isOverdue && "border-destructive/30 bg-destructive/5",
      )}
    >
      <CardHeader className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="min-w-0">
              <CardTitle className="truncate text-base sm:text-lg">
                {lead.name}
              </CardTitle>
              <CardDescription className="mt-1 truncate">
                {lead.company || lead.source || "Unassigned account"}
              </CardDescription>
            </div>
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="size-4 shrink-0" aria-hidden="true" />
              <p className="truncate">
                <span className="font-semibold text-foreground">Last Note:</span>{" "}
                {lead.lastDiscussion || "No discussion logged yet."}
              </p>
            </div>
          </div>
          <LeadStatusBadge status={lead.status} />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5">
          <div className="flex min-w-0 items-center gap-2">
            <Clock3 className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{formatRelativeTime(activityAt)}</span>
          </div>
          {lead.nextFollowUp ? (
            <div
              className={cn(
                "inline-flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold",
                lead.isOverdue
                  ? "bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary",
              )}
            >
              {lead.isOverdue ? (
                <Bell className="size-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
              )}
              <span className="truncate">
                {lead.isOverdue ? "Overdue: " : "Follow-up: "}
                {formatDateTime(lead.nextFollowUp)}
              </span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
