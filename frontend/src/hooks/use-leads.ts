import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLead, getLeads, updateLead } from "@/api/leads";
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

      return { previousLists };
    },
    onError: (_error, _payload, context) => {
      context?.previousLists.forEach(([queryKey, leads]) => {
        queryClient.setQueryData(queryKey, leads);
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LeadUpdateInput }) =>
      updateLead(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: leadKeys.all });
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

function getFiltersFromLeadListKey(queryKey: readonly unknown[]) {
  const maybeFilters = queryKey[2];

  if (!maybeFilters || typeof maybeFilters !== "object") {
    return {};
  }

  return maybeFilters as LeadFilters;
}

function matchesLeadFilters(lead: Lead, filters: LeadFilters = {}) {
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
