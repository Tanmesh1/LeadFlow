import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage } from "@/api/client";
import { createDiscussion, getDiscussions } from "@/api/discussions";
import { useToast } from "@/components/ui/toast";
import { updateLeadInCachedLists } from "@/hooks/use-leads";
import type { Discussion, DiscussionCreateInput } from "@/types/discussion";
import type { LeadStatus } from "@/types/lead";

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
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: DiscussionCreateInput) =>
      createDiscussion(leadId, payload),
    onMutate: async (payload) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: discussionKeys.byLead(leadId) }),
        queryClient.cancelQueries({ queryKey: ["leads"] }),
      ]);

      const discussionKey = discussionKeys.byLead(leadId);
      const previousDiscussions =
        queryClient.getQueryData<Discussion[]>(discussionKey);
      const previousLeadLists = queryClient.getQueriesData({
        queryKey: ["leads", "list"],
      });

      const optimisticDiscussion = createOptimisticDiscussion(leadId, payload);
      queryClient.setQueryData<Discussion[]>(discussionKey, [
        optimisticDiscussion,
        ...(previousDiscussions ?? []),
      ]);

      updateLeadInCachedLists(queryClient, leadId, (lead) => {
        const nextFollowUp = payload.followUpAt ?? lead.nextFollowUp;

        return {
          ...lead,
          lastDiscussion: payload.content,
          lastDiscussionAt: optimisticDiscussion.createdAt,
          nextFollowUp,
          isOverdue: getIsOverdue(nextFollowUp, lead.status),
          updatedAt: optimisticDiscussion.createdAt,
        };
      });

      return { optimisticDiscussion, previousDiscussions, previousLeadLists };
    },
    onSuccess: (discussion, _payload, context) => {
      queryClient.setQueryData<Discussion[]>(
        discussionKeys.byLead(leadId),
        (current = []) =>
          current.map((item) =>
            item.id === context?.optimisticDiscussion.id ? discussion : item,
          ),
      );

      updateLeadInCachedLists(queryClient, leadId, (lead) => {
        const nextFollowUp = discussion.followUpAt ?? lead.nextFollowUp;

        return {
          ...lead,
          lastDiscussion: discussion.content,
          lastDiscussionAt: discussion.createdAt,
          nextFollowUp,
          isOverdue: getIsOverdue(nextFollowUp, lead.status),
          updatedAt: discussion.updatedAt,
        };
      });

      toast({ title: "Discussion added", variant: "success" });
    },
    onError: (error, _payload, context) => {
      queryClient.setQueryData(
        discussionKeys.byLead(leadId),
        context?.previousDiscussions,
      );
      context?.previousLeadLists.forEach(([queryKey, leads]) => {
        queryClient.setQueryData(queryKey, leads);
      });
      toast({
        title: "Unable to add discussion",
        description: getApiErrorMessage(error),
        variant: "error",
      });
    },
  });
}

function createOptimisticDiscussion(
  leadId: string,
  payload: DiscussionCreateInput,
): Discussion {
  const now = new Date().toISOString();

  return {
    id: `optimistic-${crypto.randomUUID()}`,
    leadId,
    content: payload.content,
    createdBy: payload.createdBy ?? null,
    followUpAt: payload.followUpAt ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

function getIsOverdue(value: string | null | undefined, status: LeadStatus) {
  if (!value || status === "won" || status === "lost") {
    return false;
  }

  return new Date(value).getTime() < Date.now();
}
