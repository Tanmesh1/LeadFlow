import { useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  Filter,
  Flame,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { EmptyState } from "@/components/common/empty-state";
import { LeadCard } from "@/components/leads/lead-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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

const closedStatuses: LeadStatus[] = ["won", "lost"];

const crmFilters: Array<{ label: string; value: FilterKey }> = [
  { label: "All", value: "all" },
  { label: "Today", value: "today" },
  { label: "Overdue", value: "overdue" },
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Proposal Sent", value: "proposal_sent" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
];

export function DashboardPage() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");

  const filters = useMemo<LeadFilters>(
    () => ({
      search: search.trim() || undefined,
    }),
    [search],
  );

  const leadsQuery = useLeads(filters);
  const leads = leadsQuery.data ?? [];

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

    const filteredLeads = leads.filter(matchesFilter);
    const todayLeads = filteredLeads.filter(
      (lead) =>
        activeStatuses.includes(lead.status) &&
        isToday(lead.nextFollowUp) &&
        !lead.isOverdue,
    );

    return {
      stats: {
        total: leads.length,
        today: leads.filter(
          (lead) => activeStatuses.includes(lead.status) && isToday(lead.nextFollowUp),
        ).length,
        overdue: leads.filter((lead) => lead.isOverdue).length,
        won: leads.filter((lead) => lead.status === "won").length,
      },
      counts: crmFilters.reduce(
        (accumulator, item) => {
          accumulator[item.value] = leads.filter((lead) => {
            if (item.value === "all") {
              return true;
            }

            if (item.value === "today") {
              return (
                activeStatuses.includes(lead.status) && isToday(lead.nextFollowUp)
              );
            }

            if (item.value === "overdue") {
              return lead.isOverdue;
            }

            return lead.status === item.value;
          }).length;

          return accumulator;
        },
        {} as Record<FilterKey, number>,
      ),
      sections: [
        {
          title: "Overdue Follow-ups",
          description: "Leads that need immediate attention.",
          leads: filteredLeads.filter((lead) => lead.isOverdue),
          icon: Flame,
        },
        {
          title: "Today's Follow-ups",
          description: "Scheduled conversations for today.",
          leads: todayLeads,
          icon: CalendarClock,
        },
        {
          title: "Active Pipeline",
          description: "Open opportunities moving through the CRM.",
          leads: filteredLeads.filter(
            (lead) =>
              activeStatuses.includes(lead.status) &&
              !lead.isOverdue &&
              !isToday(lead.nextFollowUp),
          ),
          icon: Target,
        },
        {
          title: "Closed Leads",
          description: "Won and lost opportunities.",
          leads: filteredLeads.filter((lead) => closedStatuses.includes(lead.status)),
          icon: CheckCircle2,
        },
      ],
    };
  }, [activeFilter, leads]);

  return (
    <AppLayout searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold tracking-normal sm:text-3xl">
            Lead Dashboard
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Track follow-ups, active opportunities, and closed outcomes in one CRM view.
          </p>
        </section>

        <StatsRow stats={dashboardData.stats} isLoading={leadsQuery.isLoading} />

        <section className="rounded-lg border bg-background p-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="size-4 text-muted-foreground" aria-hidden="true" />
              Filters
            </div>
            <div className="flex flex-wrap gap-2">
              {crmFilters.map((item) => (
                <Button
                  key={item.value}
                  variant={activeFilter === item.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveFilter(item.value)}
                >
                  {item.label}
                  <span className="ml-1 rounded bg-background/80 px-1.5 py-0.5 text-[11px] text-foreground">
                    {dashboardData.counts[item.value] ?? 0}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </section>

        <Separator />

        <div className="space-y-8">
          {dashboardData.sections.map((section) => (
            <LeadSection
              key={section.title}
              title={section.title}
              description={section.description}
              leads={section.leads}
              icon={section.icon}
              isLoading={leadsQuery.isLoading}
              error={leadsQuery.error}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

type StatsRowProps = {
  stats: {
    total: number;
    today: number;
    overdue: number;
    won: number;
  };
  isLoading: boolean;
};

function StatsRow({ stats, isLoading }: StatsRowProps) {
  const items: Array<{
    label: string;
    value: number;
    icon: LucideIcon;
    tone?: string;
  }> = [
    { label: "Total leads", value: stats.total, icon: Users },
    { label: "Today's follow-ups", value: stats.today, icon: CalendarClock },
    {
      label: "Overdue leads",
      value: stats.overdue,
      icon: Flame,
      tone: "text-destructive",
    },
    { label: "Won leads", value: stats.won, icon: CheckCircle2 },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {item.label}
            </CardTitle>
            <item.icon className={`size-4 ${item.tone ?? "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-semibold tracking-normal">{item.value}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

type LeadSectionProps = {
  title: string;
  description: string;
  leads: Lead[];
  icon: LucideIcon;
  isLoading: boolean;
  error: unknown;
};

function LeadSection({
  title,
  description,
  leads,
  icon: Icon,
  isLoading,
  error,
}: LeadSectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="text-sm text-muted-foreground">{leads.length} leads</span>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      ) : (
        <EmptyState
          title={`No ${title.toLowerCase()}`}
          description="Matching leads will appear here automatically."
          icon={Icon}
          className="min-h-48"
        />
      )}
    </section>
  );
}

function SectionSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="p-5">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="mt-2 h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4 p-5 pt-0">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
