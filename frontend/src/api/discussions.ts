import { apiClient } from "@/api/client";
import type {
  Discussion,
  DiscussionCreateInput,
} from "@/types/discussion";

export async function getDiscussions(leadId: string) {
  const response = await apiClient.get<Discussion[]>(
    `/api/leads/${leadId}/discussions`,
  );

  return response.data;
}

export async function createDiscussion(
  leadId: string,
  payload: DiscussionCreateInput,
) {
  const response = await apiClient.post<Discussion>(
    `/api/leads/${leadId}/discussions`,
    payload,
  );

  return response.data;
}
