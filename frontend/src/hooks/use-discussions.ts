import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createDiscussion, getDiscussions } from "@/api/discussions";
import { leadKeys } from "@/hooks/use-leads";
import type { DiscussionCreateInput } from "@/types/discussion";

export const discussionKeys = {
  all: ["discussions"] as const,
  byLead: (leadId: string) => [...discussionKeys.all, leadId] as const,
};

export function useDiscussions(leadId?: string) {
  return useQuery({
    queryKey: discussionKeys.byLead(leadId ?? ""),
    queryFn: () => getDiscussions(leadId ?? ""),
    enabled: Boolean(leadId),
  });
}

export function useCreateDiscussion(leadId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DiscussionCreateInput) =>
      createDiscussion(leadId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: discussionKeys.byLead(leadId),
      });
      void queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
  });
}
