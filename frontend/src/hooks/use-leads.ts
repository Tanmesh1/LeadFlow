import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryKey } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/api/client";
import { createLead, getLeads, updateLead } from "@/api/leads";
import { useToast } from "@/components/ui/toast";
import type {
  Lead,
  LeadCreateInput,
  LeadFilters,
  LeadUpdateInput,
} from "@/types/lead";

export const leadKeys = {
  all: ["leads"] as const,
  lists: () => [...leadKeys.all, "list"] as const,
  list: (filters: LeadFilters) => [...leadKeys.lists(), filters] as const,
};

export function useLeads(filters: LeadFilters = {}) {
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: () => getLeads(filters),
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: LeadCreateInput) => createLead(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: leadKeys.all });

      const previousLists = queryClient.getQueriesData<Lead[]>({
        queryKey: leadKeys.lists(),
      });
      const optimisticLead = createOptimisticLead(payload);

      previousLists.forEach(([queryKey, currentLeads]) => {
        if (!currentLeads) {
          return;
        }

        const filters = getFiltersFromLeadListKey(queryKey);

        if (!matchesLeadFilters(optimisticLead, filters)) {
          return;
        }

        queryClient.setQueryData<Lead[]>(queryKey, [optimisticLead, ...currentLeads]);
      });

      return { optimisticLead, previousLists };
    },
    onSuccess: (createdLead, _payload, context) => {
      replaceLeadInCachedLists(
        queryClient,
        context?.previousLists,
        (lead) => lead.id === context?.optimisticLead.id,
        createdLead,
      );
      toast({ title: "Lead created", variant: "success" });
    },
    onError: (_error, _payload, context) => {
      context?.previousLists.forEach(([queryKey, leads]) => {
        queryClient.setQueryData(queryKey, leads);
      });
      toast({
        title: "Unable to create lead",
        description: getApiErrorMessage(_error),
        variant: "error",
      });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LeadUpdateInput }) =>
      updateLead(id, payload),
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: leadKeys.all });

      const previousLists = queryClient.getQueriesData<Lead[]>({
        queryKey: leadKeys.lists(),
      });

      updateLeadInCachedLists(queryClient, id, (lead) => ({
        ...lead,
        ...payload,
        updatedAt: new Date().toISOString(),
      }));

      return { previousLists };
    },
    onSuccess: (updatedLead) => {
      updateLeadInCachedLists(queryClient, updatedLead.id, () => updatedLead);
      toast({ title: "Lead updated", variant: "success" });
    },
    onError: (error, _variables, context) => {
      context?.previousLists.forEach(([queryKey, leads]) => {
        queryClient.setQueryData(queryKey, leads);
      });
      toast({
        title: "Unable to update lead",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}

function createOptimisticLead(payload: LeadCreateInput): Lead {
  const now = new Date().toISOString();

  return {
    id: `optimistic-${crypto.randomUUID()}`,
    name: payload.name,
    company: payload.company ?? null,
    phone: payload.phone ?? null,
    email: payload.email ?? null,
    source: payload.source ?? null,
    notes: payload.notes ?? null,
    status: payload.status ?? "new",
    lastDiscussion: null,
    lastDiscussionAt: null,
    nextFollowUp: null,
    isOverdue: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function getFiltersFromLeadListKey(queryKey: readonly unknown[]) {
  const maybeFilters = queryKey[2];

  if (!maybeFilters || typeof maybeFilters !== "object") {
    return {};
  }

  return maybeFilters as LeadFilters;
}

export function matchesLeadFilters(lead: Lead, filters: LeadFilters = {}) {
  if (filters.status && lead.status !== filters.status) {
    return false;
  }

  if (filters.overdue && !lead.isOverdue) {
    return false;
  }

  if (filters.today) {
    return false;
  }

  if (filters.search) {
    const search = filters.search.toLowerCase();
    const searchable = [
      lead.name,
      lead.company,
      lead.phone,
      lead.email,
      lead.source,
      lead.notes,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(search);
  }

  return true;
}

export function updateLeadInCachedLists(
  queryClient: ReturnType<typeof useQueryClient>,
  leadId: string,
  updater: (lead: Lead) => Lead,
) {
  queryClient
    .getQueriesData<Lead[]>({ queryKey: leadKeys.lists() })
    .forEach(([queryKey, leads]) => {
      if (!leads) {
        return;
      }

      const filters = getFiltersFromLeadListKey(queryKey);
      const nextLeads = leads
        .map((lead) => (lead.id === leadId ? updater(lead) : lead))
        .filter((lead) => matchesLeadFilters(lead, filters));

      queryClient.setQueryData(queryKey, nextLeads);
    });
}

function replaceLeadInCachedLists(
  queryClient: ReturnType<typeof useQueryClient>,
  previousLists: Array<[QueryKey, Lead[] | undefined]> | undefined,
  predicate: (lead: Lead) => boolean,
  replacement: Lead,
) {
  previousLists?.forEach(([queryKey, leads]) => {
    if (!leads) {
      return;
    }

    const filters = getFiltersFromLeadListKey(queryKey);
    const withoutOptimistic = leads.filter((lead) => !predicate(lead));
    const shouldInclude = matchesLeadFilters(replacement, filters);

    queryClient.setQueryData<Lead[]>(
      queryKey,
      shouldInclude ? [replacement, ...withoutOptimistic] : withoutOptimistic,
    );
  });
}
