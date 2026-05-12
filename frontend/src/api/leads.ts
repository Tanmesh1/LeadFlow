import { apiClient } from "@/api/client";
import type {
  Lead,
  LeadCreateInput,
  LeadFilters,
  LeadUpdateInput,
} from "@/types/lead";

export async function getLeads(filters: LeadFilters = {}) {
  const response = await apiClient.get<Lead[]>("/api/leads", {
    params: filters,
  });

  return response.data;
}

export async function createLead(payload: LeadCreateInput) {
  const response = await apiClient.post<Lead>("/api/leads", payload);

  return response.data;
}

export async function updateLead(id: string, payload: LeadUpdateInput) {
  const response = await apiClient.patch<Lead>(`/api/leads/${id}`, payload);

  return response.data;
}
