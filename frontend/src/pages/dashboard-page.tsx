import { useMemo, useState } from "react";
import { Inbox, Pin } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { EmptyState } from "@/components/common/empty-state";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";
import { LeadCard } from "@/components/leads/lead-card";
import { LeadTimelineDialog } from "@/components/leads/lead-timeline-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeads } from "@/hooks/use-leads";
import { isToday } from "@/utils/date";
import type { Lead, LeadFilters, LeadStatus } from "@/types/lead";

type FilterKey = "all" | "today" | "overdue" | LeadStatus;

const activeStatuses: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
];

const crmFilters: Array<{ label: string; value: FilterKey }> = [
  { label: "All", value: "all" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Proposal Sent", value: "proposal_sent" },
];

export function DashboardPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const filters = useMemo<LeadFilters>(
    () => ({
      search: search.trim() || undefined,
    }),
    [search],
  );

  const leadsQuery = useLeads(filters);
  const leads = useMemo(() => leadsQuery.data ?? [], [leadsQuery.data]);
  const selectedLead =
    leads.find((lead) => lead.id === selectedLeadId) ??
    (selectedLeadId ? null : null);

  const dashboardData = useMemo(() => {
    const matchesFilter = (lead: Lead) => {
      if (activeFilter === "all") {
        return true;
      }

      if (activeFilter === "today") {
        return activeStatuses.includes(lead.status) && isToday(lead.nextFollowUp);
      }

      if (activeFilter === "overdue") {
        return lead.isOverdue;
      }

      return lead.status === activeFilter;
    };

    const visibleLeads = leads.filter(matchesFilter);
    const todayLeads = visibleLeads.filter(
      (lead) =>
        activeStatuses.includes(lead.status) &&
        isToday(lead.nextFollowUp) &&
        !lead.isOverdue,
    );
    const allLeads = visibleLeads.filter((lead) => !todayLeads.includes(lead));

    return {
      sections: [
        {
          title: "Today's Follow-ups",
          description: "Priority conversations due today.",
          leads: todayLeads,
          icon: Pin,
          featured: true,
        },
        {
          title: "All Leads",
          description: "Every lead matching the selected view.",
          leads: allLeads,
          icon: Inbox,
        },
      ],
    };
  }, [activeFilter, leads]);

  return (
    <AppLayout
      searchValue={search}
      onSearchChange={setSearch}
      onAddLead={() => setIsAddLeadOpen(true)}
    >
      <div className="space-y-8">
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="sr-only">LeadFlow dashboard</h1>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Filters
            </p>
          </div>
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0">
            <div className="flex min-w-max flex-wrap gap-2">
              {crmFilters.map((item) => (
                <Button
                  key={item.value}
                  variant={activeFilter === item.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(item.value)}
                  aria-pressed={activeFilter === item.value}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          </div>
        </section>

        <div className="space-y-7">
          {dashboardData.sections.map((section) => (
            <LeadSection
              key={section.title}
              title={section.title}
              description={section.description}
              leads={section.leads}
              icon={section.icon}
              featured={section.featured}
              isLoading={leadsQuery.isLoading}
              error={leadsQuery.error}
              onLeadClick={(lead) => setSelectedLeadId(lead.id)}
            />
          ))}
        </div>
      </div>
      <AddLeadDialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen} />
      <LeadTimelineDialog
        lead={selectedLead}
        open={Boolean(selectedLeadId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedLeadId(null);
          }
        }}
      />
    </AppLayout>
  );
}

type LeadSectionProps = {
  title: string;
  description: string;
  leads: Lead[];
  icon: LucideIcon;
  featured?: boolean;
  isLoading: boolean;
  error: unknown;
  onLeadClick: (lead: Lead) => void;
};

function LeadSection({
  title,
  description,
  leads,
  icon: Icon,
  featured = false,
  isLoading,
  error,
  onLeadClick,
}: LeadSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
            <Icon className="size-3.5" aria-hidden="true" />
            <h2>{title}</h2>
          </div>
          <p className="sr-only">{description}</p>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {leads.length} {leads.length === 1 ? "lead" : "leads"}
        </span>
      </div>

      {isLoading ? (
        <SectionSkeleton />
      ) : error ? (
        <EmptyState
          title="Unable to load leads"
          description="Refresh the page or check that the API server is running."
          icon={Icon}
        />
      ) : leads.length ? (
        <div className="grid gap-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onLeadClick} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${title.toLowerCase()}`}
          description={
            featured
              ? "Scheduled follow-ups for today will land here."
              : "Matching leads will appear here as soon as they are added."
          }
          icon={Icon}
          className="min-h-44"
        />
      )}
    </section>
  );
}

function SectionSkeleton() {
  return (
    <div className="grid gap-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="rounded-lg border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="w-full max-w-xl">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-3 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
